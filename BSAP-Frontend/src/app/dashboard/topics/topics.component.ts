import { Component, OnInit } from '@angular/core';
import { ApiService, Topic } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';

interface Module {
  id: number;
  moduleName: string;
}

interface Month {
  value: number;
  label: string;
}

@Component({
    selector: 'app-topics',
    templateUrl: './topics.component.html',
    styleUrls: ['./topics.component.css'],
    standalone: false
})
export class TopicsComponent implements OnInit {
  
  // Properties for table data
  topics: Topic[] = [];
  paginatedTopics: Topic[] = [];
  filteredTopics : Topic[] = [];
  
  // Properties for search and pagination
  searchTerm: string = '';
  pageSize: number = 10;
  currentPage: number = 1;
  totalTopics: number = 0;
  totalPages: number = 0;
  serverSidePagination: boolean = true;
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
  currentTopic: Topic = {
    id: 0,
    moduleId: 0,
    topicName: '',
    subName: '',
    priority: 1,
    active: true,
    formType: '',
    isShowCummulative: false,
    isShowPrevious: false,
    isStartJan: false,
    startMonth: 1,
    endMonth: 12
  };

  // Dropdown data
  availableModules: Module[] = [];
  months: Month[] = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadTopics();
    this.loadAvailableModules();
  }

  // Load topics with server-side pagination
  loadTopics(): void {
    this.isLoading = true;
    this.loadingError = '';

    // Validate pagination parameters
    const page = Math.max(1, this.currentPage);
    const limit = Math.min(100, Math.max(5, this.pageSize));
    
    // Map frontend column names to backend field names
    const sortField = this.mapSortColumn(this.sortColumn || 'priority');
    
    this.apiService.getTopics(
      page,
      limit,
      this.searchTerm,
      sortField,
      this.sortDirection.toUpperCase()
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS' && response.data) {
          this.topics = response.data;
          this.paginatedTopics = response.data;
          this.totalTopics = response.pagination?.total || 0;
          this.totalPages = response.pagination?.totalPages || 0;
          this.hasNextPage = response.pagination?.hasNextPage || false;
          this.hasPrevPage = response.pagination?.hasPrevPage || false;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.loadingError = 'Failed to load topics. Please try again.';
        this.notificationService.error('Failed to load topics');
        console.error('Error loading topics:', error);
      }
    });
  }

  // Map frontend column names to backend field names
  private mapSortColumn(column: string): string {
    const columnMap: { [key: string]: string } = {
      'id': 'id',
      'moduleName': 'moduleName', // This will need to be handled in backend
      'topicName': 'topicName',
      'subName': 'subName',
      'priority': 'priority',
      'active': 'active',
      'formType': 'formType',
      'isShowPrevious': 'isShowPrevious',
      'isShowCummulative': 'isShowCummulative'
    };
    
    return columnMap[column] || 'priority';
  }

  // Load available modules for dropdown
  loadAvailableModules(): void {
    this.apiService.getModuleDropdown().subscribe({
      next: (response) => {
        if (response.status === 'SUCCESS' && response.data) {
          this.availableModules = response.data;
        }
      },
      error: (error) => {
        console.error('Error fetching modules:', error);
        this.notificationService.error('Failed to load modules');
      }
    });
  }

   // Search functionality
  onSearch(): void {
    this.currentPage = 1; // Reset to first page
    this.updateFilteredData();
  }

  // Page size change handler
  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page
    this.loadTopics();
  }


  private updateFilteredData() {
    // Apply optional client-side search on the current page of data
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      this.filteredTopics = this.topics.filter(b =>
        b.topicName.toLowerCase().includes(term) ||
        (b.moduleName || '').toLowerCase().includes(term) ||
        (b.subName || '').toLowerCase().includes(term) 
        // (b.battalionArea || '').toLowerCase().includes(term)
      );
      // When searching locally on current page, show filtered results only
      this.paginatedTopics= this.filteredTopics;
    } else {
      // No local search — show the server-provided page
      this.filteredTopics = this.topics;
      this.paginatedTopics = this.topics;
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
    this.currentPage = 1; // Reset to first page
    this.loadTopics();
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTopics();
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.currentPage++;
      this.loadTopics();
    }
  }

  prevPage(): void {
    if (this.hasPrevPage) {
      this.currentPage--;
      this.loadTopics();
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
    return this.totalTopics === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndRecord(): number {
    const endRecord = this.currentPage * this.pageSize;
    return Math.min(endRecord, this.totalTopics);
  }

  // Modal methods
  showAddTopicModal(): void {
    this.isEditMode = false;
    this.currentTopic = {
      id: 0,
      moduleId: 0,
      topicName: '',
      subName: '',
      priority: 1,
      active: true,
      formType: '',
      isShowCummulative: false,
      isShowPrevious: false,
      isStartJan: false,
      startMonth: 1,
      endMonth: 12
    };
    this.showModal = true;
  }

  editTopic(topic: Topic): void {
    this.isEditMode = true;
    this.currentTopic = { ...topic }; // Create a copy
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.isLoading = false;
    this.currentTopic = {
      id: 0,
      moduleId: 0,
      topicName: '',
      subName: '',
      priority: 1,
      active: true,
      formType: '',
      isShowCummulative: false,
      isShowPrevious: false,
      isStartJan: false,
      startMonth: 1,
      endMonth: 12
    };
  }

  saveTopic(): void {
    if (!this.currentTopic.topicName.trim() || !this.currentTopic.moduleId || !this.currentTopic.formType) {
      this.notificationService.error('Please fill all required fields');
      return;
    }

    this.isLoading = true;

    const topicData = {
      moduleId: this.currentTopic.moduleId,
      topicName: this.currentTopic.topicName,
      subName: this.currentTopic.subName || '',
      priority: this.currentTopic.priority,
      formType: this.currentTopic.formType,
      isShowCummulative: this.currentTopic.isShowCummulative,
      isShowPrevious: this.currentTopic.isShowPrevious,
      isStartJan: this.currentTopic.isStartJan,
      startMonth: this.currentTopic.startMonth,
      endMonth: this.currentTopic.endMonth,
      active: this.currentTopic.active
    };

    if (this.isEditMode) {
      this.apiService.updateTopic(this.currentTopic.id, topicData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.status === 'SUCCESS') {
            this.notificationService.success(`Topic "${this.currentTopic.topicName}" updated successfully!`);
            this.closeModal();
            this.loadTopics(); // Refresh the list
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.error('Failed to update topic');
          console.error('Error updating topic:', error);
        }
      });
    } else {
      this.apiService.addTopic(topicData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.status === 'SUCCESS') {
            this.notificationService.success(`Topic "${this.currentTopic.topicName}" created successfully!`);
            this.closeModal();
            this.loadTopics(); // Refresh the list
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.error('Failed to create topic');
          console.error('Error creating topic:', error);
        }
      });
    }
  }

  toggleTopicStatus(topic: Topic): void {
    const action = topic.active ? 'deactivate' : 'activate';
    const confirmMessage = `Are you sure you want to ${action} the topic "${topic.topicName}"?`;
    
    if (confirm(confirmMessage)) {
      const apiCall = topic.active 
        ? this.apiService.deactivateTopic(topic.id)
        : this.apiService.activateTopic(topic.id);

      apiCall.subscribe({
        next: (response) => {
          if (response.status === 'SUCCESS') {
            this.notificationService.success(`Topic "${topic.topicName}" ${action}d successfully!`);
            this.loadTopics(); // Refresh the list
          }
        },
        error: (error) => {
          this.notificationService.error(`Failed to ${action} topic`);
          console.error(`Error ${action}ing topic:`, error);
        }
      });
    }
  }
}