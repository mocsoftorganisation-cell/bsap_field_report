import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiResponse, ApiService } from '../../services/api.service';
import Districts from '../../models/Districts';

@Component({
    selector: 'app-district-list',
    templateUrl: './district.component.html',
    styleUrls: ['./district.component.css'],
    standalone: false
})
export class DistrictComponent implements OnInit, OnDestroy {
  // Data properties
  districts: Districts[] = [];
  filteredDistricts: Districts[] = [];
  
  // Modal properties
  showModal = false;
  currentDistrict: Districts = this.createEmptyDistrict();
  isEditMode = false;
  isLoading = false;
  
  // Search and pagination properties
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Sorting properties
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Debouncing properties
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  
  // Math reference for template
  Math = Math;

    constructor(private apiService: ApiService) {}
  

  ngOnInit() {
    this.setupSearchDebouncing();
    this.loadDistricts();    
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  /**
   * Set up debounced search functionality
   */
  private setupSearchDebouncing(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(500), // Wait 500ms after last keystroke
        distinctUntilChanged() // Only search if value changed
      )
      .subscribe((searchTerm: string) => {
        this.performSearch(searchTerm);
      });
  }

  /**
   * Called when user types in search input
   */
  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Perform the actual search
   */
  private performSearch(searchTerm: string): void {
    this.currentPage = 1;
    this.loadDistricts();
  }

  /**
   * Clear search and reset
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadDistricts();
  }

  private loadDistricts() {
    this.isLoading = true;
    this.apiService.getDistricts(
      this.currentPage,
      this.itemsPerPage,
      this.searchTerm,
      this.sortColumn,
      this.sortDirection
    ).subscribe({
      next: (response: ApiResponse<Districts[]>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.districts = response.data || [];
          this.filteredDistricts = [...this.districts];
          this.totalItems = response.pagination?.total || 0;
          this.totalPages = response.pagination?.totalPages || 0;

        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading districts:', error);
      }
    });
  }

  private createEmptyDistrict(): Districts {
    return {
      id: 0,
      districtName: '',
      active: true
    };
  }

  // Manual search trigger
  onSearch() {
    this.searchSubject.next(this.searchTerm);
  }

  private updateFilteredData() {
    // Data is already filtered and paginated from the server
  }

  // Pagination functionality - handled server-side

  onPageSizeChange() {
    this.itemsPerPage = this.pageSize;
    this.currentPage = 1;
    this.loadDistricts();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDistricts();
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
          visiblePages.push(-1); // Ellipsis
        }
      }
      
      for (let i = startPage; i <= endPage; i++) {
        visiblePages.push(i);
      }
      
      if (endPage < this.totalPages) {
        if (endPage < this.totalPages - 1) {
          visiblePages.push(-1); // Ellipsis
        }
        visiblePages.push(this.totalPages);
      }
    }
    
    return visiblePages;
  }

  // Sorting functionality
  sortTable(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Reload data from API with new sorting
    this.loadDistricts();
  }

  // Modal functionality
  showAddDistrictModal(): void {
    this.isEditMode = false;
    this.currentDistrict = this.createEmptyDistrict();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentDistrict = this.createEmptyDistrict();
    this.isEditMode = false;
  }

  editDistrict(district: Districts): void {
    this.isEditMode = true;
    this.currentDistrict = { ...district };
    this.showModal = true;
  }

  toggleDistrictStatus(district: Districts): void {
    // if (!confirm('Are you sure you want to change the status of this district?')) return;
    
    // this.isLoading = true;
    
    // const apiCall = district.active
    //   ? this.apiService.deactivateDistrict(district.id)
    //   : this.apiService.activateDistrict(district.id);

    // apiCall.subscribe({
    //   next: (response: ApiResponse<Districts>) => {
    //     this.isLoading = false;
    //     if (response.status === 'SUCCESS') {
    //       this.loadDistricts();
    //     }
    //   },
    //   error: (error: any) => {
    //     this.isLoading = false;
    //     console.error('Error toggling district status:', error);
    //   }
    // });
  }

  addDistrict(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    // Only send the fields that exist in the database
    const districtData = {
      districtName: this.currentDistrict.districtName,
      active: this.currentDistrict.active
    };
    
    this.apiService.createDistrict(districtData).subscribe({
      next: (response: ApiResponse<Districts>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.closeModal();
          this.loadDistricts();
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error creating district:', error);
      }
    });
  }

  updateDistrict(): void {
    if (this.isLoading) return;
    
    if (!this.currentDistrict.id) {
      console.error('Cannot update district: ID is missing');
      return;
    }
    
    this.isLoading = true;
    
    // Only send the fields that can be updated
    const districtData = {
      districtName: this.currentDistrict.districtName,
      active: this.currentDistrict.active
    };
    
    console.log('Updating district:', {
      id: this.currentDistrict.id,
      data: districtData
    });
    
    this.apiService.updateDistrict(this.currentDistrict.id, districtData).subscribe({
      next: (response: ApiResponse<Districts>) => {
        this.isLoading = false;
        console.log('Update response:', response);
        if (response.status === 'SUCCESS') {
          // Check if the response data matches what we sent
          if (response.data) {
            console.log('Sent data:', districtData);
            console.log('Response data:', response.data);
            
            if (districtData.active !== response.data.active) {
              console.warn('Server returned different active status than sent!');
            }
          }
          
          this.closeModal();
          // Force reload to get fresh data from server
          this.loadDistricts();
        } else {
          console.error('Update failed with status:', response.status);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error updating district:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          url: error.url
        });
      }
    });
  }

  deleteDistrict(id: number): void {
    if (!confirm('Are you sure you want to delete this district? This action cannot be undone.')) return;
    
    this.isLoading = true;
    this.apiService.deleteDistrict(id).subscribe({
      next: (response: ApiResponse<any>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.loadDistricts();
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error deleting district:', error);
      }
    });
  }

  private getNextId(): number {
    return this.districts.length > 0 ? Math.max(...this.districts.map(d => d.id)) + 1 : 1;
  }

  // TrackBy function for performance
  trackByDistrictId(index: number, district: Districts): number {
    return district.id;
  }
}