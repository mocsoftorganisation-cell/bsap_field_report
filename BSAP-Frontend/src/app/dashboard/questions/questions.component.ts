import { Component, OnInit } from '@angular/core';
import { ApiService, Question, Topic, SubTopic, ApiResponse } from '../../services/api.service';

@Component({
    selector: 'app-questions',
    templateUrl: './questions.component.html',
    styleUrls: ['./questions.component.css'],
    standalone: false
})
export class QuestionsComponent implements OnInit {
  
  // Table data
  questions: Question[] = [];
  filteredQuestions: Question[] = [];
  paginatedQuestions: Question[] = [];
  
  // Pagination
  currentPage = 1; 
  entriesPerPage = 10;
  totalPages = 0;
  totalRecords = 0;

  searchTerm = '';

  itemsPerPage = 10;
  pageSize = 10;
  totalItems = 0;

  
  // Modal
  showModal = false;
  isEditing = false;
  
  // Loading states
  loading = false;
  loadingTopics = false;
  loadingSubTopics = false;
  
  // Form data
  formData: any = {
    topicId: '',
    subTopicId: '',
    question: '',
    priority: '',
    type: 'NUMBER',
    defaultVal: 'NONE',
    isPrevious: false,
    isCumulative: false,
    formula: '',
    defaultQue: '',
    defaultSub: '',
    active: true
  };

  // Dropdown data
  topics: Topic[] = [];
  subTopics: SubTopic[] = [];
  filteredSubTopics: SubTopic[] = [];
  availableQuestions: Question[] = [];

  // Formula Builder State
  formulaBuilderState = {
    step: 'question', // 'question', 'subtopic', 'operation'
    showQuestionDiv: false,
    showSubTopicDiv: false,
    showOperationDiv: false,
    selectedQuestion: '',
    selectedSubTopic: '',
    selectedOperation: ''
  };

  // Question types
  questionTypes = [
    { value: 'TEXT', label: 'Text' },
    { value: 'DATE', label: 'Date' },
    { value: 'NUMBER', label: 'Number' },
    { value: 'PRICE', label: 'Price' },
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
    { value: 'WORD_DOCUMENT', label: 'Word Document' },  // 🆕
    { value: 'PDF_DOCUMENT', label: 'PDF Document' }     // 🆕
  ];

  // Default value types
  defaultValueTypes = [
    { value: 'NONE', label: 'NONE' },
    { value: 'PREVIOUS', label: 'PREVIOUS' },
    { value: 'QUESTION', label: 'QUESTION' },
    { value: 'PS', label: 'PS' },
    { value: 'SUB', label: 'Subdivision' },
    { value: 'CIRCLE', label: 'Circle' },
    { value: 'PSOP', label: 'PS/OP' }
  ];

  // Mathematical operations
  mathOperations = [
    { value: '+', label: 'Plus' },
    { value: '-', label: 'Minus' },
    { value: '*', label: 'Multiply' },
    { value: '/', label: 'Division' },
    { value: '=', label: 'Equal' },
    { value: '==', label: 'Equal To' }
  ];

  // Conditional visibility flags
  showDefaultQuestion = false;
  showDefaultSubTopic = false;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadActiveTopics();
    this.loadQuestions();
  }



  //  onSearch() {
  //   this.currentPage = 1;
  //   this.updateFilteredData();
  // }
onSearch() {
  this.currentPage = 1;
    this.updateFilteredData();
}
    // Page size change handler
  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page
     this.loadQuestions();
  }


  private updateFilteredData() {
  
       if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      this.filteredQuestions = this.questions.filter(b =>
        b.question.toLowerCase().includes(term)
      
        // (b.range?.rangeName || '').toLowerCase().includes(term) ||
        // (b.permissionCode || '').toLowerCase().includes(term) 
       
      );
      // When searching locally on current page, show filtered results only
      this.paginatedQuestions= this.filteredQuestions;
    } else {
      // No local search — show the server-provided page
      this.filteredQuestions = this.questions;
      this.paginatedQuestions = this.questions;
    }
}

  //   private updateFilteredData() {
  //   // Apply optional client-side search on the current page of data
  //   if (this.searchTerm && this.searchTerm.trim()) {
  //     const term = this.searchTerm.toLowerCase();
  //     this.filteredQuestions = this.questions.filter(b =>
  //       b.question.toLowerCase().includes(term) 
  //       // (b.range?.rangeName || '').toLowerCase().includes(term) ||
  //       // (b.topic|| '').toLowerCase().includes(term) ||
  //       // (b.subTopic || '').toLowerCase().includes(term) ||
  //       // (b.battalionArea || '').toLowerCase().includes(term)
  //     );


  //     console.log("filtered data" , term);
      
  //     // When searching locally on current page, show filtered results only
  //     this.paginatedQuestions = this.filteredQuestions;
  //   } else {
  //     // No local search — show the server-provided page
  //     this.filteredQuestions = this.questions;
  //     this.paginatedQuestions = this.questions;
  //   }
  // }

  // API Methods
  loadActiveTopics(): void {
    this.loadingTopics = true;
    this.apiService.getActiveTopics().subscribe({
      next: (response: ApiResponse<Topic[]>) => {
        if (response.status === 'SUCCESS' && response.data) {
          this.topics = response.data;
        }
        this.loadingTopics = false;
      },
      error: (error) => {
        console.error('Error loading topics:', error);
        this.loadingTopics = false;
      }
    });
  }

  loadSubTopicsByTopic(topicId: number): void {
    if (!topicId) {
      this.filteredSubTopics = [];
      return;
    }
    
    this.loadingSubTopics = true;
    this.apiService.getSubTopicsByTopicForForm(topicId).subscribe({
      next: (response: ApiResponse<SubTopic[]>) => {
        if (response.status === 'SUCCESS' && response.data) {
          this.filteredSubTopics = response.data;
        }
        this.loadingSubTopics = false;
      },
      error: (error) => {
        console.error('Error loading sub-topics:', error);
        this.loadingSubTopics = false;
      }
    });
  }

  loadQuestions(): void {
    this.loading = true;
    
    // Simple API call with only page and limit parameters
    this.apiService.getQuestions(this.currentPage, this.entriesPerPage).subscribe({
      next: (response: ApiResponse<Question[]>) => {
        if (response.status === 'SUCCESS' && response.data) {
          this.questions = response.data;
           this.updateFilteredData();
          if (response.pagination) {
            this.totalRecords = response.pagination.total;
            this.totalPages = response.pagination.totalPages;
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.loading = false;
      }
    });
  }

  // Pagination methods
  onEntriesPerPageChange(): void {
    this.currentPage = 1;
    this.loadQuestions();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadQuestions();
  }

  getTotalPages(): number {
    return this.totalPages;
  }


   get paginatedQuestion(): Question[] {
      return this.paginatedQuestions;
    }
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    
    if (totalPages <= 7) {
      // Show all pages if total pages <= 7
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination for many pages
      if (currentPage <= 4) {
        // Show first 5 pages + ... + last page
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        if (totalPages > 6) {
          pages.push(-1); // -1 represents "..."
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 3) {
        // Show first page + ... + last 5 pages
        pages.push(1);
        if (totalPages > 6) {
          pages.push(-1); // -1 represents "..."
        }
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page + ... + current-1, current, current+1 + ... + last page
        pages.push(1);
        pages.push(-1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(totalPages);
      }
    }
    return pages;
  }

  getStartEntry(): number {
    return this.totalRecords === 0 ? 0 : (this.currentPage - 1) * this.entriesPerPage + 1;
  }

  getEndEntry(): number {
    const end = this.currentPage * this.entriesPerPage;
    return end > this.totalRecords ? this.totalRecords : end;
  }

  // Removed search and sort methods - using simple pagination only

  // Modal methods
  openAddModal(): void {
    this.isEditing = false;
    this.resetFormData();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.resetFormData();
  }

  resetFormData(): void {
    this.formData = {
      topicId: '',
      subTopicId: '',
      question: '',
      priority: '',
      type: 'NUMBER',
      defaultVal: 'NONE',
      isPrevious: false,
      isCumulative: false,
      formula: '',
      defaultQue: '',
      defaultSub: '',
      active: true
    };
    this.filteredSubTopics = [];
    this.availableQuestions = [];
    this.resetFormulaBuilder();
    this.showDefaultQuestion = false;
    this.showDefaultSubTopic = false;
  }

  onTopicChange(): void {
    this.formData.subTopicId = '';
    this.formData.formula = '';
    this.resetFormulaBuilder();
    
    if (this.formData.topicId) {
      this.loadSubTopicsByTopic(this.formData.topicId);
      this.loadQuestionsByTopic(this.formData.topicId);
    } else {
      this.filteredSubTopics = [];
      this.availableQuestions = [];
    }
  }

  onDefaultValueChange(): void {
    this.showDefaultQuestion = this.formData.defaultVal === 'QUESTION';
    this.showDefaultSubTopic = this.formData.defaultVal === 'QUESTION';
    
    if (this.formData.defaultVal !== 'QUESTION') {
      this.formData.defaultQue = '';
      this.formData.defaultSub = '';
    }
  }

  // Formula Builder Methods
  loadQuestionsByTopic(topicId: number): void {
    this.apiService.getQuestionsByTopic(topicId).subscribe({
      next: (response: ApiResponse<Question[]>) => {
        if (response.status === 'SUCCESS' && response.data) {
          this.availableQuestions = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading questions:', error);
      }
    });
  }

  startFormulaBuilder(): void {
    this.formulaBuilderState.showQuestionDiv = true;
    this.formulaBuilderState.showSubTopicDiv = false;
    this.formulaBuilderState.showOperationDiv = false;
    this.formulaBuilderState.step = 'question';
  }

  resetFormulaBuilder(): void {
    this.formulaBuilderState = {
      step: 'question',
      showQuestionDiv: false,
      showSubTopicDiv: false,
      showOperationDiv: false,
      selectedQuestion: '',
      selectedSubTopic: '',
      selectedOperation: ''
    };
  }

  onQuestionSelect(): void {
    if (!this.formulaBuilderState.selectedQuestion) return;
    
    // Add question ID to formula
    this.formData.formula += this.formulaBuilderState.selectedQuestion;
    
    // Move to subtopic selection
    this.formulaBuilderState.showQuestionDiv = false;
    this.formulaBuilderState.showSubTopicDiv = true;
    this.formulaBuilderState.showOperationDiv = false;
    this.formulaBuilderState.step = 'subtopic';
  }

  onSubTopicSelect(): void {
    if (this.formulaBuilderState.selectedSubTopic) {
      // Add subtopic ID with underscore separator
      this.formData.formula += '_' + this.formulaBuilderState.selectedSubTopic;
    }
    
    // Move to operation selection
    this.formulaBuilderState.showQuestionDiv = false;
    this.formulaBuilderState.showSubTopicDiv = false;
    this.formulaBuilderState.showOperationDiv = true;
    this.formulaBuilderState.step = 'operation';
  }

  skipSubTopic(): void {
    // Skip subtopic and go to operation selection
    this.formulaBuilderState.showQuestionDiv = false;
    this.formulaBuilderState.showSubTopicDiv = false;
    this.formulaBuilderState.showOperationDiv = true;
    this.formulaBuilderState.step = 'operation';
  }

  onOperationSelect(): void {
    if (!this.formulaBuilderState.selectedOperation) return;
    
    // Add operation to formula
    this.formData.formula += this.formulaBuilderState.selectedOperation;
    
    // Reset for next question/operation cycle
    this.formulaBuilderState.selectedQuestion = '';
    this.formulaBuilderState.selectedSubTopic = '';
    this.formulaBuilderState.selectedOperation = '';
    
    // Show question selection for next part of formula
    this.formulaBuilderState.showQuestionDiv = true;
    this.formulaBuilderState.showSubTopicDiv = false;
    this.formulaBuilderState.showOperationDiv = false;
    this.formulaBuilderState.step = 'question';
  }

  resetFormula(): void {
    this.formData.formula = '';
    this.resetFormulaBuilder();
  }

  finishFormula(): void {
    this.resetFormulaBuilder();
  }

  saveQuestion(): void {
    if (!this.formData.question || !this.formData.topicId) {
      alert('Please fill all required fields');
      return;
    }

    const questionData: Partial<Question> = {
      question: this.formData.question,
      topicId: parseInt(this.formData.topicId),
      subTopicId: this.formData.subTopicId ? parseInt(this.formData.subTopicId) : undefined,
      priority: this.formData.priority ? parseInt(this.formData.priority) : undefined,
      type: this.formData.type,
      defaultVal: this.formData.defaultVal,
      isPrevious: this.formData.isPrevious,
      isCumulative: this.formData.isCumulative,
      formula: this.formData.formula,
      defaultQue: this.formData.defaultQue ? parseInt(this.formData.defaultQue) : undefined,
      active: this.formData.active
    };

    if (this.isEditing) {
      this.apiService.updateQuestion(this.formData.id, questionData).subscribe({
        next: (response: ApiResponse<Question>) => {
          if (response.status === 'SUCCESS') {
            this.loadQuestions();
            this.closeModal();
          }
        },
        error: (error) => {
          console.error('Error updating question:', error);
          alert('Error updating question');
        }
      });
    } else {
      this.apiService.addQuestion(questionData).subscribe({
        next: (response: ApiResponse<Question>) => {
          if (response.status === 'SUCCESS') {
            this.loadQuestions();
            this.closeModal();
          }
        },
        error: (error) => {
          console.error('Error creating question:', error);
          alert('Error creating question');
        }
      });
    }
  }

  toggleQuestionStatus(question: Question): void {
    const apiCall = question.active 
      ? this.apiService.deactivateQuestion(question.id)
      : this.apiService.activateQuestion(question.id);

    apiCall.subscribe({
      next: (response: ApiResponse<Question>) => {
        if (response.status === 'SUCCESS') {
          question.active = !question.active;
        }
      },
      error: (error) => {
        console.error('Error toggling question status:', error);
        alert('Error updating question status');
      }
    });
  }

  editQuestion(question: Question): void {
    this.isEditing = true;
    this.formData = { 
      id: question.id,
      topicId: question.topicId,
      subTopicId: question.subTopicId,
      question: question.question,
      priority: question.priority,
      type: question.type,
      defaultVal: question.defaultVal,
      isPrevious: question.isPrevious,
      isCumulative: question.isCumulative,
      formula: question.formula,
      defaultQue: question.defaultQue,
      active: question.active
    };
    if (this.formData.topicId) {
      this.loadSubTopicsByTopic(this.formData.topicId);
      this.loadQuestionsByTopic(this.formData.topicId);
    }
    // Set conditional visibility flags based on default value
    this.onDefaultValueChange();
    this.showModal = true;
  }

  deleteQuestion(question: Question): void {
    if (confirm('Are you sure you want to delete this question?')) {
      this.apiService.deleteQuestion(question.id).subscribe({
        next: (response: ApiResponse<any>) => {
          if (response.status === 'SUCCESS') {
            this.loadQuestions();
          }
        },
        error: (error) => {
          console.error('Error deleting question:', error);
          alert('Error deleting question');
        }
      });
    }
  }

  getTopicName(question: Question): string {
    // Use the topic data directly from the question object if available
    if (question.topic && question.topic.topicName) {
      return question.topic.topicName;
    }
    // Fallback to searching in topics array
    const topic = this.topics.find(t => t.id === question.topicId);
    return topic ? topic.topicName : '';
  }

  getSubTopicName(question: Question): string {
    // Use the subTopic data directly from the question object if available
    if (question.subTopic && question.subTopic.subTopicName) {
      return question.subTopic.subTopicName;
    }
    // Fallback to searching in filteredSubTopics array
    if (question.subTopicId) {
      const subTopic = this.filteredSubTopics.find(st => st.id === question.subTopicId);
      return subTopic ? subTopic.subTopicName : '';
    }
    return '';
  }

  resetForm(): void {
    this.formData.formula = '';
  }

  trackByQuestionId(index: number, question: Question): number {
    return question.id;
  }

  formatFormula(formula: string): string {
    if (!formula) return '';
    
    // Break formula text every 20 characters with a line break
    const maxCharsPerLine = 20;
    let result = '';
    
    for (let i = 0; i < formula.length; i += maxCharsPerLine) {
      result += formula.substr(i, maxCharsPerLine);
      if (i + maxCharsPerLine < formula.length) {
        result += '\n';
      }
    }
    
    return result;
  }
}