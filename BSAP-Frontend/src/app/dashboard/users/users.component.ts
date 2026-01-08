import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService, User, ApiResponse, Role, State, Range, Battalion } from '../../services/api.service';
import Districts from '../../models/Districts';
import { PerformanceStatisticService } from '../../services/performance-statistic.service';

@Component({
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.css'],
    standalone: false
})
export class UsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  
  showModal = false;
  currentUser: User = this.createEmptyUser();
  isEditMode = false;
  isLoading = false;
  
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  roles: Role[] = [];
  states: State[] = [];
  districts: Districts[] = [];
  ranges: Range[] = [];
  battalions: Battalion[] = [];

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  
  Math = Math;

  constructor(private apiService: ApiService,
      private performanceService: PerformanceStatisticService

  ) {}

  ngOnInit() {
    this.setupSearchDebouncing();
    this.loadUsers();
    this.loadDropdownData();
  
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private setupSearchDebouncing(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(500), 
        distinctUntilChanged() 
      )
      .subscribe((searchTerm: string) => {
        this.performSearch(searchTerm);
      });
  }


  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }


  private performSearch(searchTerm: string): void {
    this.currentPage = 1;
    this.loadUsers();
  }


  onSearch(): void {
    // this.searchSubject.next(this.searchTerm);
    this.currentPage = 1;
    this.updateFilteredData();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.apiService.getUsers(
      this.currentPage,
      this.itemsPerPage,
      this.searchTerm,
      this.getSortByField(),
      this.sortDirection
    ).subscribe({
      next: (response: ApiResponse<User[]>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.users = response.data || [];
          this.totalItems = response.pagination?.total || 0;
          this.totalPages = response.pagination?.totalPages || 0;
          this.updateFilteredData();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading users:', error);
      }
    });
  }

  loadDropdownData(): void {
    this.apiService.getActiveRoles().subscribe({
      next: (response: ApiResponse<Role[]>) => {
        if (response.status === 'SUCCESS') {
          this.roles = response.data || [];
        }
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      }
    });

    this.apiService.getActiveStates().subscribe({
      next: (response: ApiResponse<State[]>) => {
        if (response.status === 'SUCCESS') {
          this.states = response.data || [];
        }
      },
      error: (error) => {
        console.error('Error loading states:', error);
      }
    });

    // Load ranges
    this.apiService.getRanges(1, 100).subscribe({
      next: (response: ApiResponse<Range[]>) => {
        if (response.status === 'SUCCESS') {
          this.ranges = response.data || [];
        }
      },
      error: (error) => {
        console.error('Error loading ranges:', error);
      }
    });

    // Uncomment and implement if needed:
    // // Load ranges
    // this.apiService.getRanges().subscribe({
    //   next: (response: ApiResponse<Range[]>) => {
    //     if (response.status === 'SUCCESS') {
    //       this.ranges = response.data || [];
    //     }
    //   },
    //   error: (error) => {
    //     console.error('Error loading ranges:', error);
    //   }
    // });

  }

  loadBattalions(rangeId: number): void {
    this.apiService.getBattalionsByRange(rangeId).subscribe({
      next: (res) => {
        this.battalions = res.data || [];
        },
        error: (err) => {
          console.error('Error loading battalions by range:', err);
          this.battalions = [];
        }
      });
    
    
  }

  // /**
  //  * Load districts based on selected range
  //  */
  // loadDistricts(rangeId?: number): void {
  //   if (rangeId) {
  //     this.apiService.getDistricts(1, 100, '', '', '', undefined, rangeId).subscribe({
  //       next: (response: ApiResponse<District[]>) => {
  //         if (response.status === 'SUCCESS') {
  //           this.districts = response.data || [];
  //         }
  //       },
  //       error: (error) => {
  //         console.error('Error loading districts:', error);
  //       }
  //     });
  //   } else {
  //     this.districts = [];
  //   }
  // }

  private createEmptyUser(): User {
    return {
      id: 0,
      firstName: '',
      lastName: '',
      email: '',
      mobileNo: '',
      contactNo: '',
      userImage: '',
      stateId: undefined,
      rangeId: undefined,
      districtId: undefined,
      roleId: 0,
      password: '',
      verified: false,
      isFirst: true,
      joiningDate: '',
      endDate: '',
      numberSubdivision: 0,
      numberCircle: 0,
      numberPs: 0,
      numberOp: 0,
      active: true
    };
  }


  onFileSelect(event: any): void {
  const files = event.target.files;

  if (files && files.length > 0) {
    const file = files[0]; // single file
    this.currentUser.userImage = file;

    // Call the upload API
    this.uploadDocument(file);
  } else {
    this.currentUser.userImage = undefined;
  }
}

uploadDocument(file: File): void {
  const formData = new FormData();
  formData.append('file', file);

  this.performanceService.uploadDocument(file).subscribe({
    next: (response: any) => {
      if (response.status === 'SUCCESS') {
        const fileUrl = response.fileUrl; // Backend returns this
        console.log('Uploaded file URL:', fileUrl);
        this.currentUser.userImage = fileUrl;
      }
    },
    error: (err) => {
      console.error('File upload failed:', err);
    }
  });
}

  onPageSizeChange(): void {
    this.itemsPerPage = this.pageSize;
    this.currentPage = 1;
    this.loadUsers();
  }

  // private updateFilteredData(): void {
  //    if (this.searchTerm && this.searchTerm.trim()) {
  //     const term = this.searchTerm.toLowerCase();
  //     this.filteredUsers = this.users.filter(b =>
  //       b.firstName + b.lastName.toLowerCase().includes(term) ||
  //       // (b.range?.rangeName || '').toLowerCase().includes(term) ||
  //       (b.role|| '').toLowerCase().includes(term) ||
  //       (b.email || '').toLowerCase().includes(term) ||
  //       (b.range || '').toLowerCase().includes(term)
  //     );
  //     // When searching locally on current page, show filtered results only
  //     this.paginatedUsers = this.filteredUsers;
  //   } else {
  //     // No local search — show the server-provided page
  //     this.filteredUsers = this.users;
  //     this.paginatedUsers = this.users;
  //   }
  // }
  private updateFilteredData(): void {
  if (this.searchTerm && this.searchTerm.trim()) {
    const term = this.searchTerm.toLowerCase();
    
    this.filteredUsers = this.users.filter(user => {
      // Combine first and last name properly
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      
      // Get role name - handle both string and object
      const roleName = user.role 
        ? (typeof user.role === 'string' ? user.role : user.role.roleName || '').toLowerCase()
        : '';
      
      // Get range name - handle both string and object
      const rangeName = user.range 
        ? (typeof user.range === 'string' ? user.range : user.range.rangeName || '').toLowerCase()
        : '';
      
      // Get state name
      const stateName = user.state?.stateName?.toLowerCase() || '';
      
      // Get district name
      const districtName = user.district?.districtName?.toLowerCase() || '';
      
      // Get battalion name
      const battalionName = user.battalion?.battalionName?.toLowerCase() || '';
      
      // Check all searchable fields
      return fullName.includes(term) ||
             roleName.includes(term) ||
             (user.email || '').toLowerCase().includes(term) ||
             (user.mobileNo || '').includes(term) ||
             rangeName.includes(term) ||
             stateName.includes(term) ||
             districtName.includes(term) ||
             battalionName.includes(term);
    });
    
    // When searching locally on current page, show filtered results only
    this.paginatedUsers = this.filteredUsers;
  } else {
    // No local search — show the server-provided page
    this.filteredUsers = this.users;
    this.paginatedUsers = this.users;
  }
}

  private updatePaginatedData(): void {
    this.paginatedUsers = [...this.users]; 
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  getVisiblePages(): number[] {
    const visiblePages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, this.currentPage - halfVisible);
      let endPage = Math.min(this.totalPages, this.currentPage + halfVisible);
      
      if (this.currentPage <= halfVisible) {
        endPage = maxVisiblePages;
      } else if (this.currentPage > this.totalPages - halfVisible) {
        startPage = this.totalPages - maxVisiblePages + 1;
      }
      
      if (startPage > 1) {
        visiblePages.push(1);
        if (startPage > 2) {
          visiblePages.push(-1); 
        }
      }
      
      for (let i = startPage; i <= endPage; i++) {
        visiblePages.push(i);
      }
      
      if (endPage < this.totalPages) {
        if (endPage < this.totalPages - 1) {
          visiblePages.push(-1); 
        }
        visiblePages.push(this.totalPages);
      }
    }
    
    return visiblePages;
  }

  sortTable(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.loadUsers();
  }

  private getSortByField(): string {
    const fieldMap: { [key: string]: string } = {
      'id': 'id',
      'name': 'firstName',
      'email': 'email',
      'role': 'roleId',
      'phone': 'mobileNo',
      'department': 'districtId',
      'active': 'active'
    };
    return fieldMap[this.sortColumn] || 'firstName';
  }

  showAddUserModal(): void {
    this.isEditMode = false;
    this.currentUser = this.createEmptyUser();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentUser = this.createEmptyUser();
    this.isEditMode = false;
    this.districts = []; 
  }

  editUser(user: User): void {
    this.isEditMode = true;
    this.currentUser = { ...user };
    
    // Load districts if range is selected
    // if (this.currentUser.rangeId) {
    //   this.loadDistricts(this.currentUser.rangeId);
    // }
    
    this.showModal = true;
  }

  toggleUserStatus(user: User): void {
    this.apiService.toggleUserStatus(user.id, !user.active).subscribe({
      next: (response: ApiResponse<User>) => {
        if (response.status === 'SUCCESS') {
          const index = this.users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.users[index].active = !user.active;
          }
          this.updateFilteredData();
        }
      },
      error: (error) => {
        console.error('Error toggling user status:', error);
      }
    });
  }

  onRangeChange(rangeId: number): void {
    this.currentUser.rangeId = rangeId;
    // Optionally load districts for the selected range
    this.loadBattalions(rangeId);
    
  }

  onStateChange(stateId?: number): void {
    if (stateId) {
      this.apiService.getRanges(1, 100, '', '', '', stateId).subscribe({
        next: (res) => {
          this.ranges = res.data || [];
        },
        error: (err) => {
          console.error('Error loading ranges for state:', err);
          this.ranges = [];
        }
      });
    } else {
      this.ranges = [];
    }
  }

  // onDistrictChange(districtId?: number): void {
  //   if (districtId) {
  //     this.loadBattalions(undefined, districtId);
  //   } else {
  //     this.battalions = [];
  //   }
  // }

  onUserImageSelected(event: any): void {
    const file: File = event.target.files && event.target.files[0];
    if (!file) return;
    // Simple client-side validation
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      console.error('Invalid file type for user image');
      return;
    }

    // Convert to base64 or set to FormData when uploading via API
    const reader = new FileReader();
    reader.onload = () => {
      this.currentUser.userImage = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  addUser(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.apiService.createUser(this.currentUser).subscribe({
      next: (response: ApiResponse<User>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.closeModal();
          this.loadUsers(); 
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error creating user:', error);
      }
    });
  }

    updateUser(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.apiService.updateUser(this.currentUser.id, this.currentUser).subscribe({
      next: (response: ApiResponse<User>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          if (this.currentUser.password && this.currentUser.password.trim() !== '') {
            this.changePassword(this.currentUser.id, this.currentUser.password);
          } else {
            this.closeModal();
            this.loadUsers();
          }
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error updating user:', error);
      }
    });
    }

    changePassword(userId: number, newPassword: string): void {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    this.isLoading = true;
    this.apiService.changeUserPassword(userId, newPassword).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 'SUCCESS') {
          alert('Password updated successfully');
          this.closeModal();
          this.loadUsers();
        } else {
          alert(res.message || 'Password update failed');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error changing password:', err);
        alert(err.error?.message || 'Failed to change password');
      }
    });
  }

  get showingStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get showingEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  getRoleName(roleId: number): string {
    const role = this.roles.find(r => r.id === roleId);
    return role ? role.roleName : 'Unknown';
  }

  getStateName(stateId?: number): string {
    if (!stateId) return '-';
    const state = this.states.find(s => s.id === stateId);
    return state ? state.stateName : 'Unknown';
  }

  getDistrictName(districtId?: number): string {
    if (!districtId) return '-';
    const district = this.districts.find(d => d.id === districtId);
    return district ? district.districtName : 'Unknown';
  }

  getRangeName(rangeId?: number): string {
    if (!rangeId) return '-';
    const range = this.ranges.find(r => r.id === rangeId);
    return range ? range.rangeName : 'Unknown';
  }

  getBattalionName(battalionId?: number): string {
    if (!battalionId) return '-';
    const b = this.battalions.find(x => x.id === battalionId);
    return b ? b.battalionName : 'Unknown';
  }

  trackByUserId(index: number, user: User): number {
    return user.id;
  }
}