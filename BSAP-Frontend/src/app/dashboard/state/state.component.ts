import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService, State, ApiResponse } from '../../services/api.service';

@Component({
    selector: 'app-state-management',
    templateUrl: './state.component.html',
    styleUrls: ['./state.component.css'],
    standalone: false
})
export class StateComponent implements OnInit, OnDestroy {
  states: State[] = [];
  filteredStates: State[] = [];
  searchText: string = '';
  currentPage: number = 1;
  entriesPerPage: number = 10;
  totalPages: number = 1;
  totalItems: number = 0;

  // Modal and form states
  showModal = false;
  isEditMode = false;
  isLoading = false;
  currentState: State = { id: 0, stateName: '', stateDescription: '', active: true };
  
  // Sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Debouncing properties
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.setupSearchDebouncing();
    this.loadStates();
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  /**
   * Set up debounced search functionality
   * Waits 500ms after user stops typing before searching
   */
  private setupSearchDebouncing(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(500), // Wait 500ms after last keystroke
        distinctUntilChanged() // Only search if value changed
      )
      .subscribe((searchText: string) => {
        this.performSearch(searchText);
      });
  }

  /**
   * Called when user types in search input
   */
  onSearchInput(): void {
    // Push the search term to the subject for debouncing
    this.searchSubject.next(this.searchText);
  }

  /**
   * Perform the actual search
   */
  private performSearch(searchText: string): void {
    this.currentPage = 1;
    this.loadStates();
  }

  /**
   * Manual search trigger (e.g., from search button)
   */
  onSearch(): void {
    // Cancel any pending debounced search
    this.searchSubject.next(this.searchText);
  }

  /**
   * Clear search and reset
   */
  clearSearch(): void {
    this.searchText = '';
    this.currentPage = 1;
    this.loadStates();
  }

  loadStates(): void {
    this.isLoading = true;
    this.apiService.getStates(
      this.currentPage,
      this.entriesPerPage,
      this.searchText,
      this.getSortByField(),
      this.sortDirection
    ).subscribe({
      next: (response: ApiResponse<State[]>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.states = response.data || [];
          this.filteredStates = [...this.states];
          this.totalItems = response.pagination?.total || 0;
          this.totalPages = response.pagination?.totalPages || 0;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading states:', error);
      }
    });
  }

  onEntriesPerPageChange(): void {
    this.currentPage = 1;
    this.loadStates();
  }

  get paginatedStates(): State[] {
    return this.filteredStates;
  }

  get showingStart(): number {
    return (this.currentPage - 1) * this.entriesPerPage + 1;
  }

  get showingEnd(): number {
    return Math.min(this.currentPage * this.entriesPerPage, this.totalItems);
  }

  // Modal methods
  showAddStateModal(): void {
    this.currentState = { id: 0, stateName: '', stateDescription: '', active: true };
    this.isEditMode = false;
    this.showModal = true;
  }

  editState(state: State): void {
    this.currentState = { ...state };
    this.isEditMode = true;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.currentState = { id: 0, stateName: '', stateDescription: '', active: true };
  }

  addState(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.apiService.createState(this.currentState).subscribe({
      next: (response: ApiResponse<State>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.closeModal();
          this.loadStates();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error creating state:', error);
      }
    });
  }

  updateState(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.apiService.updateState(this.currentState.id, this.currentState).subscribe({
      next: (response: ApiResponse<State>) => {
        this.isLoading = false;
        if (response.status === 'SUCCESS') {
          this.closeModal();
          this.loadStates();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error updating state:', error);
      }
    });
  }

  toggleStateStatus(state: State): void {
    this.apiService.toggleStateStatus(state.id, !state.active).subscribe({
      next: (response: ApiResponse<State>) => {
        if (response.status === 'SUCCESS') {
          this.loadStates();
        }
      },
      error: (error) => {
        console.error('Error toggling state status:', error);
      }
    });
  }

  deleteState(state: State): void {
    if (confirm(`Are you sure you want to delete ${state.stateName}?`)) {
      this.apiService.deleteState(state.id).subscribe({
        next: (response: ApiResponse<any>) => {
          if (response.status === 'SUCCESS') {
            this.loadStates();
          }
        },
        error: (error) => {
          console.error('Error deleting state:', error);
        }
      });
    }
  }

  // Sorting methods
  sortTable(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadStates();
  }

  private getSortByField(): string {
    const fieldMap: { [key: string]: string } = {
      'id': 'id',
      'name': 'stateName',
      'description': 'stateDescription',
      'active': 'active'
    };
    return fieldMap[this.sortColumn] || 'stateName';
  }

  // Pagination methods
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadStates();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadStates();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadStates();
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

  getTotalPages(): number {
    return this.totalPages;
  }

  // TrackBy function for better performance
  trackByStateId(index: number, state: State): number {
    return state.id;
  }
}