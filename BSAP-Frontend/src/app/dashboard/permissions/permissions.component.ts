
import { Component, OnInit } from '@angular/core';
import { ApiService, Permission, ApiResponse } from '../../services/api.service';

@Component({
    selector: 'app-permissions',
    templateUrl: './permissions.component.html',
    styleUrls: ['./permissions.component.css'],
    standalone: false
})
export class PermissionsComponent implements OnInit {
  permissions: Permission[] = [];
  filteredPermission:Permission[] = [];
  paginatedPermission : Permission[] = [];
   searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;

  showModal = false;
  isEditMode = false;
  isLoading = false;
  currentPermission: Permission = { id: 0, permissionName: '', permissionCode: '', permissionUrl: '', active: true };
  
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.isLoading = true;
    this.apiService.getPermissions(
    
      this.currentPage,
      this.pageSize,
      this.searchTerm.trim(),
      this.getSortByField(),
      this.sortDirection
    ).subscribe({
      next: (response: ApiResponse<Permission[]>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.permissions = response.data || [];
          this.paginatedPermission = [...this.permissions]
          this.totalItems = response.pagination?.total || 0;
          this.totalPages = response.pagination?.totalPages || 0;
        } 
        else {
          this.permissions = [];
          this.totalItems = 0;
          this.totalPages = 0;
        } 

     this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading permissions:', error);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.updateFilteredData();
  }


   private updateFilteredData() {
    // Apply optional client-side search on the current page of data
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      this.filteredPermission = this.permissions.filter(b =>
        b.permissionName.toLowerCase().includes(term) ||
        // (b.range?.rangeName || '').toLowerCase().includes(term) ||
        (b.permissionCode || '').toLowerCase().includes(term) 
       
      );
      // When searching locally on current page, show filtered results only
      this.paginatedPermission= this.filteredPermission;
    } else {
      // No local search — show the server-provided page
      this.filteredPermission = this.permissions;
      this.paginatedPermission = this.permissions;
    }
  }
  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadPermissions();
  }

  get paginatedPermissions(): Permission[] {
    return this.paginatedPermission;
  }

  get showingStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  showAddPermissionModal(): void {
    this.currentPermission = { id: 0, permissionName: '', permissionCode: '', permissionUrl: '', active: true };
    this.isEditMode = false;
    this.showModal = true;
  }

  editPermission(permission: Permission): void {
    this.currentPermission = { ...permission };
    this.isEditMode = true;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.currentPermission = { id: 0, permissionName: '', permissionCode: '', permissionUrl: '', active: true };
  }

  togglePermissionStatus(permission: Permission): void {
    this.apiService.togglePermissionStatus(permission.id, !permission.active).subscribe({
      next: (response: ApiResponse<Permission>) => {
        if (response.status === 'SUCCESS') {
          this.loadPermissions();
        }
      },
      error: (error) => {
        console.error('Error toggling permission status:', error);
      }
    });
  }

  sortTable(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadPermissions();
  }

  private getSortByField(): string {
    const fieldMap: { [key: string]: string } = {
      'id': 'id',
      'name': 'permissionName',
      'code': 'permissionCode',
      'url': 'permissionUrl',
      'active': 'active'
    };
    return fieldMap[this.sortColumn] || 'permissionName';
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPermissions();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPermissions();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadPermissions();
  }

  getVisiblePages(): number[] {
    const totalPages = this.totalPages;
    const current = this.currentPage;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(totalPages - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, -1);
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < totalPages - 1) {
      rangeWithDots.push(-1, totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((v, i, arr) => arr.indexOf(v) === i && v > 0);
  }

  addPermission(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.apiService.createPermission(this.currentPermission).subscribe({
      next: (response: ApiResponse<Permission>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.closeModal();
          this.loadPermissions();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error creating permission:', error);
      }
    });
  }

  updatePermission(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.apiService.updatePermission(this.currentPermission.id, this.currentPermission).subscribe({
      next: (response: ApiResponse<Permission>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.closeModal();
          this.loadPermissions();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error updating permission:', error);
      }
    });
  }

  trackByPermissionId(index: number, permission: Permission): number {
    return permission.id;
  }
}