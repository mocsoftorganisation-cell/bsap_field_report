import { Component, OnInit } from '@angular/core';
import { ApiService, ApiResponse } from '../../services/api.service';

interface LocalRange {
  id: number;
  stateId: number;
  rangeName: string;
  rangeHead: string;
  rangeContactNo: string;
  rangeMobileNo: string;
  rangeEmail: string;
  rangeDescription: string;
  rangeImage?: string;
  rangePersonImage?: string;
  active: boolean;
  createdBy?: number;
  updatedBy?: number;
  created_date?: string;
  updated_date?: string;
  state: {
    id: number;
    stateName: string;
  };
}

@Component({
    selector: 'app-range',
    templateUrl: './range.component.html',
    styleUrls: ['./range.component.css'],
    standalone: false
})
export class RangeComponent implements OnInit {
  // Data properties
  ranges: LocalRange[] = [];
  filteredRanges: LocalRange[] = [];
  paginatedRanges: LocalRange[] = [];
  
  // Modal properties
  showModal = false;
  currentRange: LocalRange = this.createEmptyRange();
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
  
  // Math reference for template
  Math = Math;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadRanges();
  }

  private loadRanges() {
    this.isLoading = true;
    this.apiService.getRanges(
      this.currentPage, 
      this.itemsPerPage,
      this.searchTerm,
      this.getSortByField(),
      this.sortDirection
    ).subscribe({
      next: (response: ApiResponse<any[]>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.ranges = response.data as LocalRange[] || [];
          this.totalItems = response.pagination?.total || 0;
          this.totalPages = response.pagination?.totalPages || 0;
          this.updateFilteredData();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading ranges:', error);
        // Handle error - show message to user
      }
    });
  }

  private createEmptyRange(): LocalRange {
    return {
      id: 0,
      stateId: 4, // Default stateId (will be overridden for edit mode)
      rangeName: '',
      rangeHead: '',
      rangeContactNo: '',
      rangeMobileNo: '',
      rangeEmail: '',
      rangeDescription: '',
      rangeImage: '',
      rangePersonImage: '',
      active: true,
      state: {
        id: 0,
        stateName: ''
      }
    };
  }

  // Get state name from state object
  getStateName(range: LocalRange): string {
    return range.state?.stateName || '';
  }

  // Search functionality
  onSearch() {
    this.currentPage = 1;
    this.loadRanges(); // Reload from API with search
  }

  private updateFilteredData() {
    // For client-side filtering (if needed)
    this.filteredRanges = [...this.ranges];
    this.updatePaginatedData();
  }

  // Pagination functionality
  private updatePaginatedData() {
    this.paginatedRanges = [...this.ranges]; // Already paginated from API
  }

  onPageSizeChange() {
    this.itemsPerPage = this.pageSize;
    this.currentPage = 1;
    this.loadRanges(); // Reload from API with new page size
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRanges(); // Reload from API for the new page
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

    // Reload from API with new sorting
    this.loadRanges();
  }

  private getSortByField(): string {
    // Map UI column names to API field names
    const fieldMap: { [key: string]: string } = {
      'id': 'id',
      'stateName': 'stateName',
      'rangeName': 'rangeName',
      'rangeHead': 'rangeHead',
      'active': 'active'
    };
    return fieldMap[this.sortColumn] || 'id';
  }

  // Modal functionality
  showAddRangeModal(): void {
    this.isEditMode = false;
    this.currentRange = this.createEmptyRange();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentRange = this.createEmptyRange();
    this.isEditMode = false;
  }

  editRange(range: LocalRange): void {
    this.isEditMode = true;
    this.currentRange = { ...range };
    this.showModal = true;
  }

  toggleRangeStatus(range: LocalRange): void {
    if (!confirm('Are you sure you want to change the status of this range?')) return;
    
    this.isLoading = true;
    
    const apiCall = range.active
      ? this.apiService.deactivateRange(range.id)
      : this.apiService.activateRange(range.id);

    apiCall.subscribe({
      next: (response: ApiResponse<any>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.loadRanges(); // Reload to get fresh data
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error toggling range status:', error);
      }
    });
  }

  addRange(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    // Only send the fields required by the backend for creation
    // stateId is hardcoded in the background for new ranges
    const rangeData = {
      stateId: 4, // Hardcoded stateId for new ranges
      rangeName: this.currentRange.rangeName,
      rangeHead: this.currentRange.rangeHead,
      rangeContactNo: this.currentRange.rangeContactNo,
      rangeMobileNo: this.currentRange.rangeMobileNo,
      rangeEmail: this.currentRange.rangeEmail,
      rangeDescription: this.currentRange.rangeDescription,
      rangeImage: this.currentRange.rangeImage || '',
      rangePersonImage: this.currentRange.rangePersonImage || ''
    };
    
    console.log('Creating range with data:', rangeData);
    
    this.apiService.createRange(rangeData).subscribe({
      next: (response: ApiResponse<any>) => {
        this.isLoading = false;
        console.log('Create response:', response);
        if (response.status === 'SUCCESS') {
          this.closeModal();
          this.loadRanges(); // Reload to get the latest data
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error creating range:', error);
        // Handle error - show message to user
      }
    });
  }

  updateRange(): void {
    if (this.isLoading) return;
    
    if (!this.currentRange.id) {
      console.error('Cannot update range: ID is missing');
      return;
    }
    
    this.isLoading = true;
    
    // Only send the fields that can be updated 
    // stateId is passed in background from existing range data
    const rangeData = {
      stateId: this.currentRange.stateId, // stateId from existing range (background)
      rangeName: this.currentRange.rangeName,
      rangeHead: this.currentRange.rangeHead,
      rangeContactNo: this.currentRange.rangeContactNo,
      rangeMobileNo: this.currentRange.rangeMobileNo,
      rangeEmail: this.currentRange.rangeEmail,
      rangeDescription: this.currentRange.rangeDescription,
      rangeImage: this.currentRange.rangeImage || '',
      rangePersonImage: this.currentRange.rangePersonImage || ''
    };
    
    console.log('Updating range with data:', {
      id: this.currentRange.id,
      data: rangeData
    });
    
    this.apiService.updateRange(this.currentRange.id, rangeData).subscribe({
      next: (response: ApiResponse<any>) => {
        this.isLoading = false;
        console.log('Update response:', response);
        if (response.status === 'SUCCESS') {
          this.closeModal();
          this.loadRanges(); // Reload to get the latest data
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error updating range:', error);
        // Handle error - show message to user
      }
    });
  }

  // TrackBy function for performance
  trackByRangeId(index: number, range: LocalRange): number {
    return range.id;
  }
}