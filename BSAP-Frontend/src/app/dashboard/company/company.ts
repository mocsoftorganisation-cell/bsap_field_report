import { Component } from '@angular/core';
import { ApiService, Companys } from '../../services/api.service';
import { NgModel } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-company',
  templateUrl: './company.html',
  styleUrl: './company.css',
  standalone: false,
})
export class Company {

    company: Companys[] = [];
    currentPage: number = 1;
    pageSize: number = 10; 
    searchTerm: string = '';
    paginatedCompanies: Companys[] = [];
    filteredComapny: Companys[] = [];
    hasPrevPage: boolean = false;
    hasNextPage: boolean = false;
    
    
     // Properties for sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';


    Math = Math;
    itemsPerPage = 10;
     totalItems = 0;
  
    isEditMode: boolean = false;
    showModal: boolean = false;
    isLoading: boolean = false;
    loadingError: string = '';
    totalCompany: number = 0;
    totalPages: number = 0
    currentCompany:Companys = {
      id: 0,
      companyName: '',
      priority: 1,
      active: true
    }

constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadCompanies();
  }

   goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadCompanies();
    }
  }
  // Load modules from API
  loadCompanies(): void {
    this.isLoading = true;
    this.loadingError = '';
     // Validate pagination parameters
    const page = Math.max(1, this.currentPage);
    const limit = Math.min(100, Math.max(5, this.pageSize));
    
    
    // Get sort parameters
    const sortBy = this.sortColumn || 'priority';
    const sortOrder = this.sortDirection.toUpperCase();
    
    this.apiService.getCompanies(
      this.currentPage, 
      this.pageSize, 
      this.searchTerm, 
      sortBy, 
      sortOrder
    ).subscribe({
      next: (response) => {
        // Handle the API response structure
        if (response.status === 'SUCCESS' && response.data) {
          this.company = response.data;
          this.paginatedCompanies = [...this.company]; // For server-side pagination, display all returned data
          this.totalCompany = response.pagination?.total || 0;
          this.totalPages = response.pagination?.totalPages || 0;
          this.hasPrevPage = response.pagination?.hasPrevPage || false;
          this.hasNextPage = response.pagination?.hasNextPage || false;
          
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.loadingError = 'Failed to load companies. Please try again.';
        this.notificationService.error('Failed to load companies. Using offline data.');
        this.isLoading = false;
        // Fallback to mock data if API fails
        // this.initializeData();
      }
    });
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
    return this.totalCompany === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

   getEndRecord(): number {
    const endRecord = this.currentPage * this.pageSize;
    return Math.min(endRecord, this.totalCompany);
  }

   prevPage(): void {
    if (this.hasPrevPage) {
      this.currentPage--;
      this.loadCompanies();
    }
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
    this.loadCompanies();
  }

   editCompany(company: Companys): void {
      this.isEditMode = true;
      this.currentCompany = { ...company }; // Create a copy
      this.showModal = true;
    }

     getTotalPages(): number {
    return this.totalPages;
  }
  nextPage(): void {
    if (this.hasNextPage) {
      this.currentPage++;
      this.loadCompanies();
    }
  }



    // Page size change handler
  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page
    this.loadCompanies(); // Reload with new page size
  }

  // Search functionality
  onSearch(): void {
    this.currentPage = 1; // Reset to first page when searching
    // this.loadModules(); // Reload with new search term
      this.updateFilteredData();

  }


  private updateFilteredData() {
    // Apply optional client-side search on the current page of data
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      this.filteredComapny = this.company.filter(b =>
        b.companyName.toLowerCase().includes(term) 
        // (b.range?.rangeName || '').toLowerCase().includes(term) ||

      );
      // When searching locally on current page, show filtered results only
      this.paginatedCompanies = this.filteredComapny;
    } else {
      // No local search — show the server-provided page
      this.filteredComapny = this.company;
      this.paginatedCompanies = this.company;
    }
  }



 showAddCompanyModal(): void {
    this.isEditMode = false;
    this.currentCompany = {
      id: 0,
      companyName: '',
      priority: 1,
      active: true
    };
    this.showModal = true;
  }

   closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.isLoading = false;
    this.currentCompany = {
      id: 0,
      companyName: '',
      priority: 1,
      active: true
    };
  }


   saveCompany(): void {
    if (!this.currentCompany.companyName.trim() || !this.currentCompany.priority) {
      this.notificationService.error('Please fill in all required fields.');
      return;
    }

     this.isLoading = true;

    const companyData = {
      companyName: this.currentCompany.companyName.trim(),
      priority: this.currentCompany.priority,
      active: this.currentCompany.active
    };

    if (this.isEditMode) {
      // Update existing module via API
      this.apiService.updateCompany(this.currentCompany.id, companyData).subscribe({
        next: (response) => {
          if (response.status === 'SUCCESS') {
            // Reload data from server to get updated data
            this.loadCompanies();
            this.closeModal();
            this.notificationService.success(`Module "${this.currentCompany.companyName}" has been updated successfully!`);
          } else {
            this.isLoading = false;
            this.notificationService.error(response.message || 'Error updating company');
          }
        },
        error: (error) => {
          console.error('Error updating company:', error);
          this.isLoading = false;
          this.notificationService.error('Error updating module. Please try again.');
        }
      });
    } else {
      // Add new module via API
      this.apiService.addCompany(companyData).subscribe({
        next: (response) => {
          if (response.status === 'SUCCESS') {
            // Reload data from server to get updated pagination
            this.loadCompanies();
            this.closeModal();
            this.notificationService.success(`Module "${this.currentCompany.companyName}" has been added successfully!`);
          } else {
            this.isLoading = false;
            this.notificationService.error(response.message || 'Error adding company');
          }
        },
        error: (error) => {
          console.error('Error adding company:', error);
          this.isLoading = false;
          this.notificationService.error('Error adding company. Please try again.');
        }
      });
    }
  }

    toggleCompanyStatus(company: Companys): void {
      const action = company.active ? 'deactivate' : 'activate';
      const confirmMessage = `Are you sure you want to ${action} the company "${company.companyName}"?`;
      
      if (confirm(confirmMessage)) {
        this.isLoading = true;
        
        const statusData = {
          active: !company.active
        };
  
        this.apiService.toggleModuleStatus(company.id, statusData).subscribe({
          next: (response) => {
            if (response.status === 'SUCCESS') {
              company.active = !company.active;
              console.log(`Company ${company.companyName} ${action}d`);
              
              // No need to update display as data is already updated locally
              this.notificationService.success(`Company "${company.companyName}" has been ${action}d successfully!`);
            } else {
              this.notificationService.error(response.message || `Error ${action}ing module`);
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error(`Error ${action}ing company:`, error);
            this.isLoading = false;
            this.notificationService.error(`Error ${action}ing company. Please try again.`);
          }
        });
      }
    }

}
