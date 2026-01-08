import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, ApiResponse, Role } from '../../services/api.service';


@Component({
    selector: 'app-role',
    templateUrl: './role.component.html',
    styleUrls: ['./role.component.css'],
    standalone: false
})
export class RoleComponent implements OnInit {
  
  roles: Role[] = [];
  filteredRoles: Role[] = [];
  paginatedRoles: Role[] = [];
  currentRole: Role = this.createEmptyRole();
  showRoleModal: boolean = false;
  isRoleEditMode: boolean = false;
  
  searchTerm: string = '';
  pageSize: number = 10; 
  currentPage: number = 1;
  totalRoles: number = 0;
  originalTotalRoles: number = 0;
  
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private apiService: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.apiService.getRoles(1, 100).subscribe({
      next: (res: ApiResponse<Role[]>) => {
        this.roles = res.data || [];
        this.filteredRoles = [...this.roles];
        this.totalRoles = this.filteredRoles.length;
        this.updatePaginatedRoles();
      },
      error: err => {
        this.roles = [];
        this.filteredRoles = [];
        this.totalRoles = 0;
        this.updatePaginatedRoles();
      }
    });
  }

  createEmptyRole(): Role {
    return {
      id: 0,
      roleName: '',
      description: '',
      active: true
    };
  }

  showAddRoleModal(): void {
    this.isRoleEditMode = false;
    this.currentRole = this.createEmptyRole();
    this.showRoleModal = true;
  }

  showEditRoleModal(role: Role): void {
    this.isRoleEditMode = true;
    this.currentRole = { ...role };
    this.showRoleModal = true;
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    this.currentRole = this.createEmptyRole();
    this.isRoleEditMode = false;
  }

  addRole(): void {
    this.apiService.createRole(this.currentRole).subscribe({
      next: (res: ApiResponse<Role>) => {
        if (res.status === 'SUCCESS') {
          this.closeRoleModal();
          this.loadRoles();
        }
      }
    });
  }

  updateRole(): void {
    this.apiService.updateRole(this.currentRole.id, this.currentRole).subscribe({
      next: (res: ApiResponse<Role>) => {
        if (res.status === 'SUCCESS') {
          this.closeRoleModal();
          this.loadRoles();
        }
      }
    });
  }

  deleteRole(role: Role): void {
    if (confirm('Are you sure you want to delete this role?')) {
      this.apiService.deleteRole(role.id).subscribe({
        next: (res: ApiResponse<any>) => {
          if (res.status === 'SUCCESS') {
            this.loadRoles();
          }
        }
      });
    }
  }

  activateRole(role: Role): void {
    this.apiService.activateRole(role.id).subscribe({
      next: (res: ApiResponse<Role>) => {
        if (res.status === 'SUCCESS') {
          this.loadRoles();
        }
      }
    });
  }

  deactivateRole(role: Role): void {
    this.apiService.deactivateRole(role.id).subscribe({
      next: (res: ApiResponse<Role>) => {
        if (res.status === 'SUCCESS') {
          this.loadRoles();
        }
      }
    });
  }

  // Search functionality
  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredRoles = [...this.roles];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredRoles = this.roles.filter(role => 
        role.id.toString().includes(searchLower) ||
        role.roleName.toLowerCase().includes(searchLower) ||
        (role.active ? 'yes' : 'no').includes(searchLower)
      );
    }
    
    this.totalRoles = this.filteredRoles.length;
    this.currentPage = 1; 
    this.updatePaginatedRoles();
  }

  onPageSizeChange(): void {
    this.currentPage = 1; 
    this.updatePaginatedRoles();
  }

  sortTable(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredRoles.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (column) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'roleName':
          aValue = a.roleName.toLowerCase();
          bValue = b.roleName.toLowerCase();
          break;
        case 'active':
          aValue = a.active;
          bValue = b.active;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    this.updatePaginatedRoles();
  }

  updatePaginatedRoles(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedRoles = this.filteredRoles.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.updatePaginatedRoles();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalRoles / this.pageSize);
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
    return this.totalRoles === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndRecord(): number {
    const endRecord = this.currentPage * this.pageSize;
    return Math.min(endRecord, this.totalRoles);
  }

  navigateToRolePermissions(roleId: number): void {
    this.router.navigate(['/dashboard/role-permissions'], { queryParams: { roleId: roleId } });
  }

}