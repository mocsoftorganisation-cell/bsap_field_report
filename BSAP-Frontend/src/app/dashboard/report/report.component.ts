import { Component, OnInit, OnDestroy, NgModule } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService,Companys } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
interface Battalion {
  id: number;
  battalionName: string;
  battalionHead?: string;
  range?: {
    rangeId: number;
    rangeName: string;
  };
}

interface Module {
  id: number;
  moduleName: string;
}

interface Topic {
  id: number;
  topicName: string;
  subName: string;
  moduleId: number;
}

interface SubTopic {
  id: number;
  subTopicName: string;
  topicId: number;
}

interface Question {
  id: number;
  question: string;
  topicId: number;
  subTopicId?: number;
}

interface ReportData {
  reportId: string;
  data: any[];
  summary?: any;
  chartData?: any;
  metadata?: any;
  trendData?: any[];
  performanceMetrics?: any[];
  complianceStatus?: any;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
    hasPrevious: boolean;
    isFirst: boolean;
    isLast: boolean;
    numberOfElements: number;
    firstPage: number;
    lastPage: number;
    nextPage: number | null;
    previousPage: number | null;
    pageSizes: number[];
    sortBy: string;
    sortDirection: string;
  };
  performance?: {
    queryMetrics?: {
      totalQueryTime: string;
      recordsScanned: number;
      recordsReturned: number;
    };
    processingMetrics?: {
      totalProcessingTime: string;
    };
    cacheMetrics?: {
      cacheChecked: boolean;
      cacheHit: boolean;
      cacheStored: boolean;
    };
    optimizationSuggestions?: string[];
  };
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

type ReportType = 'SUMMARY' | 'DETAILED' | 'COMPARISON' | 'TREND' | 'PERFORMANCE' | 'COMPLIANCE';
type ExportFormat = 'CSV' | 'EXCEL' | 'PDF' | 'JSON';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class ReportComponent implements OnInit, OnDestroy {
  reportForm!: FormGroup;
  isLoading = false;
  isGenerating = false;

  // Data arrays
  battalions: Battalion[] = [];
  modules: Module[] = [];
  topics: Topic[] = [];
  subTopics: SubTopic[] = [];
  questions: Question[] = [];


// Add these properties to your component class
company: Companys[] = [];
filteredCompanies: Companys[] = [];
selectedCompanies: number[] = [];

  // Filtered arrays
  filteredTopics: Topic[] = [];
  filteredSubTopics: SubTopic[] = [];
  filteredQuestions: Question[] = [];

  // Report data
  reportData: ReportData | null = null;
  lastReportId: string | null = null;
  metadata: any = null;
  templates: any[] = [];

 
  baseDownloadUrl = environment.apiUrl + 'download/performanceDocs/';

  private destroy$ = new Subject<void>();

  // Month options
  months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Years (current and previous years)
  years: number[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {
    this.initializeForm();
    this.generateYears();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.reportForm = this.fb.group({
      reportType: ['SUMMARY', Validators.required],
      battalionIds: [[], Validators.required],
      moduleId: ['', Validators.required],
      topicId: [''],
      subTopicId: [''],
      questionId: [''],
      companyIds: [''],

      // Single month/year for SUMMARY, PERFORMANCE, COMPLIANCE
      month: [''],
      year: [new Date().getFullYear()],

      // Date range for DETAILED, COMPARISON, TREND
      fromDate: [''],
      toDate: [''],

      // Trend specific
      trendPeriod: ['MONTHLY'],

      // Chart configuration
      viewType: ['BOTH'],
      chartType: ['BAR'],

      // Pagination
      page: [0],
      pageSize: [50]
    });

    // Add conditional validators
    this.reportForm.get('reportType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(reportType => {
        this.updateValidators(reportType);
      });
  }

  private updateValidators(reportType: ReportType): void {
    // Clear all validators first
    this.reportForm.get('month')?.clearValidators();
    this.reportForm.get('year')?.clearValidators();
    this.reportForm.get('fromDate')?.clearValidators();
    this.reportForm.get('toDate')?.clearValidators();
    this.reportForm.get('trendPeriod')?.clearValidators();

    // Add validators based on report type
    if (this.isSingleMonthReportType(reportType)) {
      this.reportForm.get('month')?.setValidators([Validators.required]);
      this.reportForm.get('year')?.setValidators([Validators.required]);
    } else if (this.isDateRangeReportType(reportType)) {
      this.reportForm.get('fromDate')?.setValidators([Validators.required]);
      this.reportForm.get('toDate')?.setValidators([Validators.required]);
    }

    if (reportType === 'TREND') {
      this.reportForm.get('trendPeriod')?.setValidators([Validators.required]);
    }

    // Update validity
    this.reportForm.get('month')?.updateValueAndValidity();
    this.reportForm.get('year')?.updateValueAndValidity();
    this.reportForm.get('fromDate')?.updateValueAndValidity();
    this.reportForm.get('toDate')?.updateValueAndValidity();
    this.reportForm.get('trendPeriod')?.updateValueAndValidity();
  }

  private isSingleMonthReportType(reportType: ReportType): boolean {
    return ['SUMMARY', 'PERFORMANCE', 'COMPLIANCE'].includes(reportType);
  }

  private isDateRangeReportType(reportType: ReportType): boolean {
    return ['DETAILED', 'COMPARISON', 'TREND'].includes(reportType);
  }

  // Template helper methods
  isSingleMonthReport(): boolean {
    return this.isSingleMonthReportType(this.reportForm.get('reportType')?.value);
  }

  isDateRangeReport(): boolean {
    return this.isDateRangeReportType(this.reportForm.get('reportType')?.value);
  }

  showDateRange(): boolean {
    return this.isSingleMonthReport() || this.isDateRangeReport();
  }

  showChartConfig(): boolean {
    const reportType = this.reportForm.get('reportType')?.value;
    return ['SUMMARY', 'COMPARISON', 'TREND'].includes(reportType);
  }

  private generateYears(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 10; i--) {
      this.years.push(i);
    }
  }

  private loadInitialData(): void {
    this.isLoading = true;

    // Load battalions using the new API method (if exists) or fallback
    this.loadBattalions();
    this.loadModules();

    this.loadCompanies();
  }

// Add method to load all companies
private loadCompanies(): void {
  this.apiService.getCompanies(1, 15) // Load all companies
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: any) => {
        if (response.status === 'SUCCESS') {
          this.company = response.data || [];
          this.filteredCompanies = [...this.company];
        }
      },
      error: (error: any) => {
        console.error('Error loading companies:', error);
        this.notificationService.error('Failed to load companies');
      }
    });
}

  private loadBattalions(): void {
    this.apiService.getActiveBattalions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 'SUCCESS') {
            this.battalions = response.data || [];
          }

          const storedBattalionName = localStorage.getItem('battalionName');
          console.log("storedBattalian", storedBattalionName);

          if (storedBattalionName) {
            const matchedBattalion = this.battalions.find(
              (b: any) => b.battalionName === storedBattalionName
            );

            if (matchedBattalion) {
              // 🔥 Show ONLY this battalion in dropdown
              this.battalions = [matchedBattalion];

              // 🔥 Auto-select it
              this.reportForm.patchValue({
                battalionIds: [matchedBattalion.id]
              });
            }
          }
        },

        error: (error: any) => {
          console.error('Error loading battalions:', error);
          this.notificationService.error('Failed to load battalions');
        }
      });
  }

  private loadModules(): void {
    this.apiService.getActiveModules()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 'SUCCESS') {
            this.modules = response.data || [];
          }
        },
        error: (error: any) => {
          console.error('Error loading modules:', error);
          this.notificationService.error('Failed to load modules');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  onModuleChange(): void {
    const moduleId = this.reportForm.get('moduleId')?.value;
    if (moduleId) {
      this.apiService.getTopicsByModule(moduleId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 'SUCCESS') {
              this.filteredTopics = response.data || [];
              this.topics = this.filteredTopics;
            }
          },
          error: (error: any) => {
            console.error('Error loading topics:', error);
            this.notificationService.error('Failed to load topics');
          }
        });
    } else {
      this.filteredTopics = [];
      this.filteredSubTopics = [];
      this.filteredQuestions = [];
    }

    // Reset dependent fields
    this.reportForm.patchValue({
      topicId: '',
      subTopicId: '',
      questionId: ''
    });
  }

  onTopicChange(): void {
    const topicId = this.reportForm.get('topicId')?.value;
    if (topicId) {
      // Load subtopics
      this.apiService.getSubTopicsByTopicForForm(topicId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 'SUCCESS') {
              this.filteredSubTopics = response.data || [];
              this.subTopics = this.filteredSubTopics;
            }
          },
          error: (error: any) => {
            console.error('Error loading subtopics:', error);
            this.notificationService.error('Failed to load subtopics');
          }
        });

      // Load questions
      this.apiService.getQuestionsByTopic(topicId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 'SUCCESS') {
              this.filteredQuestions = response.data || [];
              this.questions = this.filteredQuestions;
            }
          },
          error: (error: any) => {
            console.error('Error loading questions:', error);
            this.notificationService.error('Failed to load questions');
          }
        });
        // this.getCompaniesByTopic();
    } else {
      this.filteredSubTopics = [];
      this.filteredQuestions = [];
    }

    // Reset dependent fields
    this.reportForm.patchValue({
      subTopicId: '',
      questionId: '',
      // this.filteredCompanies = [...this.company];
    });
  }


onCompanyChange(): void {
  const topicId = this.reportForm.get('topicId')?.value;
  
  if (topicId) {
    // First, check if the selected topic has subName "Strength in all Coys"
    const selectedTopic = this.filteredTopics.find(topic => topic.id === topicId);
    
    if (selectedTopic && selectedTopic.subName === 'Strength in all Coys') {
      // If topic is "Strength in all Coys", fetch all companies
      this.loadAllCompanies();
    } else {
      // For other topics, filter companies by topic
      console.log("error in load comapny");
      
      this.apiService.getCompanies()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
 next: (response: any) => {
            if (response.status === 'SUCCESS') {
              this.filteredCompanies = response.data || [];
            }
          },
          error: (error: any) => {
            console.error('Error filtering companies by topic:', error);
            // this.filterCompaniesFromLoaded(topicId);
          }
        });
    }
  } else {
    // No topic selected, show empty or all companies
    this.filteredCompanies = [];
  }
}
// Add this method to load all companies
loadAllCompanies(): void {
  this.apiService.getCompanies(1, 15)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: any) => {
        if (response.status === 'SUCCESS') {
          this.filteredCompanies = response.data || [];
        }
      },
      error: (error: any) => {
        console.error('Error loading all companies:', error);
        this.filteredCompanies = [];
      }
    });
}


  // Add method to handle company selection (for multi-select)
onCompanySelect(event: any): void {
  const selectedOptions = Array.from(event.target.selectedOptions).map(
    (o: any) => Number(o.value)
  );
  this.selectedCompanies = selectedOptions;
  this.reportForm.get('companyIds')?.setValue(selectedOptions);
  console.log("Selected companies:", this.selectedCompanies);
}

// Add method to get company name by ID
getCompanyName(id: number): string {
  const foundCompany = this.company.find((c) => c.id === id);
  return foundCompany?.companyName || '';
}



  onSubTopicChange(): void {
    const subTopicId = this.reportForm.get('subTopicId')?.value;
    const topicId = this.reportForm.get('topicId')?.value;

    if (subTopicId && topicId) {
      // Use the existing API method to get questions by subtopic
      this.apiService.getQuestionsBySubTopic(subTopicId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 'SUCCESS') {
              this.filteredQuestions = response.data || [];
              this.questions = this.filteredQuestions;
            }
          },
          error: (error: any) => {
            console.error('Error loading filtered questions:', error);
            this.notificationService.error('Failed to load filtered questions');
          }
        });
    }

    // Reset question field
    this.reportForm.patchValue({
      subTopicId: '',
    questionId: '',
    companyIds: []

    });
     this.selectedCompanies = [];
  }


  private buildReportData(): any {
    const formValues = this.reportForm.value;
    const reportType: ReportType = formValues.reportType;

    // 🔹 Collect filters here
    const filters: any = {
      battalionIds: formValues.battalionIds || [],
      moduleId: formValues.moduleId,
      page: formValues.page || 0,
      size: formValues.pageSize || 50
    };

    // Optional filters
    if (formValues.topicId) filters.topicIds = [formValues.topicId];
    if (formValues.subTopicId) filters.subTopicIds = [formValues.subTopicId];
    if (formValues.questionId) filters.questionIds = [formValues.questionId];
     if (formValues.companyIds && formValues.companyIds.length > 0) {
    filters.companyIds = formValues.companyIds; // Add companyIds to filters
  }
    // Date filters
    if (this.isSingleMonthReportType(reportType)) {
      if (formValues.month && formValues.year) {
        filters.monthYear = this.formatMonthYearForAPI(formValues.month, formValues.year);
      }
    } else if (this.isDateRangeReportType(reportType)) {
      if (formValues.fromDate) filters.fromDate = new Date(formValues.fromDate).toISOString();
      if (formValues.toDate) filters.toDate = new Date(formValues.toDate).toISOString();
    }

    // Report-specific filters
    if (reportType === 'SUMMARY') {
      filters.viewType = formValues.viewType || 'BOTH';
    } else if (reportType === 'TREND') {
      filters.trendPeriod = formValues.trendPeriod || 'MONTHLY';
    }

    // ✅ Return the expected backend shape
    return {
      reportType,
      filters
    };
  }

  onGenerateReport(): void {
    if (this.reportForm.valid) {
      this.isGenerating = true;
      const reportData = this.buildReportData();
      const reportType: ReportType = reportData.reportType;

      console.log("reportData", reportData);

      const reportRequest = this.apiService.generateReport(reportData);

      reportRequest
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.status === 'SUCCESS') {
              const apiData = response.data;

              // 🔧 Transform API response into structure expected by template
              this.reportData = {
                summary: {
                  overview: {
                    totalRecords: apiData.metadata?.recordCount || apiData.data?.length || 0,
                    totalBattalions: new Set(apiData.data.map((d: any) => d.battalionName)).size,
                    totalModules: new Set(apiData.data.map((d: any) => d.moduleName)).size,
                    totalQuestions: apiData.data?.length || 0
                  },
                  completionStatistics: {
                    submissionRate: '100.00',
                    approvalRate: '100.00',
                    totalSubmitted: apiData.data?.length || 0,
                    totalDraft: 0
                  },
                  alerts: [], // Optional: populate if backend provides alerts
                  recommendations: [] // Optional: populate if backend provides recommendations
                },
                chartData: {
                  title: 'Report Chart',
                  labels: apiData.data.map((d: any) => d.question),
                  values: apiData.data.map((d: any) => parseFloat(d.value))
                },
                data: apiData.data.map((d: any) => ({
                  ...d,
                  downloadUrl: d.value?.includes('.pdf')
                    ? this.baseDownloadUrl + d.value
                    : null
                })),
                // pagination: null

                reportId: apiData?.metadata?.reportId || apiData?.reportId || 'UNKNOWN_REPORT_ID'

              };

              // Optional: Store reportId for export/download
              this.lastReportId = apiData?.metadata?.reportId || apiData?.reportId;

              // Debug logs
              console.log('✅ Report generated successfully');
              console.log('Report ID:', this.lastReportId);
              console.log('Report Data:', this.reportData);

              this.notificationService.success('Report generated successfully');

              // Optional: render chart if you use Chart.js
              //  this.renderChart();

              // Smooth scroll to results section
              setTimeout(() => {
                const resultsSection = document.querySelector('.card:last-child');
                resultsSection?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            } else {
              this.notificationService.error(response.message || 'Failed to generate report');
            }
          },
          error: (error: any) => {
            console.error('❌ Error generating report:', error);
            this.notificationService.error('Failed to generate report');
          },
          complete: () => {
            this.isGenerating = false;
          }
        });
    } else {
      this.notificationService.error('Please fill in all required fields');
      this.markFormGroupTouched();
    }
  }

  // renderChart(): void {
  //   const ctx = document.getElementById('reportChart') as HTMLCanvasElement;
  //   if (!ctx || !this.reportData?.chartData) return;

  //   const { labels, values } = this.reportData.chartData;

  //   new Chart(ctx, {
  //     type: 'bar',
  //     data: {
  //       labels,
  //       datasets: [{
  //         label: 'Values',
  //         data: values,
  //         backgroundColor: 'rgba(54, 162, 235, 0.6)',
  //         borderColor: 'rgba(54, 162, 235, 1)',
  //         borderWidth: 1
  //       }]
  //     },
  //     options: {
  //       responsive: true,
  //       plugins: { legend: { display: false } },
  //       scales: {
  //         y: { beginAtZero: true }
  //       }
  //     }
  //   });
  // }



  onExportReport(format: 'EXCEL' | 'PDF' | 'CSV' | 'JSON'): void {
    if (!this.lastReportId) {
      this.notificationService.error('Please generate a report first');
      return;
    }

    this.isGenerating = true;

    this.apiService.exportReport(this.lastReportId, format)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          // Extract file name from headers (if present)
          const contentDisposition = response.headers.get('Content-Disposition');
          // let fileName = `report_${this.lastReportId}.${format.toLowerCase()}`;
          let fileName = `report_${this.lastReportId}.${this.getFileExtension(format)}`;

          if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match) fileName = match[1];
          }

          // Create Blob for download
          const blob = new Blob([response.body!], {
            type: this.getMimeType(format)
          });

          // Create temporary download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();

          // Cleanup
          window.URL.revokeObjectURL(url);
          this.notificationService.success(`${format} file downloaded successfully`);
        },
        error: (error) => {
          console.error('Export error:', error);
          this.notificationService.error(`Failed to export ${format} report`);
        },
        complete: () => (this.isGenerating = false)
      });
  }

  getFileExtension(format: string): string {
    switch (format) {
      case 'EXCEL': return 'xlsx';
      case 'CSV': return 'csv';
      case 'PDF': return 'pdf';
      case 'JSON': return 'json';
      default: return 'dat';
    }
  }


  // Optional helper for MIME types
  getMimeType(format: string): string {
    switch (format) {
      case 'EXCEL':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'CSV':
        return 'text/csv';
      case 'PDF':
        return 'application/pdf';
      case 'JSON':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }




  onGetMetadata(): void {
    this.isLoading = true;

    this.apiService.getReportMetadata()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 'SUCCESS') {
            this.metadata = response.data;
            this.notificationService.success('Metadata retrieved successfully');

            // Show metadata modal
            const modal = new (window as any).bootstrap.Modal(document.getElementById('metadataModal'));
            modal.show();
          } else {
            this.notificationService.error(response.message || 'Failed to get metadata');
          }
        },
        error: (error: any) => {
          console.error('Error getting metadata:', error);
          this.notificationService.error('Failed to get metadata');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  onGetTemplates(): void {
    this.isLoading = true;

    this.apiService.getReportTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status === 'SUCCESS') {
            this.templates = response.data || [];
            this.notificationService.success('Templates retrieved successfully');

            // Show templates modal
            const modal = new (window as any).bootstrap.Modal(document.getElementById('templatesModal'));
            modal.show();
          } else {
            this.notificationService.error(response.message || 'Failed to get templates');
          }
        },
        error: (error: any) => {
          console.error('Error getting templates:', error);
          this.notificationService.error('Failed to get templates');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  onResetForm(): void {
    this.reportForm.reset();
    this.reportForm.patchValue({
      reportType: 'SUMMARY',
      year: new Date().getFullYear(),
      viewType: 'BOTH',
      chartType: 'BAR',
      page: 0,
      pageSize: 50,
      trendPeriod: 'MONTHLY'
    });

    // Clear filtered arrays
    this.filteredTopics = [];
    this.filteredSubTopics = [];
    this.filteredQuestions = [];

    // Clear report data
    this.reportData = null;
    this.lastReportId = null;
  }

  onPageChange(page: number): void {
    if (page !== null && page !== undefined && page >= 0) {
      // Update the form page value
      this.reportForm.patchValue({ page: page });

      // Regenerate the report with new page
      this.onGenerateReport();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.reportForm.controls).forEach(key => {
      const control = this.reportForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.reportForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Utility methods for date validation
  getMinDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 5);
    return date.toISOString().split('T')[0];
  }

  getMaxDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Form field getters for template
  get reportTypeValue(): ReportType {
    return this.reportForm.get('reportType')?.value || 'SUMMARY';
  }

  get battalionIdsValue(): number[] {
    return this.reportForm.get('battalionIds')?.value || [];
  }

  get moduleIdValue(): number {
    return this.reportForm.get('moduleId')?.value;
  }

  // Validation helpers
  validateDateRange(): boolean {
    const fromDate = this.reportForm.get('fromDate')?.value;
    const toDate = this.reportForm.get('toDate')?.value;

    if (fromDate && toDate) {
      return new Date(fromDate) <= new Date(toDate);
    }
    return true;
  }

  // Error message helpers
  getFieldErrorMessage(fieldName: string): string {
    const field = this.reportForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'reportType': 'Report Type',
      'battalionIds': 'Battalion(s)',
      'moduleId': 'Module',
      'month': 'Month',
      'year': 'Year',
      'fromDate': 'From Date',
      'toDate': 'To Date',
      'trendPeriod': 'Trend Period'
    };
    return displayNames[fieldName] || fieldName;

  }

  // Helper methods for pagination to avoid template errors
  hasPagination(): boolean {
    return !!(this.reportData?.pagination && this.reportData.pagination.totalPages > 1);
  }

  getCurrentPage(): number {
    return (this.reportData?.pagination?.currentPage || 0) + 1;
  }

  getTotalPages(): number {
    return this.reportData?.pagination?.totalPages || 1;
  }

  getNumberOfElements(): number {
    return this.reportData?.pagination?.numberOfElements || 0;
  }

  getTotalElements(): number {
    return this.reportData?.pagination?.totalElements || this.reportData?.data?.length || 0;
  }

  isPreviousDisabled(): boolean {
    return !this.reportData?.pagination?.hasPrevious;
  }

  isNextDisabled(): boolean {
    return !this.reportData?.pagination?.hasNext;
  }

  onPreviousPage(): void {
    const prevPage = this.reportData?.pagination?.previousPage;
    if (prevPage !== null && prevPage !== undefined) {
      this.onPageChange(prevPage);
    }
  }

  onNextPage(): void {
    const nextPage = this.reportData?.pagination?.nextPage;
    if (nextPage !== null && nextPage !== undefined) {
      this.onPageChange(nextPage);
    }
  }

  // Helper method to check if a report has been generated and is available for export
  hasGeneratedReport(): boolean {
    return !!(this.lastReportId && this.reportData);
  }

  // Helper method to format month-year display
  formatMonthYear(monthYear: string): string {
    if (!monthYear) return '';

    // Handle "SEP 2025" format (space separated) - keep as is
    if (monthYear.includes(' ')) {
      return monthYear;
    }

    // Handle dash-separated format
    if (monthYear.includes('-')) {
      const parts = monthYear.split('-');
      if (parts.length === 2) {
        const month = parts[0].trim();
        const year = parts[1].trim();

        // If month is already in text format (like "SEP"), return with space
        if (isNaN(Number(month))) {
          return `${month} ${year}`;
        }

        // Convert numeric month to abbreviated month name
        const monthNames = [
          'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
          'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
        ];

        const monthIndex = parseInt(month, 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          return `${monthNames[monthIndex]} ${year}`;
        }
      }
    }

    // Return original if no known format
    return monthYear;
  }

  // Helper method to format month-year for API request
  private formatMonthYearForAPI(month: string, year: string): string {
    if (!month || !year) return '';

    // Convert numeric month to abbreviated month name for API
    const monthNames = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];

    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${monthNames[monthIndex]} ${year}`;  // Space instead of dash
    }

    // Fallback to original format
    return `${month}-${year}`;
  }
}