import { Component, OnInit } from '@angular/core';
import { ApiService, Menu, ApiResponse } from '../../services/api.service';

@Component({
    selector: 'app-menus',
    templateUrl: './menus.component.html',
    styleUrls: ['./menus.component.css'],
    standalone: false
})
export class MenusComponent implements OnInit {
  // Data properties
  menus: Menu[] = [];
  filteredMenus: Menu[] = [];
  paginatedMenus: Menu[] = [];
  
  // Modal properties
  showModal = false;
  currentMenu: Menu = this.createEmptyMenu();
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

  constructor(private menuService: ApiService) {}

  ngOnInit() {
    this.loadMenus();
  }

  private loadMenus() {
    this.menuService.getMenus(
      this.currentPage, 
      this.itemsPerPage,
      this.searchTerm,
      this.getSortByField(),
      this.sortDirection
    ).subscribe({
      next: (response: ApiResponse<Menu[]>) => {
        if (response.status === 'SUCCESS') {
          this.menus = response.data || [];
          this.totalItems = response.pagination?.total || 0;
          this.totalPages = response.pagination?.totalPages || 0;
          this.updateFilteredData();
        }
      },
      error: (error) => {
        console.error('Error loading menus:', error);
        // Handle error - show message to user
      }
    });
  }

  private createEmptyMenu(): Menu {
    return {
      id: 0,
      menuName: '',
      menuUrl: '',
      priority: 1,
      active: true
    };
  }

  // Search functionality
 onSearch() {
    // this.currentPage = 1;
    // this.loadMenus(); // Reload from API with search
    if (!this.searchTerm.trim()) {
      this.filteredMenus = [...this.menus];
    }else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredMenus = this.menus.filter(menu => 
        menu.id.toString().includes(searchLower) ||
        menu.menuName.toLowerCase().includes(searchLower) ||
        (menu.active ? 'yes' : 'no').includes(searchLower)
      );
    }
    this.totalItems = this.filteredMenus.length;
    this.currentPage = 1; 
    this.updatePaginatedData();
  }

  private updateFilteredData() {
    // For client-side filtering (if needed)
    this.filteredMenus = [...this.menus];
    this.updatePaginatedData();
  }

  // Pagination functionality
    updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedMenus = this.filteredMenus.slice(startIndex, endIndex);
  }


  onPageSizeChange() {
    this.itemsPerPage = this.pageSize;
    this.currentPage = 1;
    this.loadMenus(); // Reload from API with new page size
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMenus(); // Reload from API for the new page
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
    this.loadMenus();
  }

  private getSortByField(): string {
    // Map UI column names to API field names
    const fieldMap: { [key: string]: string } = {
      'id': 'id',
      'name': 'menuName',
      'url': 'menuUrl',
      'priority': 'priority',
      'active': 'active'
    };
    return fieldMap[this.sortColumn] || 'priority';
  }

  // Modal functionality
  showAddMenuModal(): void {
    this.isEditMode = false;
    this.currentMenu = this.createEmptyMenu();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentMenu = this.createEmptyMenu();
    this.isEditMode = false;
  }

  editMenu(menu: Menu): void {
    this.isEditMode = true;
    this.currentMenu = { ...menu };
    this.showModal = true;
  }

  toggleMenuStatus(menu: Menu): void {
    this.menuService.toggleMenuStatus(menu.id, !menu.active).subscribe({
      next: (response: ApiResponse<Menu>) => {
        if (response.status === 'SUCCESS') {
          // Update local data
          const index = this.menus.findIndex(m => m.id === menu.id);
          if (index !== -1) {
            this.menus[index].active = !menu.active;
          }
          this.updateFilteredData();
        }
      },
      error: (error) => {
        console.error('Error toggling menu status:', error);
        // Handle error - show message to user
      }
    });
  }

  addMenu(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.menuService.createMenu(this.currentMenu).subscribe({
      next: (response: ApiResponse<Menu>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.closeModal();
          this.loadMenus(); // Reload to get the latest data
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error creating menu:', error);
        // Handle error - show message to user
      }
    });
  }

  updateMenu(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.menuService.updateMenu(this.currentMenu.id, this.currentMenu).subscribe({
      next: (response: ApiResponse<Menu>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.closeModal();
          this.loadMenus(); // Reload to get the latest data
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error updating menu:', error);
        // Handle error - show message to user
      }
    });
  }

  // TrackBy function for performance
  trackByMenuId(index: number, menu: Menu): number {
    return menu.id;
  }
}



// import { Component, OnInit } from '@angular/core';

// interface Menu {
//   id: number;
//   name: string;
//   url: string;
//   priority: number;
//   active: boolean;
// }

// @Component({
//   selector: 'app-menus',
//   templateUrl: './menus.component.html',
//   styleUrls: ['./menus.component.css']
// })
// export class MenusComponent implements OnInit {
//   // Data properties
//   menus: Menu[] = [];
//   filteredMenus: Menu[] = [];
//   paginatedMenus: Menu[] = [];
  
//   // Modal properties
//   showModal = false;
//   currentMenu: Menu = this.createEmptyMenu();
//   isEditMode = false;
//   isLoading = false;
  
//   // Search and pagination properties
//   searchTerm = '';
//   currentPage = 1;
//   itemsPerPage = 10;
//   pageSize = 10;
//   totalItems = 0;
//   totalPages = 0;
  
//   // Sorting properties
//   sortColumn = '';
//   sortDirection: 'asc' | 'desc' = 'asc';
  
//   // Math reference for template
//   Math = Math;

//   ngOnInit() {
//     this.loadMenus();
//   }

//   private loadMenus() {
//     // TODO: Replace with actual API call
//     this.menus = [
//       { id: 1, name: 'Dashboard', url: '/dashboard', priority: 1, active: true },
//       { id: 2, name: 'Users', url: '/users', priority: 2, active: true },
//       { id: 3, name: 'Reports', url: '/reports', priority: 3, active: false },
//       { id: 4, name: 'Settings', url: '/settings', priority: 4, active: true },
//       { id: 5, name: 'Profile', url: '/profile', priority: 5, active: true }
//     ];
//     this.updateFilteredData();
//   }

//   private createEmptyMenu(): Menu {
//     return {
//       id: 0,
//       name: '',
//       url: '',
//       priority: 1,
//       active: true
//     };
//   }

//   // Search functionality
//   onSearch() {
//     this.currentPage = 1;
//     this.updateFilteredData();
//   }

//   private updateFilteredData() {
//     // Apply search filter
//     this.filteredMenus = this.menus.filter(menu =>
//       menu.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
//       menu.url.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
//       menu.priority.toString().includes(this.searchTerm)
//     );

//     this.totalItems = this.filteredMenus.length;
//     this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
//     // Ensure current page is valid
//     if (this.currentPage > this.totalPages && this.totalPages > 0) {
//       this.currentPage = this.totalPages;
//     }
    
//     this.updatePaginatedData();
//   }

//   // Pagination functionality
//   private updatePaginatedData() {
//     const startIndex = (this.currentPage - 1) * this.itemsPerPage;
//     const endIndex = startIndex + this.itemsPerPage;
//     this.paginatedMenus = this.filteredMenus.slice(startIndex, endIndex);
//   }

//   onPageSizeChange() {
//     this.itemsPerPage = this.pageSize;
//     this.currentPage = 1;
//     this.updateFilteredData();
//   }

//   goToPage(page: number) {
//     if (page >= 1 && page <= this.totalPages) {
//       this.currentPage = page;
//       this.updatePaginatedData();
//     }
//   }

//   getVisiblePages(): number[] {
//     const visiblePages: number[] = [];
//     const maxVisiblePages = 5;
    
//     if (this.totalPages <= maxVisiblePages) {
//       for (let i = 1; i <= this.totalPages; i++) {
//         visiblePages.push(i);
//       }
//     } else {
//       const halfVisible = Math.floor(maxVisiblePages / 2);
//       let startPage = Math.max(1, this.currentPage - halfVisible);
//       let endPage = Math.min(this.totalPages, this.currentPage + halfVisible);
      
//       if (this.currentPage <= halfVisible) {
//         endPage = maxVisiblePages;
//       } else if (this.currentPage > this.totalPages - halfVisible) {
//         startPage = this.totalPages - maxVisiblePages + 1;
//       }
      
//       if (startPage > 1) {
//         visiblePages.push(1);
//         if (startPage > 2) {
//           visiblePages.push(-1); // Ellipsis
//         }
//       }
      
//       for (let i = startPage; i <= endPage; i++) {
//         visiblePages.push(i);
//       }
      
//       if (endPage < this.totalPages) {
//         if (endPage < this.totalPages - 1) {
//           visiblePages.push(-1); // Ellipsis
//         }
//         visiblePages.push(this.totalPages);
//       }
//     }
    
//     return visiblePages;
//   }

//   // Sorting functionality
//   sortTable(column: string) {
//     if (this.sortColumn === column) {
//       this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
//     } else {
//       this.sortColumn = column;
//       this.sortDirection = 'asc';
//     }

//     this.filteredMenus.sort((a, b) => {
//       let aValue = a[column as keyof Menu];
//       let bValue = b[column as keyof Menu];

//       // Handle different data types
//       if (typeof aValue === 'string') {
//         aValue = aValue.toLowerCase();
//         bValue = (bValue as string).toLowerCase();
//       }

//       if (aValue < bValue) {
//         return this.sortDirection === 'asc' ? -1 : 1;
//       } else if (aValue > bValue) {
//         return this.sortDirection === 'asc' ? 1 : -1;
//       }
//       return 0;
//     });

//     this.updatePaginatedData();
//   }

//   // Modal functionality
//   showAddMenuModal(): void {
//     this.isEditMode = false;
//     this.currentMenu = this.createEmptyMenu();
//     this.showModal = true;
//   }

//   closeModal(): void {
//     this.showModal = false;
//     this.currentMenu = this.createEmptyMenu();
//     this.isEditMode = false;
//   }

//   editMenu(menu: Menu): void {
//     this.isEditMode = true;
//     this.currentMenu = { ...menu };
//     this.showModal = true;
//   }

//   toggleMenuStatus(menu: Menu): void {
//     const index = this.menus.findIndex(m => m.id === menu.id);
//     if (index !== -1) {
//       this.menus[index].active = !this.menus[index].active;
//       this.updateFilteredData();
//       // TODO: Implement actual API call
//       console.log('Menu status toggled:', this.menus[index]);
//     }
//   }

//   addMenu(): void {
//     this.isLoading = true;
//     // Simulate API call
//     setTimeout(() => {
//       const newId = this.getNextId();
//       this.currentMenu.id = newId;
//       this.currentMenu.active = this.currentMenu.active || false;
//       this.menus.unshift({ ...this.currentMenu });
//       this.updateFilteredData();
//       this.isLoading = false;
//       this.closeModal();
//     }, 500);
//   }

//   updateMenu(): void {
//     this.isLoading = true;
//     // Simulate API call
//     setTimeout(() => {
//       const index = this.menus.findIndex(m => m.id === this.currentMenu.id);
//       if (index !== -1) {
//         this.menus[index] = { ...this.currentMenu };
//       }
//       this.updateFilteredData();
//       this.isLoading = false;
//       this.closeModal();
//     }, 500);
//   }

//   private getNextId(): number {
//     return this.menus.length > 0 ? Math.max(...this.menus.map(m => m.id)) + 1 : 1;
//   }

//   // TrackBy function for performance
//   trackByMenuId(index: number, menu: Menu): number {
//     return menu.id;
//   }
// }
