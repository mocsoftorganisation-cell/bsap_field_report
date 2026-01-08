import { Component, OnInit } from '@angular/core';
import { ApiService, SubTopic, Topic } from '../../services/api.service';

// Additional interfaces for internal use
interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

@Component({
    selector: 'app-subtopics',
    templateUrl: './subtopics.component.html',
    styleUrls: ['./subtopics.component.css'],
    standalone: false
})
export class SubtopicsComponent implements OnInit {
  // Data properties
  subTopics: SubTopic[] = [];
  filteredSubTopics: SubTopic[] = [];
  paginatedSubTopics: SubTopic[] = [];
  availableTopics: Topic[] = [];

  // Modal properties
  showModal: boolean = false;
  isEditMode: boolean = false;
  currentSubTopic: SubTopic = this.getEmptySubTopic();

  // Table properties
  searchTerm: string = '';
  sortColumn: string = 'subTopicName';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  serverPagination: PaginationInfo = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  };

  // Loading and error states
  isLoading: boolean = false;
  isTopicsLoading: boolean = false;
  errorMessage: string = '';

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadSubTopics();
    this.loadTopics();
  }

  // Data loading methods
  loadSubTopics(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.apiService.getSubTopics(
      this.currentPage, 
      this.itemsPerPage, 
      this.searchTerm || undefined,
      this.sortColumn,
      this.sortDirection.toUpperCase()
    ).subscribe({
      next: (response) => {
        if (response.status === 'SUCCESS' && response.data) {
          this.subTopics = response.data;
          this.filteredSubTopics = [...this.subTopics];
          this.paginatedSubTopics = [...this.subTopics]; // Direct assignment for server-side pagination
          
          if (response.pagination) {
            this.serverPagination = response.pagination;
            this.totalPages = response.pagination.totalPages;
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading subtopics:', error);
        this.errorMessage = 'Failed to load subtopics. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadTopics(): void {
    this.isTopicsLoading = true;
    
    this.apiService.getActiveTopics().subscribe({
      next: (response) => {
        if (response.status === 'SUCCESS' && response.data) {
          this.availableTopics = response.data;
        }
        this.isTopicsLoading = false;
      },
      error: (error) => {
        console.error('Error loading topics:', error);
        this.isTopicsLoading = false;
      }
    });
  }

  // Modal methods
  openAddModal(): void {
    this.isEditMode = false;
    this.currentSubTopic = this.getEmptySubTopic();
    this.showModal = true;
  }

  editSubTopic(subtopic: SubTopic): void {
    this.isEditMode = true;
    this.currentSubTopic = { ...subtopic };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentSubTopic = this.getEmptySubTopic();
    this.isEditMode = false;
  }

  saveSubTopic(): void {
    const subTopicData: Partial<SubTopic> = {
      subTopicName: this.currentSubTopic.subTopicName,
      topicId: this.currentSubTopic.topicId,
      priority: this.currentSubTopic.priority || 1,
      active: this.currentSubTopic.active !== undefined ? this.currentSubTopic.active : true
    };

    if (this.isEditMode && this.currentSubTopic.id) {
      // Update existing subtopic
      this.apiService.updateSubTopic(this.currentSubTopic.id, subTopicData).subscribe({
        next: (response) => {
          if (response.status === 'SUCCESS') {
            this.loadSubTopics(); // Reload data
            this.closeModal();
          }
        },
        error: (error) => {
          console.error('Error updating subtopic:', error);
          this.errorMessage = 'Failed to update subtopic. Please try again.';
        }
      });
    } else {
      // Add new subtopic
      this.apiService.addSubTopic(subTopicData).subscribe({
        next: (response) => {
          if (response.status === 'SUCCESS') {
            this.loadSubTopics(); // Reload data
            this.closeModal();
          }
        },
        error: (error) => {
          console.error('Error creating subtopic:', error);
          this.errorMessage = 'Failed to create subtopic. Please try again.';
        }
      });
    }
  }

  toggleSubTopicStatus(subtopic: SubTopic): void {
    if (subtopic.active) {
      this.apiService.deactivateSubTopic(subtopic.id).subscribe({
        next: (response) => {
          if (response.status === 'SUCCESS') {
            this.loadSubTopics(); // Reload data
          }
        },
        error: (error) => {
          console.error('Error deactivating subtopic:', error);
          this.errorMessage = 'Failed to deactivate subtopic. Please try again.';
        }
      });
    } else {
      this.apiService.activateSubTopic(subtopic.id).subscribe({
        next: (response) => {
          if (response.status === 'SUCCESS') {
            this.loadSubTopics(); // Reload data
          }
        },
        error: (error) => {
          console.error('Error activating subtopic:', error);
          this.errorMessage = 'Failed to activate subtopic. Please try again.';
        }
      });
    }
  }

  deleteSubTopic(subtopic: SubTopic): void {
    if (confirm('Are you sure you want to delete this subtopic?')) {
      this.apiService.deleteSubTopic(subtopic.id).subscribe({
        next: (response) => {
          if (response.status === 'SUCCESS') {
            this.loadSubTopics(); // Reload data
          }
        },
        error: (error) => {
          console.error('Error deleting subtopic:', error);
          this.errorMessage = 'Failed to delete subtopic. Please try again.';
        }
      });
    }
  }

   onSearch(): void {
    // For server-side filtering, reload data
    this.currentPage = 1;
    this.updateFilteredData();
  }

   private updateFilteredData() {
    // Apply optional client-side search on the current page of data
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      this.filteredSubTopics = this.subTopics.filter(b =>
        b.subTopicName.toLowerCase().includes(term) ||
        // (b.range?.rangeName || '').toLowerCase().includes(term) ||
        (b.topicName|| '').toLowerCase().includes(term)
        // (b.battalionEmail || '').toLowerCase().includes(term) ||
        // (b.battalionArea || '').toLowerCase().includes(term)
      );
      // When searching locally on current page, show filtered results only
      this.paginatedSubTopics = this.filteredSubTopics;
    } else {
      // No local search — show the server-provided page
      this.filteredSubTopics = this.subTopics;
      this.paginatedSubTopics = this.subTopics;
    }
  }

  // Search and filter
  filterSubTopics(): void {
    // For server-side filtering, reload data
    this.currentPage = 1;
    this.loadSubTopics();
  }

  // Sorting
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    // For server-side sorting, reload data
    this.currentPage = 1;
    this.loadSubTopics();
  }

  // Pagination - Server side
  updatePagination(): void {
    console.log('Updating pagination - itemsPerPage:', this.itemsPerPage);
    this.currentPage = 1;
    this.loadSubTopics();
  }

  goToPage(page: number): void {
    console.log('Going to page:', page, 'Total pages:', this.serverPagination.totalPages);
    if (page >= 1 && page <= (this.serverPagination.totalPages || 1)) {
      this.currentPage = page;
      this.loadSubTopics();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const halfRange = Math.floor(maxPagesToShow / 2);
    const totalPages = this.serverPagination.totalPages || 1;
    
    let startPage = Math.max(1, this.currentPage - halfRange);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getStartIndex(): number {
    return this.serverPagination.total === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.serverPagination.total);
  }

  // Utility methods
  private getEmptySubTopic(): SubTopic {
    return {
      id: 0,
      subTopicName: '',
      topicId: 0,
      priority: 1,
      active: true
    };
  }
}