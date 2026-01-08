import { Component, OnInit } from '@angular/core';
import { ApiService, Module } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-modules',
    templateUrl: './modules.component.html',
    styleUrls: ['./modules.component.css'],
    standalone: false
})
export class ModulesComponent implements OnInit {
  
  // Properties for table data 
  modules: Module[] = [];
  filteredModules: Module[] = [];
  paginatedModules: Module[] = [];
  
  // Properties for search and pagination
  searchTerm: string = '';
  pageSize: number = 10;
  currentPage: number = 1;
  totalModules: number = 0;
  totalPages: number = 0;
  serverSidePagination: boolean = true; // Flag to use server-side pagination
  hasNextPage: boolean = false;
  hasPrevPage: boolean = false;
  
  // Properties for sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Properties for modal
  showModal: boolean = false;
  isEditMode: boolean = false;
  isLoading: boolean = false;
  loadingError: string = '';
  currentModule: Module = {
    id: 0,
    moduleName: '',
    priority: 1,
    active: true
  };

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadModules();
  }

  // Load modules from API
  loadModules(): void {
    this.isLoading = true;
    this.loadingError = '';
    
    // Get sort parameters
    const sortBy = this.sortColumn || 'priority';
    const sortOrder = this.sortDirection.toUpperCase();
    
    this.apiService.getModules(
      this.currentPage, 
      this.pageSize, 
      this.searchTerm, 
      sortBy, 
      sortOrder
    ).subscribe({
      next: (response) => {
        // Handle the API response structure
        if (response.status === 'SUCCESS' && response.data) {
          this.modules = response.data;
          this.paginatedModules = [...this.modules]; // For server-side pagination, display all returned data
          
          // Update pagination info from server response
          if (response.pagination) {
            this.totalModules = response.pagination.total;
            this.totalPages = response.pagination.totalPages;
            this.currentPage = response.pagination.page;
            this.hasNextPage = response.pagination.hasNextPage || false;
            this.hasPrevPage = response.pagination.hasPrevPage || false;
          } else {
            this.totalModules = this.modules.length;
            this.totalPages = 1;
            this.hasNextPage = false;
            this.hasPrevPage = false;
          }
        } else if (Array.isArray(response)) {
          // Fallback for direct array response
          this.modules = response;
          this.paginatedModules = [...this.modules];
          this.totalModules = this.modules.length;
          this.totalPages = 1;
        } else {
          this.modules = response.data || [];
          this.paginatedModules = [...this.modules];
          this.totalModules = 0;
          this.totalPages = 1;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading modules:', error);
        this.loadingError = 'Failed to load modules. Please try again.';
        this.notificationService.error('Failed to load modules. Using offline data.');
        this.isLoading = false;
        // Fallback to mock data if API fails
        this.initializeData();
      }
    });
  }

  // Refresh modules
  refreshModules(): void {
    this.loadModules();
  }

  // Initialize mock data - replace with API call later
  initializeData(): void {
    this.modules = [
      { id: 4, moduleName: 'Crime Statistics', priority: 1, active: true },
      { id: 5, moduleName: 'General Administration', priority: 4, active: true },
      { id: 6, moduleName: 'Prosecution and Trial', priority: 2, active: true },
      { id: 7, moduleName: 'Crime Prevention Measures', priority: 3, active: true },
      { id: 8, moduleName: 'Police Line Functioning', priority: 5, active: true },
      { id: 9, moduleName: 'Office Management', priority: 6, active: true },
      { id: 10, moduleName: 'Budget Control', priority: 7, active: true }
    ];
    
    this.totalModules = this.modules.length;
    this.totalPages = Math.ceil(this.totalModules / this.pageSize);
    this.paginatedModules = [...this.modules];
  }

  // Search functionality
  onSearch(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.loadModules(); // Reload with new search term
  }

  // Page size change handler
  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page
    this.loadModules(); // Reload with new page size
  }

  // Sorting functionality
  sortTable(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Reload data with new sorting
    this.loadModules();
  }

  // Pagination methods (for server-side pagination, we don't need updatePaginatedModules)
  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.loadModules(); // Reload data for new page
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.hasPrevPage) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getTotalPages(): number {
    return this.totalPages;
  }

  getVisiblePages(): number[] {
    const totalPages = this.getTotalPages();
    const visiblePages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      visiblePages.push(i);
    }
    
    return visiblePages;
  }

  getStartRecord(): number {
    return this.totalModules === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndRecord(): number {
    const endRecord = this.currentPage * this.pageSize;
    return Math.min(endRecord, this.totalModules);
  }

  // Modal methods
  showAddModuleModal(): void {
    this.isEditMode = false;
    this.currentModule = {
      id: 0,
      moduleName: '',
      priority: 1,
      active: true
    };
    this.showModal = true;
  }

  editModule(module: Module): void {
    this.isEditMode = true;
    this.currentModule = { ...module }; // Create a copy
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.isLoading = false;
    this.currentModule = {
      id: 0,
      moduleName: '',
      priority: 1,
      active: true
    };
  }

  saveModule(): void {
    if (!this.currentModule.moduleName.trim() || !this.currentModule.priority) {
      this.notificationService.error('Please fill in all required fields.');
      return;
    }

    this.isLoading = true;

    const moduleData = {
      moduleName: this.currentModule.moduleName.trim(),
      priority: this.currentModule.priority,
      active: this.currentModule.active
    };

    if (this.isEditMode) {
      // Update existing module via API
      this.apiService.updateModule(this.currentModule.id, moduleData).subscribe({
        next: (response) => {
          if (response.status === 'SUCCESS') {
            // Reload data from server to get updated data
            this.loadModules();
            this.closeModal();
            this.notificationService.success(`Module "${this.currentModule.moduleName}" has been updated successfully!`);
          } else {
            this.isLoading = false;
            this.notificationService.error(response.message || 'Error updating module');
          }
        },
        error: (error) => {
          console.error('Error updating module:', error);
          this.isLoading = false;
          this.notificationService.error('Error updating module. Please try again.');
        }
      });
    } else {
      // Add new module via API
      this.apiService.addModule(moduleData).subscribe({
        next: (response) => {
          if (response.status === 'SUCCESS') {
            // Reload data from server to get updated pagination
            this.loadModules();
            this.closeModal();
            this.notificationService.success(`Module "${this.currentModule.moduleName}" has been added successfully!`);
          } else {
            this.isLoading = false;
            this.notificationService.error(response.message || 'Error adding module');
          }
        },
        error: (error) => {
          console.error('Error adding module:', error);
          this.isLoading = false;
          this.notificationService.error('Error adding module. Please try again.');
        }
      });
    }
  }

  toggleModuleStatus(module: Module): void {
    const action = module.active ? 'deactivate' : 'activate';
    const confirmMessage = `Are you sure you want to ${action} the module "${module.moduleName}"?`;
    
    if (confirm(confirmMessage)) {
      this.isLoading = true;
      
      const statusData = {
        active: !module.active
      };

      this.apiService.toggleModuleStatus(module.id, statusData).subscribe({
        next: (response) => {
          if (response.status === 'SUCCESS') {
            module.active = !module.active;
            console.log(`Module ${module.moduleName} ${action}d`);
            
            // No need to update display as data is already updated locally
            this.notificationService.success(`Module "${module.moduleName}" has been ${action}d successfully!`);
          } else {
            this.notificationService.error(response.message || `Error ${action}ing module`);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error ${action}ing module:`, error);
          this.isLoading = false;
          this.notificationService.error(`Error ${action}ing module. Please try again.`);
        }
      });
    }
  }
}