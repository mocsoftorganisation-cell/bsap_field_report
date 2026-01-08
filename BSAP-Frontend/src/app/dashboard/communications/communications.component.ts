import { Component, OnInit, OnDestroy } from '@angular/core';
// import { Router } from '@angular/router'; // UNUSED 2025-11-12 - commented out because Router is not used in this component
import { Subscription } from 'rxjs';

// Import your existing services
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service'; // ADD THIS
import { PerformanceStatisticService } from '../../services/performance-statistic.service';
import { environment } from '../../../environments/environment'; // ADD THIS
interface Communication {
  id: number;
  createdDate: Date;
  subject: string;
  battalionId: number;
  battalionName?: string;
  message: string;
  document?: string;
  active: boolean;
  replies?: Reply[];
  name?: string;
  createdBy?: number;
  selectedBattalions?: number[];
  selectedBattalionNames?: string[];
  unreadCount?: number;
  status?: string;

  // keep optional
  attachments?: { filename: string }[];

  // make NON-OPTIONAL to avoid template error
  messages: {
    id: number;
    attachments: {
      id: number;
      communicationsMessageId: number;
      filename: string;
      active: boolean;
      createdBy: number;
      createdDate: string;
      updatedBy: number;
      updatedDate: string;
    }[];
  }[];
}


interface Battalion {
  id: number;
  name: string;
  battalionName?: string;
  selected?: boolean;
}

interface Reply {
  id: number;
  replyDate: Date;
  replyBy: string;
  replyMessage: string;
  message?: string;
  document?: string;
  userId?: number; // NEW: User who sent reply
  battalionId?: number; // NEW: Battalion of replier
  read?: boolean; // NEW: Read status
  fromUserName?: string; // NEW: Name of user who replied
}

@Component({
  selector: 'app-communications',
  templateUrl: './communications.component.html',
  styleUrls: ['./communications.component.css'],
  standalone: false
})
export class CommunicationsComponent implements OnInit, OnDestroy {
  // Data properties
  communications: Communication[] = [];
  filteredCommunications: Communication[] = [];
  paginatedCommunications: Communication[] = [];
  battalions: Battalion[] = [];
  currentUser: any = null;
  selectedCommunication: Communication | null = null;

  // Modal properties
  showModal = false;
  showDetailView = false;
  showStatusView = false; // NEW: Status view modal
  currentCommunication: Communication = this.createEmptyCommunication();
  // selectedCommunication: Communication | null = null;
  isEditMode = false;
  isLoading = false;
  
  // Reply properties
  replyMessage = '';
  replyAttachments: File[] = [];
  
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
  
  // Multiple battalion selection properties
  selectedBattalionIds: number[] = [];
  allBattalionsSelected = false;
  isBattalionDropdownOpen = false;
  
  // NEW: WebSocket and real-time properties
  isConnected = false;
  typingUsers: { [key: number]: string[] } = {}; // Track typing users by communicationId
  
  // Subscriptions
  private subscriptions: Subscription = new Subscription();

  // Math reference for template
  Math = Math;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private webSocketService: WebSocketService, // ADD THIS
    private performanceService: PerformanceStatisticService

  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.loadBattalions();
    this.loadCommunications();
    this.initializeWebSocketListeners(); // NEW: Initialize WebSocket

    console.log("COMMUNICATIONS:", this.communications);

  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.webSocketService.disconnect(); // NEW: Clean up WebSocket
  }

  // NEW: Initialize WebSocket listeners
  private initializeWebSocketListeners() {
    // Listen for connection status
    this.isConnected = this.webSocketService.getConnectionStatus();
    
    // Listen for new messages
    this.subscriptions.add(
      this.webSocketService.onNewMessage().subscribe((data) => {
        this.handleIncomingMessage(data);
      })
    );

    // Listen for communication updates
    this.subscriptions.add(
      this.webSocketService.onCommunicationUpdate().subscribe((data) => {
        this.handleCommunicationUpdate(data);
      })
    );

    // Listen for message status updates
    this.subscriptions.add(
      this.webSocketService.onMessageStatusUpdate().subscribe((data) => {
        this.handleMessageStatusUpdate(data);
      })
    );

    // Listen for new communications
    this.subscriptions.add(
      this.webSocketService.onNewCommunication().subscribe((data) => {
        this.handleNewCommunication(data);
      })
    );

    // Listen for typing indicators
    this.subscriptions.add(
      this.webSocketService.onUserTyping().subscribe((data) => {
        this.handleUserTyping(data);
      })
    );
  }

hasAttachment(c: Communication): boolean {
  return !!c?.replies?.length && !!c.replies[0]?.document;
}

getAttachmentLink(c: Communication): string | null {
    console.log("Check attach for", c.id, c);
  return c?.replies?.[0]?.document || null;
}




  // NEW: Handle incoming real-time messages
  private handleIncomingMessage(data: any) {
    console.log('📨 New real-time message received:', data);
    
    const communication = this.communications.find(c => c.id === data.communicationId);
    if (communication) {
      if (!communication.replies) {
        communication.replies = [];
      }

      const newReply: Reply = {
        id: data.replyId || Date.now(),
        replyDate: new Date(data.timestamp),
        replyBy: data.fromUserName || 'Unknown User',
        replyMessage: data.message,
        message: data.message,
        userId: data.fromUser,
        battalionId: data.battalionId,
        fromUserName: data.fromUserName,
        read: false // Mark as unread initially
      };

      communication.replies.push(newReply);
      
      // Update unread count
      communication.unreadCount = (communication.unreadCount || 0) + 1;

      // Update UI if this communication is currently selected
      if (this.selectedCommunication && this.selectedCommunication.id === data.communicationId) {
        this.selectedCommunication.replies = [...communication.replies];
        this.selectedCommunication.unreadCount = communication.unreadCount;
        
        // Auto-mark as read if viewing
        this.markMessageAsRead(newReply);
      }

      // Show notification
      this.showNotification(`New reply from ${data.fromUserName} in ${this.getBattalionName(data.battalionId)}`);
      
      // Refresh the view
      this.applyFilters();
    }
  }

  // NEW: Handle communication updates
  private handleCommunicationUpdate(data: any) {
    console.log('🔄 Communication update:', data);
    
    if (data.type === 'NEW_REPLY') {
      // Reload communications to get updated status
      this.loadCommunications();
      
      // Show notification if not viewing the communication
      if (!this.selectedCommunication || this.selectedCommunication.id !== data.communicationId) {
        this.showNotification(`New reply received from ${data.fromUserName}`);
      }
    }
  }

  // NEW: Handle message status updates
  private handleMessageStatusUpdate(data: any) {
    console.log('👀 Message status update:', data);
    
    // Update message read status in UI
    const communication = this.communications.find(c => c.id === data.communicationId);
    if (communication && communication.replies) {
      const reply = communication.replies.find((r: Reply) => r.id === data.messageId);
      if (reply) {
        reply.read = true;
      }
    }
  }

  // NEW: Handle new communications
  private handleNewCommunication(data: any) {
    console.log('📢 New communication:', data);
    
    // Reload communications list
    this.loadCommunications();
    
    // Show notification
    this.showNotification(`New communication: ${data.subject}`);
  }

  // NEW: Handle typing indicators
  private handleUserTyping(data: any) {
    if (!this.typingUsers[data.communicationId]) {
      this.typingUsers[data.communicationId] = [];
    }

    if (data.isTyping) {
      // Add user to typing list if not already there
      if (!this.typingUsers[data.communicationId].includes(data.userName)) {
        this.typingUsers[data.communicationId].push(data.userName);
      }
    } else {
      // Remove user from typing list
      this.typingUsers[data.communicationId] = this.typingUsers[data.communicationId].filter(
        name => name !== data.userName
      );
    }
  }

  // NEW: Get typing text for display
  getTypingText(communicationId: number): string {
    const typers = this.typingUsers[communicationId];
    if (!typers || typers.length === 0) return '';

    if (typers.length === 1) {
      return `${typers[0]} is typing...`;
    } else if (typers.length === 2) {
      return `${typers[0]} and ${typers[1]} are typing...`;
    } else {
      return `${typers[0]} and ${typers.length - 1} others are typing...`;
    }
  }

  // NEW: Show notification
  private showNotification(message: string) {
    // Simple notification - you can replace with a proper notification service
    console.log('💬 Notification:', message);
    
    // Optional: Use browser notifications if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Message', {
        body: message,
        icon: '/assets/notification-icon.png'
      });
    }
  }

  private loadCurrentUser() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.subscriptions.add(
        this.authService.user$.subscribe(user => {
          this.currentUser = user;
        })
      );
    }
  }

  private loadBattalions() {
    this.subscriptions.add(
      this.apiService.getActiveBattalions().subscribe({
        next: (response) => {
          if (response.status === 'SUCCESS' && response.data) {
            this.battalions = response.data.map((bat: any) => ({
              id: bat.id,
              name: bat.battalionName,
              battalionName: bat.battalionName,
              selected: false
            }));
           }
        },
        error: (error) => {
          console.error('Error loading battalions:', error);
        }
      })
    );
  }

  // Get names for multiple battalions
  getMultipleBattalionNames(battalionIds: number[]): string {
    const selectedNames = this.battalions
      .filter(b => battalionIds.includes(b.id))
      .map(b => b.name);
    
    return selectedNames.join(', ');
  }

  // Get battalion names array
  getBattalionNames(battalionIds: number[]): string[] {
    return this.battalions
      .filter(b => battalionIds.includes(b.id))
      .map(b => b.name);
  }

  // Update the battalion display in the table
  getBattalionDisplay(communication: Communication): string {
    if (communication.selectedBattalionNames && communication.selectedBattalionNames.length > 0) {
      return communication.selectedBattalionNames.join(', ');
    }
    
    if (communication.selectedBattalions && communication.selectedBattalions.length > 1) {
      return this.getMultipleBattalionNames(communication.selectedBattalions);
    }
    
    const singleBattalionId = communication.selectedBattalions?.[0] || communication.battalionId;
    return this.getBattalionName(singleBattalionId);
  }

  // Get battalion name by ID
  getBattalionName(battalionId: number): string {
    if (!battalionId) return 'Unknown Battalion';
    
    const battalion = this.battalions.find(b => b.id === battalionId);
    return battalion ? battalion.name : 'Unknown Battalion';
  }

  // NEW: Get status badge class
  getStatusBadgeClass(communication: Communication): string {
    if (communication.unreadCount && communication.unreadCount > 0) {
      return 'status-unread';
    }
    return communication.active ? 'status-active' : 'status-inactive';
  }

  // NEW: Get status text
  getStatusText(communication: Communication): string {
    if (communication.unreadCount && communication.unreadCount > 0) {
      return `Unread (${communication.unreadCount})`;
    }
    return communication.active ? 'Active' : 'Inactive';
  }

  // Toggle battalion dropdown
  toggleBattalionDropdown(): void {
    this.isBattalionDropdownOpen = !this.isBattalionDropdownOpen;
  }

  // Toggle individual battalion selection
  toggleBattalionSelection(battalionId: number): void {
    const battalion = this.battalions.find(b => b.id === battalionId);
    if (battalion) {
      battalion.selected = !battalion.selected;
      
      this.selectedBattalionIds = this.battalions
        .filter(b => b.selected)
        .map(b => b.id);

      this.updateSelectAllState();
      
      if (this.isEditMode && this.currentCommunication) {
        this.currentCommunication.selectedBattalions = [...this.selectedBattalionIds];
        this.currentCommunication.selectedBattalionNames = this.getBattalionNames(this.selectedBattalionIds);
      }
    }
  }

  // Toggle "Select All" functionality
  toggleSelectAll(): void {
    this.allBattalionsSelected = !this.allBattalionsSelected;
    
    this.battalions.forEach(battalion => {
      battalion.selected = this.allBattalionsSelected;
    });
    
    this.selectedBattalionIds = this.allBattalionsSelected ? this.battalions.map(b => b.id) : [];

    if (this.isEditMode && this.currentCommunication) {
      this.currentCommunication.selectedBattalions = [...this.selectedBattalionIds];
      this.currentCommunication.selectedBattalionNames = this.getBattalionNames(this.selectedBattalionIds);
    }
  }

  // Update "Select All" checkbox state based on individual selections
  updateSelectAllState(): void {
    this.allBattalionsSelected = this.battalions.length > 0 && 
      this.battalions.every(battalion => battalion.selected);
  }

  // Get selected battalion names for display
  getSelectedBattalionNames(): string {
    if (this.allBattalionsSelected || this.selectedBattalionIds.length === this.battalions.length) {
      return 'All Battalions';
    }
    
    if (this.selectedBattalionIds.length === 0) {
      return 'Select battalions...';
    }
    
    const selectedNames = this.battalions
      .filter(b => this.selectedBattalionIds.includes(b.id))
      .map(b => b.name);

    return selectedNames.join(', ');
  }

// communications.component.ts - FIXED LOAD METHOD
private loadCommunications() {
  this.isLoading = true;
  
  console.log('🔍 DEBUG: Loading user-specific communications...');
  console.log('🔍 DEBUG: Current user battalion:', this.currentUser?.battalionId);
  
  // ✅ FIX: Use getUserCommunications() instead of getCommunications()
  this.subscriptions.add(
    this.apiService.getUserCommunications(this.currentPage, this.itemsPerPage, this.searchTerm).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('🔍 DEBUG: User communications response:', response);
        
        if (response.status === 'SUCCESS' && response.data) {
          this.communications = this.transformCommunications(response.data);
          this.communications.forEach(comm => {
  comm.messages.forEach(msg => {
    msg.attachments.forEach(att => {
      console.log("filename",att.filename); // ← HERE is your filename
    });
  });
});
          this.applyFilters();
          
          console.log(`✅ Loaded ${this.communications.length} communications for battalion ${this.currentUser?.battalionId}`);
          
          // Debug each communication
          this.communications.forEach(comm => {
            console.log(`📄 Communication ${comm.id}:`, {
              subject: comm.subject,
              selectedBattalions: comm.selectedBattalions,
              battalionId: comm.battalionId
            });
          });
          
          if (response.pagination) {
            this.totalItems = response.pagination.total;
            this.totalPages = response.pagination.totalPages;
          } else {
            this.totalItems = this.communications.length;
            this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
          }
        } else {
          console.warn('⚠️ Using mock data - API response issue');
          this.loadMockCommunications();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Error loading user communications:', error);
        this.loadMockCommunications();
      }
    })
  );
}
  

//   private transformCommunications(apiData: any[]): Communication[] {
//     return apiData.map(comm => ({
//       id: comm.id,
//       createdDate: new Date(comm.createdDate || comm.created_date || comm.createdAt),
//       subject: comm.name || comm.subject,
//       battalionId: comm.battalionId,
//       battalionName: comm.battalionName || this.getBattalionName(comm.battalionId),
//       message: comm.message,
//       document: comm.document,
//       active: comm.active !== undefined ? comm.active : true,
//       replies: comm.messages ? this.transformReplies(comm.messages) : comm.replies || [],
//       name: comm.name,
//       createdBy: comm.createdBy,
//       selectedBattalions: comm.selectedBattalions || [comm.battalionId],
//       selectedBattalionNames: comm.selectedBattalionNames || this.getBattalionNames(comm.selectedBattalions || [comm.battalionId]),
//       unreadCount: comm.unreadCount || 0, // NEW: Add unread count
//       status: comm.status || 'active', // NEW: Add status
//       // messages:comm.attachments[0].fileName    // ✅ ADD THIS
// messages: comm.attachments
//   ? comm.attachments.map((a: any) => ({
//       id: a.id,
//       fileName: a.fileName,
//       url: `${environment.apiUrl.replace('/api/', '')}/download/performanceDocs/${a.fileName}`
//     }))
//   : [],

//     }));
//   }

private transformCommunications(apiData: any[]): Communication[] {
  return apiData.map(comm => ({
    id: comm.id,
    createdDate: new Date(comm.created_date || comm.createdDate),
    subject: comm.subject || comm.name,
    battalionId: comm.battalionId,
    battalionName: this.getBattalionName(comm.battalionId),
    message: comm.message,
    active: comm.active !== undefined ? comm.active : true,
    selectedBattalions: comm.selectedBattalions || [comm.battalionId],
    selectedBattalionNames: comm.selectedBattalionNames,
    unreadCount: comm.unreadCount || 0,
    status: comm.status || 'active',

    // ✅ FIXED: read attachments inside messages correctly
    messages: comm.messages?.map((m: any) => ({
      id: m.id,
      attachments: m.attachments?.map((a: any) => ({
        id: a.id,
        filename: a.filename,
        url: `${environment.apiUrl}/download/performanceDocs/${a.filename}`
      })) || []
    })) || []
  }));
}


//   downloadUrl(filename: string): string {
//   return `${environment.apiUrl}/download/performanceDocs/${filename}`;
// }

getAttachmentUrl(filename: string): string {
  return `${environment.apiUrl}download/performanceDocs/${filename}`;
}



  private transformReplies(messages: any[]): Reply[] {
    return messages.map(msg => ({
      id: msg.id,
      replyDate: new Date(msg.createdAt || msg.replyDate),
      replyBy: msg.user ? `${msg.user.firstName} ${msg.user.lastName}` : 'Unknown User',
      replyMessage: msg.message,
      message: msg.message,
      document: msg.attachments && msg.attachments.length > 0 ? 'attached' : undefined,
      userId: msg.userId, // NEW: Add user ID
      battalionId: msg.battalionId, // NEW: Add battalion ID
      fromUserName: msg.fromUserName || (msg.user ? `${msg.user.firstName} ${msg.user.lastName}` : 'Unknown User'), // NEW: Add user name
      read: msg.read || false // NEW: Add read status
    }));
  }

  private loadMockCommunications() {
    const mockData: Communication[] = [
      {
        id: 1,
        createdDate: new Date('2024-01-15'),
        subject: 'Training Schedule Update',
        battalionId: 1,
        battalionName: 'Alpha Battalion',
        message: 'Updated training schedule for next month...',
        active: true,
        selectedBattalions: [1],
        selectedBattalionNames: ['Alpha Battalion'],
        unreadCount: 2,
        status: 'active',
            messages: []      // ✅ ADD THIS

      },
      {
        id: 2,
        createdDate: new Date('2024-01-10'),
        subject: 'Equipment Maintenance',
        battalionId: 2,
        battalionName: 'Bravo Battalion',
        message: 'Quarterly equipment maintenance notice...',
        active: true,
        selectedBattalions: [2, 3],
        selectedBattalionNames: ['Bravo Battalion', 'Charlie Battalion'],
        unreadCount: 0,
        status: 'active',
            messages: []      // ✅ ADD THIS

      }
    ];

    this.communications = mockData;
    this.applyFilters();
  }

  private createEmptyCommunication(): Communication {
    return {
      id: 0,
      createdDate: new Date(),
      subject: '',
      battalionId: 0,
      message: '',
      document: '',
      active: true,
      name: '',
      createdBy: this.currentUser?.id,
      selectedBattalions: [],
      selectedBattalionNames: [],
      unreadCount: 0,
      status: 'active',
          messages: []      // ✅ ADD THIS

    };
  }

  // Search and filter methods
  onSearch(): void {
    this.currentPage = 1;
    this.loadCommunications();
  }

  onPageSizeChange(): void {
    this.itemsPerPage = this.pageSize;
    this.currentPage = 1;
    this.loadCommunications();
  }

  applyFilters(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCommunications = [...this.communications];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredCommunications = this.communications.filter(communication =>
        communication.subject.toLowerCase().includes(term) ||
        (communication.battalionName && communication.battalionName.toLowerCase().includes(term)) ||
        communication.message.toLowerCase().includes(term)
      );
    }
    this.updatePaginatedData();
  }

  // Pagination methods
  updatePaginatedData(): void {
    this.totalItems = this.filteredCommunications.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.totalItems);
    this.paginatedCommunications = this.filteredCommunications.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Sorting functionality
  sortTable(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredCommunications.sort((a: any, b: any) => {
      let aValue = a[column as keyof Communication];
      let bValue = b[column as keyof Communication];

      if (aValue instanceof Date && bValue instanceof Date) {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      }

      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      } else if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    this.updatePaginatedData();
  }

  // Modal functionality
  showAddCommunicationModal(): void {
    this.isEditMode = false;
    this.currentCommunication = this.createEmptyCommunication();
    this.showModal = true;
    this.isBattalionDropdownOpen = false;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentCommunication = this.createEmptyCommunication();
    this.isEditMode = false;
    this.battalions.forEach(b => b.selected = false);
    this.selectedBattalionIds = [];
    this.allBattalionsSelected = false;
    this.isBattalionDropdownOpen = false;
  }

  editCommunication(communication: Communication): void {
    this.isEditMode = true;
    this.currentCommunication = { ...communication };
    
    if (communication.selectedBattalions && communication.selectedBattalions.length > 0) {
      this.selectedBattalionIds = [...communication.selectedBattalions];
      this.battalions.forEach(battalion => {
        battalion.selected = this.selectedBattalionIds.includes(battalion.id);
      });
      this.updateSelectAllState();
    }
    
    this.showModal = true;
    this.isBattalionDropdownOpen = false;
  }

  // NEW: Show communication status
  showCommunicationStatus(communication: Communication): void {
    this.selectedCommunication = communication;
    this.showStatusView = true;
  }

  // NEW: Close status view
  closeStatusView(): void {
    this.showStatusView = false;
    this.selectedCommunication = null;
  }

  toggleCommunicationStatus(communication: Communication): void {
    const updateData = {
      active: !communication.active,
      updatedBy: this.currentUser?.id
    };

    this.subscriptions.add(
      this.apiService.updateCommunication(communication.id, updateData).subscribe({
        next: (response) => {
          if (response.status === 'SUCCESS') {
            const index = this.communications.findIndex(c => c.id === communication.id);
            if (index !== -1) {
              this.communications[index].active = !communication.active;
            }
            this.applyFilters();
          }
        },
        error: (error) => {
          console.error('Error toggling communication status:', error);
          const index = this.communications.findIndex(c => c.id === communication.id);
          if (index !== -1) {
            this.communications[index].active = !communication.active;
            this.applyFilters();
          }
        }
      })
    );
  }

  addCommunication(): void {
    if (!this.currentCommunication.subject || !this.currentCommunication.message || this.selectedBattalionIds.length === 0) {
      alert('Please fill all required fields');
      return;
    }

    this.isLoading = true;

    
    
    const battalionIds = this.selectedBattalionIds.length > 0 ? this.selectedBattalionIds : [this.currentCommunication.battalionId];
    const battalionNames = this.getBattalionNames(battalionIds);
    
    const communicationData = {
      name: this.currentCommunication.subject,
      subject: this.currentCommunication.subject,
      message: this.currentCommunication.message,
      battalionId: battalionIds[0],
      selectedBattalions: battalionIds,
      document: this.currentCommunication.document,
      selectedBattalionNames: battalionNames,
      userIds: battalionIds,
      active: this.currentCommunication.active,
      createdBy: this.currentUser?.id
    };

    this.subscriptions.add(
      this.apiService.createCommunication(communicationData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.status === 'SUCCESS' && response.data) {
            const newComm = this.transformCommunications([response.data])[0];
            this.communications.unshift(newComm);
            this.applyFilters();
            this.closeModal();

            // NEW: Notify via WebSocket
            battalionIds.forEach(battalionId => {
this.webSocketService.notifyBattalion(battalionId.toString(), 'new_communication', {
                communicationId: newComm.id,
                subject: newComm.subject,
                message: 'New communication created',
                fromUserName: this.currentUser?.firstName + ' ' + this.currentUser?.lastName
              });
            });

          } else {
            this.handleApiError('Failed to create communication');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error creating communication:', error);
          this.handleApiError('Error creating communication. Please try again.');
          this.addCommunicationLocally();
        }
      })
    );
  }

  private addCommunicationLocally(): void {
    const newId = this.getNextId();
    const battalionIds = this.selectedBattalionIds.length > 0 ? 
      this.selectedBattalionIds : [this.currentCommunication.battalionId];
    const battalionNames = this.getBattalionNames(battalionIds);
    
    this.currentCommunication.id = newId;
    this.currentCommunication.active = this.currentCommunication.active || false;
    this.currentCommunication.battalionName = this.getBattalionName(battalionIds[0]);
    this.currentCommunication.selectedBattalions = battalionIds;
    this.currentCommunication.selectedBattalionNames = battalionNames;
    
    this.communications.unshift({ ...this.currentCommunication });
    this.applyFilters();
    this.isLoading = false;
    this.closeModal();
  }

  updateCommunication(): void {
    if (!this.currentCommunication.subject || !this.currentCommunication.message || this.selectedBattalionIds.length === 0) {
      alert('Please fill all required fields');
      return;
    }

    this.isLoading = true;
    
    const battalionIds = this.selectedBattalionIds.length > 0 ? this.selectedBattalionIds : [this.currentCommunication.battalionId];
    const battalionNames = this.getBattalionNames(battalionIds);
    
    const updateData = {
      name: this.currentCommunication.subject,
      subject: this.currentCommunication.subject,
      message: this.currentCommunication.message,
      battalionId: battalionIds[0],
      selectedBattalions: battalionIds,
      selectedBattalionNames: battalionNames,
      userIds: battalionIds,
      active: this.currentCommunication.active,
      updatedBy: this.currentUser?.id
    };

    this.subscriptions.add(
      this.apiService.updateCommunication(this.currentCommunication.id, updateData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.status === 'SUCCESS' && response.data) {
            const updatedComm = this.transformCommunications([response.data])[0];
            const index = this.communications.findIndex(c => c.id === this.currentCommunication.id);
            if (index !== -1) {
              this.communications[index] = updatedComm;
            }
            this.applyFilters();
            this.closeModal();
          } else {
            this.handleApiError('Failed to update communication');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error updating communication:', error);
          this.handleApiError('Error updating communication. Please try again.');
          this.updateCommunicationLocally();
        }
      })
    );
  }

  private updateCommunicationLocally(): void {
    const index = this.communications.findIndex(c => c.id === this.currentCommunication.id);
    if (index !== -1) {
      const battalionIds = this.selectedBattalionIds.length > 0 ? 
        this.selectedBattalionIds : [this.currentCommunication.battalionId];
      const battalionNames = this.getBattalionNames(battalionIds);
      
      this.communications[index] = { ...this.currentCommunication };
      this.communications[index].battalionName = this.getBattalionName(this.currentCommunication.battalionId);
      this.communications[index].selectedBattalions = battalionIds;
      this.communications[index].selectedBattalionNames = battalionNames;
    }
    this.applyFilters();
    this.isLoading = false;
    this.closeModal();
  }

  private getNextId(): number {
    return this.communications.length > 0 ? Math.max(...this.communications.map(c => c.id)) + 1 : 1;
  }

  // Detail view functionality
  viewCommunicationDetails(communication: Communication): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.apiService.getCommunicationById(communication.id).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.status === 'SUCCESS' && response.data) {
            this.selectedCommunication = this.transformCommunications([response.data])[0];
            this.showDetailView = true;
            
            // NEW: Mark all replies as read when viewing
            this.markAllRepliesAsRead(this.selectedCommunication);
          } else {
            this.selectedCommunication = communication;
            this.showDetailView = true;
            this.markAllRepliesAsRead(this.selectedCommunication);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error loading communication details:', error);
          this.selectedCommunication = communication;
          this.showDetailView = true;
          this.markAllRepliesAsRead(this.selectedCommunication);
        }
      })
    );
  }

  closeDetailView(): void {
    this.showDetailView = false;
    this.replyMessage = '';
    this.replyAttachments = [];
    
    // NEW: Stop typing when closing view
    if (this.selectedCommunication) {
      this.webSocketService.stopTyping({
        communicationId: this.selectedCommunication.id,
        battalionId: this.currentUser.battalionId
      });
    }
    this.selectedCommunication = null;
  }

  onFileChange(event: any): void {
    this.replyAttachments = Array.from(event.target.files);
  }

  // UPDATED: Send reply with WebSocket
  sendReply(): void {
    if (!this.replyMessage.trim() || !this.selectedCommunication) {
      alert('Please enter a reply message');
      return;
    }

    this.isLoading = true;
    
    // NEW: Send via WebSocket for real-time delivery
    const replyData = {
      communicationId: this.selectedCommunication.id,
      message: this.replyMessage,
      battalionId: this.currentUser.battalionId
    };

    // Defensive: wrap websocket send to ensure it doesn't block the API call
    try {
      console.log('🛰️ Sending websocket message:', replyData);
      this.webSocketService.sendMessage(replyData);
    } catch (wsErr) {
      console.error('WebSocket send failed, continuing to API call:', wsErr);
    }

    // Optimistically add the reply to the local UI immediately
    // this.addReplyLocally();
    // Capture the message before clearing the input so the API payload contains the text
    const messageToSend = this.replyMessage;
    this.replyMessage = ''; // Clear input right away

    // Also send to API for persistence
    const apiReplyData = {
      message: messageToSend,
      battalionId: this.currentUser.battalionId,
      userIds: []
    };

    // Log the payload so we can debug network issues
    console.log('HTTP POST payload for reply:', apiReplyData);

    this.subscriptions.add(
      this.apiService.sendReply(this.selectedCommunication.id, apiReplyData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.status === 'SUCCESS' && response.data) {
            // The reply is already added locally. We can update its ID if the backend provides one.
            console.log('Reply persisted successfully.');
            // Optional: Find the locally added reply and update its ID from `response.data.id`
            // this.updateLocalReplyId(response.data);
            
            // NEW: Stop typing after sending
            this.webSocketService.stopTyping({
              communicationId: this.selectedCommunication!.id,
              battalionId: this.currentUser.battalionId
            });
          } else {
            // If persistence fails, you might want to show an error icon on the message
            this.handleApiError('Failed to send reply');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error sending reply:', error);
          this.handleApiError('Error sending reply. Please try again.'); // Consider removing the local reply or marking it as 'failed'
        }
      })
    );
  }

  // NEW: Handle typing events
  onReplyInputChange(): void {
    if (this.selectedCommunication) {
      this.webSocketService.startTyping({
        communicationId: this.selectedCommunication.id,
        battalionId: this.currentUser.battalionId
      });
    }
  }

  // NEW: Mark message as read
  markMessageAsRead(reply: Reply): void {
    if (!reply.read && this.selectedCommunication) {
      reply.read = true;
      
      // Update unread count
      if (this.selectedCommunication.unreadCount && this.selectedCommunication.unreadCount > 0) {
        this.selectedCommunication.unreadCount--;
      }

      // Notify via WebSocket
      this.webSocketService.markAsRead({
        communicationId: this.selectedCommunication.id,
        messageId: reply.id
      });
    }
  }

  // NEW: Mark all replies as read
  markAllRepliesAsRead(communication: Communication): void {
    if (communication.replies) {
      communication.replies.forEach(reply => {
        if (!reply.read) {
          reply.read = true;
          this.markMessageAsRead(reply);
        }
      });
      communication.unreadCount = 0;
    }
  }

  private addReplyLocally(message: string, apiReply?: any): void {
    if (!this.selectedCommunication) return;

    const newReply: Reply = {
      id: apiReply?.id || this.getNextReplyId(),
      replyDate: new Date(),
      replyBy: `${this.currentUser?.firstName || 'Current'} ${this.currentUser?.lastName || 'User'}`,
      replyMessage: message,
      message: message,
      document: this.replyAttachments.length > 0 ? 'attached' : undefined,
      userId: this.currentUser?.id,
      battalionId: this.currentUser?.battalionId,
      fromUserName: `${this.currentUser?.firstName || 'Current'} ${this.currentUser?.lastName || 'User'}`,
      read: true // Mark as read since current user sent it
    };

    if (!this.selectedCommunication.replies) {
      this.selectedCommunication.replies = [];
    }
    
    this.selectedCommunication.replies.push(newReply);

    const index = this.communications.findIndex(c => c.id === this.selectedCommunication!.id);
    if (index !== -1) {
      this.communications[index] = { ...this.selectedCommunication };
    }

    this.replyAttachments = [];
    this.isLoading = false;
  }

  private getNextReplyId(): number {
    let maxId = 0;
    this.communications.forEach(comm => {
      if (comm.replies) {
        comm.replies.forEach(reply => {
          if (reply.id > maxId) {
            maxId = reply.id;
          }
        });
      }
    });
    return maxId + 1;
  }

 onDocumentSelected(event: any): void {
  const files = event.target.files;

  if (files && files.length > 0) {
    const file = files[0]; // single file
    this.currentCommunication.document = file;

    // Call the upload API
    this.uploadDocument(file);
  } else {
    this.currentCommunication.document = undefined;
  }
}

uploadDocument(file: File): void {
  const formData = new FormData();
  formData.append('file', file);

  // Assuming you have injected HttpClient as `private http: HttpClient`
  this.performanceService.uploadDocument(file).subscribe({
    next: (response: any) => {
      if (response.status === 'SUCCESS') {
        const fileUrl = response.fileUrl; // Backend returns this
        console.log('Uploaded file URL:', fileUrl);
        this.currentCommunication.document = fileUrl;

        // Set form control to file URL
        // this.performanceForm.get(controlName)?.setValue(fileUrl);
      }
    },
    error: (err) => {
      console.error('File upload failed:', err);
    }
  });
}


  private handleApiError(message: string): void {
    alert(message);
  }

  // TrackBy function for performance
  trackByCommunicationId(index: number, communication: Communication): number {
    return communication.id;
  }

  trackByReplyId(index: number, reply: Reply): number {
    return reply.id;
  }

  trackByBattalionId(index: number, battalion: Battalion): number {
    return battalion.id;
  }
}