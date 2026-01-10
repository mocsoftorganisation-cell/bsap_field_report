import { Component, NgModule, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import {
  PerformanceStatisticService,
  ModuleDTO,
  TopicDTO,
  QuestionDTO,
  PerformanceFormResponse,
  PerformanceStatistic,
  ApiResponse,
  SubTopicDTO,
  
} from "../../services/performance-statistic.service";
import { ApiService, Companys , Topic} from "../../services/api.service";
import { NavigationHelperService } from '../../services/navigation-helper.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: "app-performance",
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: "./performance.component.html",
  styleUrl: "./performance.component.css",
})
export class PerformanceComponent implements OnInit {
  fileUploads: { [key: string]: { file: File; fileName: string; fileType: string } } = {};
  
  // Add these properties to your component
  private strengthTopicId: number = 4; // ID from your API
  private companyTopicId: number = 117; // ID from your API
  companyValuesCache: Map<number, Map<number, Map<number, number>>> = new Map(); // companyId -> questionId -> subTopicId -> value
  
  previousMonthMin!: string;
  previousMonthMax!: string;
  performanceForm!: FormGroup;
  modules: ModuleDTO[] = [];
  currentModule: ModuleDTO | null = null;
  currentTopic: TopicDTO | null = null;
  userDistrict: string = "";
  monthYear: string = "";

  // Navigation properties
  moduleId: number = 0;
  topicId: number = 1;
  nextModule: boolean = false;
  prevModule: boolean = false;
  nextTopic: boolean = false;
  prevTopic: boolean = false;

  // UI state properties
  loading: boolean = false;
  saving: boolean = false;
  showOTPModal: boolean = false;
  isSuccess: boolean = false;
  errorMessage: string = "";
  successMessage: string = "";

  // Form data
  formData: { [key: string]: any } = {};
  otpValue: string = "";
  autoSaveInterval: any;

  dateFieldsCount: number = 0;
  selectedDates: string[] = [];

  // Companies
  company: Companys[] = [];
  selectedCompanies: number[] = [];
  
  // SubTopic filter
  selectedSubTopics: any[] = [];

  // Navigation info
  nextNavInfo: { moduleId: number, topicId: number } | null = null;
  prevNavInfo: { moduleId: number, topicId: number } | null = null;
  navigationInfo: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private performanceService: PerformanceStatisticService,
    private apiService: ApiService,
    private navigationHelper: NavigationHelperService,
    private authService: AuthService
  ) {
    this.initializeForm();
  }


  /**
 * Check if there are file uploads
 */
hasFileUploads(): boolean {
  return this.fileUploads && Object.keys(this.fileUploads).length > 0;
}

/**
 * Get file upload count
 */
getFileUploadCount(): number {
  return this.fileUploads ? Object.keys(this.fileUploads).length : 0;
}

//   ngOnInit(): void {
//   this.route.queryParams.subscribe((params) => {
//     // Clear all data first
//     this.selectedCompanies = [];
//     this.clearComponentData();

//     this.moduleId = params["module"] ? parseInt(params["module"]) : 0;
//     this.topicId = params["topic"] ? parseInt(params["topic"]) : 1;
    
//     console.log('Loading module:', this.moduleId, 'topic:', this.topicId);
//     this.loadPerformanceData();
//     this.loadCompanies();
//   });
// }

/**
 * Clear all component data before loading new data
 */


  ngOnDestroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  setMonthRange(year: number, month: number) {
    const monthIndex = month - 1;
    const minDate = new Date(year, monthIndex, 1);
    const maxDate = new Date(year, monthIndex + 1, 0);

    this.previousMonthMin = minDate.toISOString().split("T")[0];
    this.previousMonthMax = maxDate.toISOString().split("T")[0];
  }

  /**
   * Initialize the reactive form
   */
  private initializeForm(): void {
    this.performanceForm = this.formBuilder.group({
      // Dynamic form controls will be added based on questions
    });
  }

  /**
   * Clear all component data before loading new data
   */
  /**
 * Clear all component data before loading new data
 */
// private clearComponentData(): void {
//   // Clear auto-save interval
//   if (this.autoSaveInterval) {
//     clearInterval(this.autoSaveInterval);
//     this.autoSaveInterval = null;
//   }

//   // Clear form data
//   this.performanceForm = this.formBuilder.group({});
//   this.formData = {};

//   // Clear navigation data
//   this.modules = [];
//   this.currentModule = null;
//   this.currentTopic = null;
//   this.currentModuleTopics = []; // NEW: Add this line
//   this.userDistrict = "";
//   this.monthYear = "";

//   // Clear navigation flags
//   this.nextModule = false;
//   this.prevModule = false;
//   this.nextTopic = false;
//   this.prevTopic = false;

//   // Clear UI state
//   this.loading = false;
//   this.saving = false;
//   this.showOTPModal = false;
//   this.isSuccess = false;
//   this.errorMessage = "";
//   this.successMessage = "";
//   this.otpValue = "";
  
//   // NEW: Clear file uploads if you have that property
//   if (this.fileUploads) {
//     this.fileUploads = {};
//   }
// }

  /**
   * Load performance data from service
   */
  loadPerformanceData(): void {
    console.log('Starting to load performance data...');
    this.loading = true;
    this.errorMessage = "";

    this.performanceService
      .getPerformanceForm(this.moduleId, this.topicId)
      .subscribe({
        next: (response: ApiResponse<PerformanceFormResponse>) => {
          if (response.status === "SUCCESS" && response.data) {
            console.log('Performance Form Data:', response.data);
            this.processFormData(response.data);
          } else {
            this.errorMessage =
              response.message || "Failed to load performance data";
          }
          this.loading = false;
        },
        error: (error: any) => {
          this.errorMessage =
            "Error loading performance data: " + error.message;
          this.loading = false;
        },
      });
  }

  /**
   * Process the form data response
   */
private processFormData(data: PerformanceFormResponse): void {
  this.modules = data.modules || [];
  this.userDistrict = data.userDistrict || "";
  this.monthYear = data.monthYear || "";
  this.isSuccess = data.isSuccess || false;
  this.nextModule = data.nextModule || false;
  this.prevModule = data.prevModule || false;
  this.nextTopic = data.nextTopic || false;
  this.prevTopic = data.prevTopic || false;

  if (this.modules.length > 0) {
    this.currentModule = this.modules[0];

    if (this.currentModule.topicDTOs && this.currentModule.topicDTOs.length > 0) {
      // Find the topic that matches the route parameter
      const targetTopic = this.currentModule.topicDTOs.find(t => t.id === this.topicId);
      
      if (targetTopic) {
        this.currentTopic = targetTopic;
      } else {
        // Fallback to first topic if exact match not found
        this.currentTopic = this.currentModule.topicDTOs[0];
      }
      
      this.updateNavigationInfo();
      
      // Try to fetch all topics first, fallback to incremental if fails
      this.fetchAllTopicsForModule();
      
      this.buildFormControls();
      this.setupAutoSave();
      
      // Debug info
      this.debugTopicInfo();
    }
  }
}

  /**
   * Try to skip to the next module/topic when the current one has no content.
   */
  private trySkipToNextAvailable(maxModuleSearch: number = 20, maxTopicsPerModule: number = 30): void {
    if ((this as any)._skipInProgress) return;
    (this as any)._skipInProgress = true;

    const startModule = this.moduleId + 1;
    let moduleProbe = startModule;
    let moduleAttempts = 0;

    const probeModule = () => {
      if (moduleAttempts >= maxModuleSearch) {
        console.warn('trySkipToNextAvailable: reached module search limit');
        (this as any)._skipInProgress = false;
        return;
      }
      moduleAttempts++;

      let topicProbe = 1;
      let topicAttempts = 0;

      const probeTopic = () => {
        if (topicAttempts >= maxTopicsPerModule) {
          moduleProbe++;
          setTimeout(probeModule, 100);
          return;
        }
        topicAttempts++;

        console.log(`Probing module=${moduleProbe}, topic=${topicProbe}`);

        this.performanceService.getPerformanceForm(moduleProbe, topicProbe).subscribe({
          next: (resp: any) => {
            const hasData = resp && resp.status === 'SUCCESS' && resp.data && resp.data.modules && resp.data.modules.length > 0;
            const hasTopics = hasData && resp.data.modules[0].topicDTOs && resp.data.modules[0].topicDTOs.length > 0;

            if (hasData && hasTopics) {
              console.log(`Found available data at module=${moduleProbe}, topic=${topicProbe} — navigating`);
              this.errorMessage = '';
              this.router.navigate(['dashboard/performance'], { queryParams: { module: moduleProbe, topic: topicProbe } })
                .then(() => { (this as any)._skipInProgress = false; })
                .catch((err) => { console.error('Navigation error after found data', err); (this as any)._skipInProgress = false; });
            } else {
              topicProbe++;
              setTimeout(probeTopic, 120);
            }
          },
          error: (err: any) => {
            console.error('Probe request failed for', moduleProbe, topicProbe, err);
            topicProbe++;
            setTimeout(probeTopic, 200);
          }
        });
      };

      probeTopic();
    };

    probeModule();
  }

  /**
   * Calculate strength totals automatically
   */
  calculateStrengthTotals(): void {
    if (this.currentTopic?.id !== this.strengthTopicId) {
      return;
    }

    const questions = this.currentTopic.questions || [];
    const subTopics = this.currentTopic.subTopics || [];

    console.log('=== Calculating Strength Totals ===');
    console.log('Strength Questions:', questions.map(q => ({id: q.id, name: q.question})));
    console.log('Strength SubTopics:', subTopics.map(st => ({id: st.id, name: st.subTopicName})));

    // Clear all values first
    questions.forEach(question => {
      subTopics.forEach(subTopic => {
        const controlName = `matrix_${question.id}_${subTopic.id}`;
        const control = this.performanceForm.get(controlName);
        if (control) {
          control.setValue("0", { emitEvent: false });
        }
      });
    });

    // Calculate totals for each question and subtopic
    questions.forEach(question => {
      const companyQuestionId = this.getMatchingCompanyQuestionId(question.id);
      
      subTopics.forEach(subTopic => {
        const companySubTopicId = this.getMatchingCompanySubTopicId(subTopic.id);
        
        if (companyQuestionId && companySubTopicId) {
          let total = 0;
          let calculationDetails: string[] = [];
          
          this.selectedCompanies.forEach(companyId => {
            const value = this.getCompanyValue(companyId, companyQuestionId, companySubTopicId);
            calculationDetails.push(`Company ${companyId}: ${value}`);
            total += value;
          });
          
          const controlName = `matrix_${question.id}_${subTopic.id}`;
          const control = this.performanceForm.get(controlName);
          if (control) {
            control.setValue(total.toString(), { emitEvent: false });
          }
        }
      });
    });
  }

  /**
   * Helper to get matching question IDs between topics
   */
  private getMatchingCompanyQuestionId(strengthQuestionId: number): number | null {
    const questionMap: { [key: number]: number } = {
      664: 1078, // Sanctioned Posts -> Sanctioned
      665: 1079, // Actual numbers posted -> Available
      666: 1081, // Working elsewhere -> On Deputation
      667: 1082  // Actual number working -> Actually working in company
    };
    
    return questionMap[strengthQuestionId] || null;
  }

  /**
   * Helper to get matching subtopic IDs
   */
  private getMatchingCompanySubTopicId(strengthSubTopicId: number): number | null {
    const subTopicMap: { [key: number]: number } = {
      114: 285, // Inspector
      115: 286, // SI
      217: 287, // ASI
      116: 288, // Havildar
      117: 289, // Constable
      118: 290  // Support Staff
    };
    
    return subTopicMap[strengthSubTopicId] || null;
  }

  /**
   * Get value from a specific company
   */
  private getCompanyValue(companyId: number, questionId: number, subTopicId: number): number {
    // Try to get from current form
    const controlName = `matrix_${companyId}_${questionId}_${subTopicId}`;
    const control = this.performanceForm.get(controlName);
    
    if (control && control.value !== null && control.value !== undefined && control.value !== '') {
      const value = parseFloat(control.value);
      return isNaN(value) ? 0 : value;
    }
    
    const cachedValue = this.getCachedCompanyValue(companyId, questionId, subTopicId);
    return cachedValue;
  }

  /**
   * Get cached company value
   */
  private getCachedCompanyValue(companyId: number, questionId: number, subTopicId: number): number {
    const companyCache = this.companyValuesCache.get(companyId);
    if (companyCache) {
      const questionCache = companyCache.get(questionId);
      if (questionCache) {
        return questionCache.get(subTopicId) || 0;
      }
    }
    return 0;
  }

  /**
   * Cache company values
   */
  private cacheCompanyValues(): void {
    if (!this.shouldShowCompanyFilter()) return;
    
    this.companyValuesCache = new Map();
    
    this.selectedCompanies.forEach(companyId => {
      const questions = this.currentTopic?.questions || [];
      const subTopics = this.currentTopic?.subTopics || [];
      
      questions.forEach(question => {
        subTopics.forEach(subTopic => {
          const controlName = `matrix_${companyId}_${question.id}_${subTopic.id}`;
          const control = this.performanceForm.get(controlName);
          
          if (control && control.value) {
            const value = parseFloat(control.value) || 0;
            
            if (!this.companyValuesCache.has(companyId)) {
              this.companyValuesCache.set(companyId, new Map());
            }
            
            const companyCache = this.companyValuesCache.get(companyId)!;
            if (!companyCache.has(question.id)) {
              companyCache.set(question.id, new Map());
            }
            const questionCache = companyCache.get(question.id)!;
            questionCache.set(subTopic.id, value);
          }
        });
      });
    });
    
    console.log('Company values cached:', this.companyValuesCache);
  }

  /**
   * Cache individual company value
   */
  cacheCompanyValue(companyId: number, questionId: number, subTopicId: number, value: any): void {
    let companyCache = this.companyValuesCache.get(companyId);
    
    if (!companyCache) {
      companyCache = new Map();
      this.companyValuesCache.set(companyId, companyCache);
    }
    
    let questionCache = companyCache.get(questionId);
    if (!questionCache) {
      questionCache = new Map();
      companyCache.set(questionId, questionCache);
    }
    
    const numericValue = parseFloat(value) || 0;
    questionCache.set(subTopicId, numericValue);
  }

  /**
   * Setup value change listener
   */
  private setupValueChangeListener(): void {
    this.performanceForm.valueChanges.subscribe((formValues) => {
      if (this.currentTopic?.id === this.companyTopicId) {
        this.selectedCompanies.forEach(companyId => {
          const questions = this.currentTopic?.questions || [];
          const subTopics = this.currentTopic?.subTopics || [];
          
          questions.forEach(question => {
            subTopics.forEach(subTopic => {
              const controlName = `matrix_${companyId}_${question.id}_${subTopic.id}`;
              const value = formValues[controlName];
              
              if (value !== undefined && value !== null) {
                this.cacheCompanyValue(companyId, question.id, subTopic.id, value);
              }
            });
          });
        });
        
        this.calculateStrengthTotals();
      }
    });
  }

  /**
   * Get strength topic ID
   */
  getStrengthTopicId(): number | null {
    for (const module of this.modules) {
      if (module.topicDTOs) {
        for (const topic of module.topicDTOs) {
          if (topic.topicSubName === "Strength in all Coys") {
            return topic.id;
          }
        }
      }
    }
    return null;
  }

  /**
   * Check if we're on the strength topic
   */
  isStrengthTopic(): boolean {
    return this.currentTopic?.topicSubName === "Strength in all Coys";
  }

  /**
   * Navigate to strength topic
   */
  navigateToStrengthTopic(): void {
    this.cacheCompanyValues();
    
    const strengthTopicId = 4;
    
    this.router.navigate(['dashboard/performance'], {
      queryParams: { module: this.moduleId, topic: strengthTopicId }
    }).then(() => {
      setTimeout(() => {
        if (this.isStrengthTopic()) {
          this.calculateStrengthTotals();
        }
      }, 1000);
    });
  }

  /**
   * Get preview total
   */
  getPreviewTotal(questionId: number, subTopicId: number): string {
    let total = 0;
    
    this.selectedCompanies.forEach(companyId => {
      const controlName = `matrix_${companyId}_${questionId}_${subTopicId}`;
      const control = this.performanceForm.get(controlName);
      
      if (control && control.value) {
        const value = parseFloat(control.value);
        if (!isNaN(value)) {
          total += value;
        }
      }
    });
    
    return total.toString();
  }

  /**
   * Cache current company values
   */
  private cacheCurrentCompanyValues(): void {
    if (this.currentTopic?.id !== this.companyTopicId) return;
    
    this.selectedCompanies.forEach(companyId => {
      const questions = this.currentTopic?.questions || [];
      const subTopics = this.currentTopic?.subTopics || [];
      
      questions.forEach(question => {
        subTopics.forEach(subTopic => {
          const controlName = `matrix_${companyId}_${question.id}_${subTopic.id}`;
          const control = this.performanceForm.get(controlName);
          
          if (control && control.value !== null && control.value !== undefined) {
            this.cacheCompanyValue(companyId, question.id, subTopic.id, control.value);
          }
        });
      });
    });
  }

  /**
   * Get preview questions
   */
  getPreviewQuestions(): any[] {
    if (!this.currentTopic || !this.shouldShowCompanyFilter()) return [];
    
    return (this.currentTopic.questions || []).map(q => ({
      id: q.id,
      text: this.getPreviewQuestionText(q.id),
      originalText: q.question
    }));
  }

  /**
   * Map company questions to strength summary display text
   */
  private getPreviewQuestionText(questionId: number): string {
    const questionTextMap: { [key: number]: string } = {
      1078: 'Sanctioned Posts',
      1079: 'Actual numbers posted in all Coys',
      1080: 'Vacant Posts',
      1081: 'How many of these working elsewhere from these Coys?',
      1082: 'Actual number working in Coys'
    };
    return questionTextMap[questionId] || 'Unknown Question';
  }

  /**
   * Get preview value
   */
  getPreviewValue(questionId: number, subTopicId: number): string {
    let total = 0;
    
    this.selectedCompanies.forEach(companyId => {
      const controlName = `matrix_${companyId}_${questionId}_${subTopicId}`;
      const control = this.performanceForm.get(controlName);
      if (control && control.value) {
        const value = parseFloat(control.value);
        if (!isNaN(value)) {
          total += value;
        }
      }
    });
    
    return total.toString();
  }

  /**
   * Get question total
   */
  getQuestionTotal(questionId: number): string {
    if (!this.currentTopic?.subTopics) return "0";
    
    let total = 0;
    this.currentTopic.subTopics.forEach(subTopic => {
      const value = parseFloat(this.getPreviewValue(questionId, subTopic.id));
      if (!isNaN(value)) {
        total += value;
      }
    });
    
    return total.toString();
  }

  /**
   * Get subtopic total
   */
  getSubTopicTotal(subTopicId: number): string {
    if (!this.currentTopic?.questions) return "0";
    
    let total = 0;
    this.currentTopic.questions.forEach(question => {
      const value = parseFloat(this.getPreviewValue(question.id, subTopicId));
      if (!isNaN(value)) {
        total += value;
      }
    });
    
    return total.toString();
  }

  /**
   * Get grand total
   */
  getGrandTotal(): string {
    if (!this.currentTopic?.questions || !this.currentTopic?.subTopics) return "0";
    
    let total = 0;
    this.currentTopic.questions.forEach(question => {
      this.currentTopic!.subTopics!.forEach(subTopic => {
        const value = parseFloat(this.getPreviewValue(question.id, subTopic.id));
        if (!isNaN(value)) {
          total += value;
        }
      });
    });
    
    return total.toString();
  }

  /**
   * Load companies from API
   */
  loadCompanies(): void {
    this.apiService.getCompanies().subscribe({
      next: (response) => {
        if (response.status === "SUCCESS" && response.data) {
          this.company = response.data;
        }
      },
      error: (error) => {
        console.error("Error loading modules:", error);
      },
    });
  }

  /**
   * Build form controls
   */
  private buildFormControls(): void {
    if (!this.currentTopic) {
      console.log("No current topic found");
      return;
    }

    console.log("Building form controls for topic:", this.currentTopic.topicName);

    const formControls: { [key: string]: any } = {};

    // ===== NORMAL FORM =====
    if (this.currentTopic.formType === "NORMAL") {
      const questions = this.currentTopic.questionDTOs || [];

      questions.forEach((question) => {
        if (this.isDocumentType(question)) {
          formControls[`pdf_${question.id}`] = [null];
          formControls[`word_${question.id}`] = [null];
        } else if (question.type === "DATE") {
          const policeSabhaCount = this.getInitialPoliceSabhaCount();
          if (policeSabhaCount > 0) {
            for (let i = 0; i < policeSabhaCount; i++) {
              formControls[`date_${question.id}_${i}`] = ["", Validators.required];
            }
          }
        } else {
          const controlName = `question_${question.id}`;
          const isCalculated = question.formula && question.formula.trim() !== "";

          if (isCalculated) {
            const calculatedValue = this.calculateInitialFormulaValue(question);
            formControls[controlName] = [
              { value: calculatedValue, disabled: true },
              question.type === "REQUIRED" ? [Validators.required] : [],
            ];
          } else {
            const initialValue = question.currentCount || question.defaultVal || "";
            formControls[controlName] = [
              initialValue,
              question.type === "REQUIRED" ? [Validators.required] : [],
            ];
          }
        }
      });
    }

    // ===== MATRIX FORMS (Q/ST, ST/Q) =====
    if (["Q/ST", "ST/Q"].includes(this.currentTopic.formType)) {
      const questions = this.currentTopic.questions || this.currentTopic.questionDTOs || [];
      const subTopics = this.currentTopic.subTopics || [];

      if (this.selectedCompanies.length > 0) {
        this.selectedCompanies.forEach((company) => {
          questions.forEach((question) => {
            subTopics.forEach((subTopic, stIndex) => {
              if (this.isDocumentType(question)) {
                formControls[`pdf_${question.id}_${subTopic.id}`] = [null];
                formControls[`word_${question.id}_${subTopic.id}`] = [null];
                return;
              }
              const controlName = `matrix_${company}_${question.id}_${subTopic.id}`;
              let currentValue = "0";

              const q = question as any;
              if (q.currentCountList?.[stIndex])
                currentValue = q.currentCountList[stIndex];
              else if (q.valueList?.[stIndex])
                currentValue = q.valueList[stIndex];
              else if (q.currentCount && q.currentCount !== "NONE")
                currentValue = q.currentCount;

              formControls[controlName] = [currentValue, [Validators.required]];
            });
          });
        });
      } else {
        questions.forEach((question) => {
          subTopics.forEach((subTopic, stIndex) => {
            if (this.isDocumentType(question)) {
              formControls[`pdf_${question.id}_${subTopic.id}`] = [null];
              formControls[`word_${question.id}_${subTopic.id}`] = [null];
              return;
            }
            const controlName = `matrix_${question.id}_${subTopic.id}`;
            let currentValue = "0";

            const q = question as any;
            if (q.currentCountList?.[stIndex])
              currentValue = q.currentCountList[stIndex];
            else if (q.valueList?.[stIndex])
              currentValue = q.valueList[stIndex];
            else if (q.currentCount && q.currentCount !== "NONE")
              currentValue = q.currentCount;

            formControls[controlName] = [currentValue, [Validators.required]];
          });
        });
      }
    }

    // ===== STRENGTH TOPIC =====
    if (this.currentTopic?.id === this.strengthTopicId) {
      const questions = this.currentTopic.questions || [];
      const subTopics = this.currentTopic.subTopics || [];
      
      questions.forEach(question => {
        const companyQuestionId = this.getMatchingCompanyQuestionId(question.id);
        
        subTopics.forEach(subTopic => {
          const companySubTopicId = this.getMatchingCompanySubTopicId(subTopic.id);
          const controlName = `matrix_${question.id}_${subTopic.id}`;
          
          if (companyQuestionId && companySubTopicId) {
            let total = 0;
            
            this.selectedCompanies.forEach(companyId => {
              const value = this.getCompanyValue(companyId, companyQuestionId, companySubTopicId);
              total += value;
            });
            
            formControls[controlName] = [total.toString(), [Validators.required]];
          } else {
            formControls[controlName] = ["0", [Validators.required]];
          }
        });
      });
    }

    // ✅ Initialize Form Once
    this.performanceForm = this.formBuilder.group(formControls);
    console.log("✅ Created form controls:", Object.keys(formControls));
    this.setupFormulaCalculations();
  }

  /**
   * Check if has cumulative question
   */
  hasCumulativeQuestion(): boolean {
    return !!this.currentTopic?.questionDTOs?.some((q) => q.isCumulative === true);
  }

  /**
   * Check if has previous question
   */
  hasPreviousQuestion(): boolean {
    return !!this.currentTopic?.questionDTOs?.some((q) => q.isPrevious === true);
  }

  /**
   * Get subtopic header
   */
  getSubTopicHeader(): string {
    const topic = this.currentTopic;
    if (!topic) return "SUB TOPICS";

    if (topic.topicSubName == "Leave") return "Type of Leave";
    if (topic.topicSubName == "GP Stock") return "Items";
    if (topic.topicSubName == "Arms & Ammunition") return "Items";
    if (topic.topicSubName == "Outdoor Activities") return "Outdoor Activity";
    if (topic.topicSubName == "Budget Management") return "Budget Items";
    if (topic.topicSubName == "Surprise inspection of posts/guards/pickets")
      return "Inspected";
    if (topic.topicSubName == "Scheduled Annual Inspection")
      return "Inspected";
    if (topic.topicSubName == "No. of sessions") return "Training Session";
    if (topic.topicSubName == "Tradesmen, Ministerial, Supporting Staff")
      return "Rank";
    if (topic.topicSubName == "Earnings from monetized assets")
      return "Amenities";
    if (topic.topicSubName == "Company's Deployment") return "Company";

    return "DETAILS";
  }

  /**
   * Check if we should show subtopic filter
   */
  shouldShowSubTopicFilter(): boolean {
    return this.currentTopic?.topicSubName === "Earnings from monetized assets" ||
           this.currentTopic?.topicSubName === "Company's Deployment";
  }

  /**
   * Handle subtopic selection
   */
  onSubTopicSelect(event: any): void {
    const selectedOptions = event.target.selectedOptions;
    this.selectedSubTopics = [];
    for (let i = 0; i < selectedOptions.length; i++) {
      const selectedId = selectedOptions[i].value;
      if (selectedId) {
        const subTopic = this.currentTopic?.subTopics?.find(
          (st) => st.id.toString() === selectedId
        );
        if (subTopic) {
          this.selectedSubTopics.push(subTopic);
        }
      }
    }
  }

  /**
   * Get subtopics to display
   */
  getSubTopicsToDisplay(): any[] {
    if (this.shouldShowSubTopicFilter()) {
      return this.selectedSubTopics;
    }
    return this.currentTopic?.subTopics || [];
  }

  /**
   * Check if subtopic is selected
   */
  isSubTopicSelected(subTopicId: number): boolean {
    return this.selectedSubTopics.some((st) => st.id === subTopicId);
  }

  /**
   * Select all subtopics
   */
  selectAllSubTopics(): void {
    this.selectedSubTopics = [...(this.currentTopic?.subTopics || [])];
    this.updateSelectElement();
  }

  /**
   * Check if has selected subtopics
   */
  hasSelectedSubTopics(): boolean {
    if (this.shouldShowSubTopicFilter()) {
      return this.selectedSubTopics.length > 0;
    }
    return true;
  }

  /**
   * Clear all subtopic selections
   */
  clearAllSubTopics(): void {
    this.selectedSubTopics = [];
    this.updateSelectElement();
  }

  /**
   * Update select element
   */
  private updateSelectElement(): void {
    setTimeout(() => {
      const selectElement = document.getElementById("subtopic-select") as HTMLSelectElement;
      if (selectElement) {
        Array.from(selectElement.options).forEach((option) => {
          option.selected = this.selectedSubTopics.some(
            (st) => st.id.toString() === option.value
          );
        });
      }
    });
  }

  /**
   * Setup formula calculations
   */
  private setupFormulaCalculations(): void {
    if (!this.currentTopic || !this.performanceForm) {
      return;
    }

    this.performanceForm.valueChanges.subscribe((formValues) => {
      this.updateCalculatedFields();
    });

    this.updateCalculatedFields();
  }

  /**
   * Update calculated fields
   */
  private updateCalculatedFields(): void {
    if (!this.currentTopic) {
      return;
    }

    const questions = this.currentTopic.questionDTOs || this.currentTopic.questions || [];

    questions.forEach((question) => {
      if (question.formula) {
        const calculatedValue = this.calculateFormulaValue(question);

        if (this.currentTopic && this.currentTopic.formType === "NORMAL") {
          const formulaParts = question.formula.split("=");
          if (formulaParts.length === 2) {
            const targetRef = formulaParts[1].trim();
            const targetControlName = `question_${targetRef}`;
            const targetControl = this.performanceForm.get(targetControlName);

            if (targetControl) {
              console.log(`NORMAL form - Setting calculated value "${calculatedValue}" to control "${targetControlName}"`);
              targetControl.setValue(calculatedValue, { emitEvent: false });
            }
          }
        } else if (
          this.currentTopic &&
          (this.currentTopic.formType === "Q/ST" || this.currentTopic.formType === "ST/Q")
        ) {
          const formulaParts = question.formula.split("=");

          if (formulaParts.length === 2) {
            const targetRef = formulaParts[1].trim();
            const targetParts = targetRef.split("_");

            if (targetParts.length === 2) {
              const targetQuestionId = targetParts[0];
              const targetSubTopicId = targetParts[1];

              if (this.selectedCompanies.length > 0) {
                this.selectedCompanies.forEach((companyId) => {
                  const targetControlName = `matrix_${companyId}_${targetQuestionId}_${targetSubTopicId}`;
                  const targetControl = this.performanceForm.get(targetControlName);

                  if (targetControl) {
                    console.log(`Setting value "${calculatedValue}" for company ${companyId}, control "${targetControlName}"`);
                    targetControl.setValue(calculatedValue, { emitEvent: false });
                  }
                });
              } else {
                const targetControlName = `matrix_${targetQuestionId}_${targetSubTopicId}`;
                const targetControl = this.performanceForm.get(targetControlName);

                if (targetControl) {
                  targetControl.setValue(calculatedValue, { emitEvent: false });
                }
              }
            } else if (targetParts.length === 1 && /^\d+$/.test(targetRef)) {
              const targetQuestionId = targetRef;

              if (this.currentTopic?.subTopics) {
                if (this.selectedCompanies.length > 0) {
                  this.selectedCompanies.forEach((companyId) => {
                    this.currentTopic!.subTopics!.forEach((subTopic) => {
                      const columnCalculatedValue = this.calculateFormulaValueForColumn(question, subTopic.id, companyId);
                      const targetControlName = `matrix_${companyId}_${targetQuestionId}_${subTopic.id}`;
                      const targetControl = this.performanceForm.get(targetControlName);
                      
                      console.log(`Setting value "${columnCalculatedValue}" for company ${companyId}, control "${targetControlName}"`);

                      if (targetControl) {
                        targetControl.setValue(columnCalculatedValue, { emitEvent: false });
                      }
                    });
                  });
                } else {
                  this.currentTopic.subTopics.forEach((subTopic) => {
                    const columnCalculatedValue = this.calculateFormulaValueForColumn(question, subTopic.id);
                    const targetControlName = `matrix_${targetQuestionId}_${subTopic.id}`;
                    const targetControl = this.performanceForm.get(targetControlName);

                    if (targetControl) {
                      targetControl.setValue(columnCalculatedValue, { emitEvent: false });
                    }
                  });
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Check if field is calculated in NORMAL forms
   */
  isCalculatedFieldNormal(questionId: number): boolean {
    if (!this.currentTopic || this.currentTopic.formType !== "NORMAL") return false;

    const questions = this.currentTopic.questionDTOs || this.currentTopic.questions || [];
    const question = questions.find((q) => q.id === questionId);

    return !!(question && question.formula && question.formula.trim() !== "");
  }

  /**
   * Check if field is calculated in matrix forms
   */
  isCalculatedField(questionId: number, subTopicId: number): boolean {
    if (!this.currentTopic) return false;

    const questions = this.currentTopic.questionDTOs || this.currentTopic.questions || [];
    const targetRef = `${questionId}_${subTopicId}`;

    const isCalculated = questions.some((question) => {
      if (!question.formula) return false;

      const formulaParts = question.formula.split("=");
      if (formulaParts.length === 2) {
        const formulaTargetRef = formulaParts[1].trim();
        return formulaTargetRef === targetRef;
      }
      return false;
    });

    return isCalculated;
  }

  /**
   * Setup auto-save
   */
  private setupAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      if (this.performanceForm.dirty && !this.saving) {
        this.autoSave();
      }
    }, 30000);
  }

  /**
   * Auto-save form
   */
  private autoSave(): void {
    if (!this.performanceForm.valid) return;

    const statistics = this.prepareStatisticsData("DRAFT");
    
    if (statistics.length > 0) {
      this.performanceService
        .saveStatistics({ performanceStatistics: statistics })
        .subscribe({
          next: (response: ApiResponse) => {
            if (response.status === "SUCCESS") {
              console.log('Auto-saved successfully');
            }
          },
          error: (error: any) => console.error("Auto-save failed:", error),
        });
    }
  }

  /**
   * Save form
   */
  saveForm(): void {
    if (!this.performanceForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;
    const statistics = this.prepareStatisticsData("SAVED");
    
    if (Object.keys(this.fileUploads).length > 0) {
      this.uploadFilesFirst().then(() => {
        this.saveStatisticsData(statistics);
      }).catch(error => {
        this.errorMessage = "Error uploading files: " + error.message;
        this.saving = false;
      });
    } else {
      this.saveStatisticsData(statistics);
    }
  }

  /**
   * Upload files first
   */
 private uploadFilesFirst(): Promise<void> {
  const uploadPromises: Promise<void>[] = [];
  
  Object.keys(this.fileUploads).forEach(key => {
    const upload = this.fileUploads[key];
    if (upload && upload.file) {
      const promise = this.performanceService.uploadDocument(upload.file).toPromise()
        .then((response: ApiResponse<any> | undefined) => {
          if (response && response.status === "SUCCESS") {
            // Update the form control with the file URL
            this.updateFormControlWithFileUrl(key, response.data?.fileUrl || upload.fileName);
          }
        })
        .catch(error => {
          console.error(`Error uploading file ${key}:`, error);
        });
      uploadPromises.push(promise);
    }
  });
  
  return Promise.all(uploadPromises).then(() => {
    console.log('All files uploaded successfully');
  });
}

  /**
   * Update form control with file URL
   */
  private updateFormControlWithFileUrl(key: string, fileUrl: string): void {
  const parts = key.split('_');
  
  if (parts.length >= 2) {
    const prefix = parts[0]; // 'pdf' or 'word'
    const questionId = parts[1];
    const subTopicId = parts.length > 2 ? parts[2] : null;
    
    let controlName: string | undefined;
    
    if (this.currentTopic?.formType === 'NORMAL') {
      controlName = `question_${questionId}`;
    } else if (this.currentTopic?.formType === 'Q/ST' || this.currentTopic?.formType === 'ST/Q') {
      if (subTopicId) {
        controlName = `matrix_${questionId}_${subTopicId}`;
      } else {
        controlName = `matrix_${questionId}`;
      }
    }
    
    // Only update if controlName is defined
    if (controlName) {
      const control = this.performanceForm.get(controlName);
      if (control) {
        control.setValue(fileUrl);
        console.log(`Updated control ${controlName} with file URL: ${fileUrl}`);
      }
    }
  }
}

  /**
   * Save statistics data
   */
  private saveStatisticsData(statistics: PerformanceStatistic[]): void {
    this.performanceService.saveStatistics({ performanceStatistics: statistics }).subscribe({
      next: (response: ApiResponse) => {
        if (response.status === "SUCCESS") {
          this.successMessage = "Form saved successfully";
          this.performanceForm.markAsPristine();
          this.fileUploads = {};
        } else {
          this.errorMessage = response.message || "Failed to save form";
        }
        this.saving = false;
      },
      error: (error: any) => {
        this.errorMessage = "Error saving form: " + error.message;
        this.saving = false;
      },
    });
  }

  /**
   * Handle file selection
   */
  onFileSelect(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;

    const fileType = this.getFileType(file);
    
    if (fieldName.startsWith('pdf_') && fileType !== 'PDF') {
      this.errorMessage = 'Please upload a PDF file only';
      event.target.value = '';
      return;
    }

    if (fieldName.startsWith('word_') && !['DOC', 'DOCX'].includes(fileType)) {
      this.errorMessage = 'Please upload a Word (.doc, .docx) file only';
      event.target.value = '';
      return;
    }

    if (fieldName.startsWith('doc_') && !['PDF', 'DOC', 'DOCX'].includes(fileType)) {
      this.errorMessage = 'Please upload a PDF or Word file';
      event.target.value = '';
      return;
    }

    this.fileUploads[fieldName] = {
      file: file,
      fileName: file.name,
      fileType: fileType
    };

    this.errorMessage = '';
  }

  /**
   * Get file type
   */
  getFileType(file: File): string {
    if (file.type === 'application/pdf') return 'PDF';
    if (file.type === 'application/msword') return 'DOC';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
    return 'UNKNOWN';
  }

  /**
   * Submit form with OTP
   */
  submitForm(): void {
    if (!this.performanceForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;
    const statistics = this.prepareStatisticsData("SUBMITTED");

    this.performanceService
      .saveStatistics({ performanceStatistics: statistics })
      .subscribe({
        next: (response: ApiResponse) => {
          if (response.status === "SUCCESS") {
            this.sendOTP();
          } else {
            this.errorMessage = response.message || "Failed to submit form";
            this.saving = false;
          }
        },
        error: (error: any) => {
          this.errorMessage = "Error submitting form: " + error.message;
          this.saving = false;
        },
      });
  }

  /**
   * Send OTP
   */
  sendOTP(): void {
    this.performanceService.sendOTP().subscribe({
      next: (response: ApiResponse) => {
        if (response.status === "SUCCESS") {
          this.showOTPModal = true;
          this.successMessage = "OTP sent successfully to your registered mobile number";
        } else {
          this.errorMessage = response.message || "Failed to send OTP";
        }
        this.saving = false;
      },
      error: (error: any) => {
        this.errorMessage = "Error sending OTP: " + error.message;
        this.saving = false;
      },
    });
  }

  /**
   * Verify OTP
   */
  verifyOTP(): void {
    if (!this.otpValue || this.otpValue.length !== 6) {
      this.errorMessage = "Please enter a valid 6-digit OTP";
      return;
    }

    this.saving = true;
    this.performanceService.verifyOTP(this.otpValue).subscribe({
      next: (response: ApiResponse) => {
        if (response.status === "SUCCESS") {
          this.showOTPModal = false;
          this.successMessage = "Form submitted successfully!";
          this.isSuccess = true;
          setTimeout(() => this.navigateNext(), 2000);
        } else {
          this.errorMessage = response.message || "OTP verification failed";
        }
        this.saving = false;
      },
      error: (error: any) => {
        this.errorMessage = "Error verifying OTP: " + error.message;
        this.saving = false;
      },
    });
  }

  /**
   * Prepare statistics data
   */
  private prepareStatisticsData(status: string): PerformanceStatistic[] {
    const statistics: PerformanceStatistic[] = [];
    const formValues = this.performanceForm.value;

    console.log('Preparing statistics data with status:', status);
    const questions = this.currentTopic?.questions || this.currentTopic?.questionDTOs || [];

    if (this.currentTopic?.formType === 'NORMAL') {
      questions.forEach(question => {
        const value = formValues[`question_${question.id}`];
        if (value !== undefined && value !== null && (value !== '' || value === 0 || value === '0')) {
          statistics.push({
            companyId: null,
            questionId: question.id,
            value: value.toString(),
            topicId: this.currentTopic!.id,
            moduleId: this.currentModule!.id,
            status,
          });
        }
      });
    }

    if (['Q/ST', 'ST/Q'].includes(this.currentTopic?.formType ?? '')) {
      const hasCompanies = this.selectedCompanies && this.selectedCompanies.length > 0;

      questions.forEach(question => {
        const companiesToLoop = hasCompanies ? this.selectedCompanies : [ null ];
        
        companiesToLoop.forEach(company => {
          this.currentTopic?.subTopics?.forEach(subTopic => {
            const controlName = hasCompanies
              ? `matrix_${company}_${question.id}_${subTopic.id}`
              : `matrix_${question.id}_${subTopic.id}`;

            const value = formValues[controlName] ?? "0";

            statistics.push({
              companyId: company,
              questionId: question.id,
              subTopicId: subTopic.id,
              value: value.toString(),
              topicId: this.currentTopic!.id,
              moduleId: this.currentModule!.id,
              status,
            });
          });
        });
      });
    }

    console.log('✅ Final prepared statistics:', statistics);
    return statistics;
  }

  /**
   * Check if date fields should be shown
   */
  shouldShowDateFields(question: any): boolean {
    if (question.type === "DATE") {
      const policeSabhaCount = this.getPoliceSabhaCount();
      const shouldShow = policeSabhaCount > 0;
      return shouldShow;
    }
    return false;
  }

  /**
   * Get police sabha count
   */
  getPoliceSabhaCount(): number {
    const policeSabhaQuestion = this.currentTopic?.questionDTOs?.find(
      (q) => q.question?.includes("No. of Police Sabha") || q.id === 1
    );

    if (policeSabhaQuestion) {
      const controlName = `question_${policeSabhaQuestion.id}`;
      const control = this.performanceForm.get(controlName);
      const count = control ? parseInt(control.value) || 0 : 0;
      return count;
    }
    return 0;
  }

  /**
   * Get initial police sabha count
   */
  private getInitialPoliceSabhaCount(): number {
    const policeSabhaQuestion = this.currentTopic?.questionDTOs?.find(
      (q) => q.question?.includes("No. of Police Sabha") || q.id === 1
    );

    if (policeSabhaQuestion) {
      const count = parseInt(policeSabhaQuestion.currentCount) || 0;
      return count;
    }
    return 0;
  }

  /**
   * Get date fields array
   */
  getDateFieldsArray(): any[] {
    const count = this.getPoliceSabhaCount();
    return new Array(count).fill(0);
  }

  /**
   * Check for duplicate dates
   */
  hasDuplicateDates(): boolean {
    const dateQuestion = this.currentTopic?.questionDTOs?.find(
      (q) => q.type === "DATE"
    );

    if (!dateQuestion) return false;

    const dates: string[] = [];
    const count = this.getPoliceSabhaCount();
    for (let i = 0; i < count; i++) {
      const controlName = `date_${dateQuestion.id}_${i}`;
      const control = this.performanceForm.get(controlName);
      if (control?.value) {
        if (dates.includes(control.value)) {
          return true;
        }
        dates.push(control.value);
      }
    }

    return false;
  }

  /**
   * Get date field colspan
   */
  getDateFieldColspan(): number {
    let colspan = 1;

    if (this.hasPreviousQuestion()) colspan++;
    if (this.hasCumulativeQuestion()) colspan++;

    return colspan;
  }

  /**
   * Update date fields
   */
  updateDateFields(count: number): void {
    const dateQuestion = this.currentTopic?.questionDTOs?.find(
      (q) => q.type === "DATE"
    );

    if (!dateQuestion) {
      return;
    }

    this.removeDateControls(dateQuestion.id);

    if (count > 0) {
      this.addDateControls(dateQuestion.id, count);
    }
    this.dateFieldsCount = count;
  }

  /**
   * Clear date fields
   */
  clearDateFields(): void {
    const dateQuestion = this.currentTopic?.questionDTOs?.find(
      (q) => q.type === "DATE"
    );

    if (dateQuestion) {
      this.removeDateControls(dateQuestion.id);
    }
  }

  /**
   * Remove date controls
   */
  removeDateControls(questionId: number): void {
    const controlNames = Object.keys(this.performanceForm.controls).filter(
      (key) => key.startsWith(`date_${questionId}_`)
    );

    controlNames.forEach((controlName) => {
      this.performanceForm.removeControl(controlName);
    });
  }

  /**
   * Add date controls
   */
  addDateControls(questionId: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const controlName = `date_${questionId}_${i}`;
      this.performanceForm.addControl(
        controlName,
        new FormControl("", [Validators.required])
      );
    }
  }

  /**
   * Handle police sabha count change
   */
  onPoliceSabhaCountChange(event: any, questionId: number): void {
    const policeSabhaQuestion = this.currentTopic?.questionDTOs?.find(
      (q) => q.question?.includes("No. of Police Sabha") || q.id === 1
    );

    if (policeSabhaQuestion && policeSabhaQuestion.id === questionId) {
      const newCount = parseInt(event.target.value) || 0;
      this.updateDateFields(newCount);

      if (newCount === 0) {
        this.clearDateFields();
      }
    }
  }

  /**
   * Mark form group as touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.performanceForm.controls).forEach((key) => {
      this.performanceForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Navigate to next
   */
  navigateNext(): void {
    if (!this.currentTopic) return;

    this.loading = true;
    
    this.navigationHelper.navigateToNext(this.moduleId, this.currentTopic.id).subscribe({
      next: (nextTarget) => {
        this.loading = false;
        
        if (nextTarget) {
          console.log('Navigating to:', {
            module: nextTarget.moduleId,
            topic: nextTarget.topicId,
            currentModuleId: this.moduleId,
            currentTopicId: this.currentTopic?.id,
            isSameModule: nextTarget.isSameModule
          });

          if (nextTarget.isSameModule === false) {
            this.successMessage = `Moving to next module: ${this.getModuleName(nextTarget.moduleId)}`;
          }

          this.router.navigate(['dashboard/performance'], {
            queryParams: { 
              module: nextTarget.moduleId, 
              topic: nextTarget.topicId 
            },
            queryParamsHandling: 'merge'
          }).then(() => {
            if (nextTarget.isSameModule === false) {
              setTimeout(() => {
                this.successMessage = '';
              }, 3000);
            }
          });
        } else {
          this.successMessage = '🎉 You have completed all topics in all modules!';
          console.log('All modules completed');
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error finding next topic';
        console.error('Navigation error:', error);
      }
    });
  }


private modulePriorities = new Map<number, {topicId: number; priority: number; topicName: string}[]>(); // moduleId -> topics with priorities
private currentModuleTopics: TopicDTO[] = [];

  /**
 * Extract priority from topic - handles different API field names
 */
private getTopicPriority(topic: TopicDTO): number {
  // First, let's see what fields are available
  console.log('🔍 TOPIC OBJECT KEYS:', Object.keys(topic));
  
  // Try different possible priority field names
  // The API might be sending it with a different name
  const priority = (topic as any).priority || 
                  (topic as any).Priority || 
                  (topic as any).PRIORITY ||
                  (topic as any).displayOrder ||
                  (topic as any).order ||
                  topic.id; // Fallback to ID
  
  console.log('🔍 Priority found:', priority, 'for topic', topic.id, topic.topicName);
  
  return priority;
}

/**
 * Extract and store priorities for current module
 */

// Add this property
private allModuleTopics = new Map<number, TopicDTO[]>(); // moduleId -> all topics

/**
 * Fetch all topics for the current module
 */
/**
 * Fetch all topics for the current module
 */
private fetchAllTopicsForModule(): void {
  if (!this.moduleId) return;
  
  // Check if we already fetched topics for this module
  if (this.allModuleTopics.has(this.moduleId)) {
    console.log('📚 Using cached topics for module', this.moduleId);
    this.storeModulePriorities();
    return;
  }
  
  console.log('📚 Fetching all topics for module', this.moduleId);
  
  // Call the service method
  this.performanceService.getAllTopicsForModule(this.moduleId).subscribe({
    next: (response: ApiResponse<TopicDTO[]>) => {
      if (response.status === "SUCCESS" && response.data) {
        // DEBUG: Log the FULL response
        console.log('🔍 FULL API RESPONSE:', response);
        console.log('🔍 FIRST TOPIC FULL OBJECT:', JSON.stringify(response.data[0], null, 2));
        
        // Store all topics for this module
        this.allModuleTopics.set(this.moduleId, response.data);
        
        // DEBUG: Show what we're getting
        console.log('🔍 RAW TOPIC DATA:', response.data);
        this.debugPriorityValues();
        
        // Now store priorities based on ALL topics
        this.storeModulePriorities();
        
        console.log('✅ Fetched all topics:', {
          moduleId: this.moduleId,
          totalTopics: response.data.length,
          topics: response.data.map(t => ({
            id: t.id,
            name: t.topicName,
            priority: (t as any).priority // Make sure this shows actual priority
          }))
        });
      } else {
        console.warn('⚠️ Failed to fetch all topics:', response.message);
        // Fallback to incremental approach
        this.buildTopicListIncrementally();
      }
    },
    error: (error: any) => {
      console.error('Error fetching all topics for module:', error);
      // Fallback: use incremental approach
      this.buildTopicListIncrementally();
    }
  });
}
private clearComponentData(): void {
  // Clear auto-save interval
  if (this.autoSaveInterval) {
    clearInterval(this.autoSaveInterval);
    this.autoSaveInterval = null;
  }

  // Clear form data
  this.performanceForm = this.formBuilder.group({});
  this.formData = {};

  // Clear navigation data
  this.modules = [];
  this.currentModule = null;
  this.currentTopic = null;
  this.userDistrict = "";
  this.monthYear = "";

  // Clear navigation flags
  this.nextModule = false;
  this.prevModule = false;
  this.nextTopic = false;
  this.prevTopic = false;

  // Clear UI state
  this.loading = false;
  this.saving = false;
  this.showOTPModal = false;
  this.isSuccess = false;
  this.errorMessage = "";
  this.successMessage = "";
  this.otpValue = "";
  
  // Clear file uploads
  if (this.fileUploads) {
    this.fileUploads = {};
  }
  
  // 🔧 NEW: Don't clear allModuleTopics - we want to cache them
  // But clear modulePriorities for current module
  if (this.moduleId) {
    this.modulePriorities.delete(this.moduleId);
  }
}

/**
 * Updated: Store priorities based on ALL topics in module
 */
private storeModulePriorities(): void {
  if (!this.moduleId) return;
  
  const allTopics = this.allModuleTopics.get(this.moduleId) || [];
  
  if (allTopics.length === 0) return;
  
  // Call debug method to see what we're getting
  this.debugPriorityValues();
  
  const topicsWithPriority = allTopics.map(topic => {
    const priority = this.getTopicPriority(topic);
    console.log(`🔍 Topic ${topic.id} - "${topic.topicName}" - Priority: ${priority}`);
    
    return {
      topicId: topic.id,
      priority: priority,
      topicName: topic.topicName
    };
  });
  
  // Sort by priority ASCENDING (1, 2, 3, ...)
  topicsWithPriority.sort((a, b) => a.priority - b.priority);
  
  this.modulePriorities.set(this.moduleId, topicsWithPriority);
  
  // Debug the sorted list
  console.log('📊 SORTED Priority list:');
  topicsWithPriority.forEach((topic, index) => {
    console.log(`   ${index + 1}. Topic ${topic.topicId} - "${topic.topicName}" (Priority: ${topic.priority})`);
  });
  
  if (topicsWithPriority.length > 0) {
    const lastTopic = topicsWithPriority[topicsWithPriority.length - 1];
    const firstTopic = topicsWithPriority[0];
    console.log('📊 First topic (lowest priority?):', firstTopic.topicId, firstTopic.topicName, 'Priority:', firstTopic.priority);
    console.log('📊 Last topic (highest priority?):', lastTopic.topicId, lastTopic.topicName, 'Priority:', lastTopic.priority);
  }
}
/**
 * Check if current topic is the last topic based on priority
 */
isLastTopicByPriority(): boolean {
  if (!this.currentTopic || !this.moduleId) return false;
  
  const moduleTopics = this.modulePriorities.get(this.moduleId);
  
  if (!moduleTopics || moduleTopics.length === 0) {
    console.log('⚠️ No priorities stored for module', this.moduleId);
    return false;
  }
  
  // Get the topic with highest priority number (last in sorted array)
  const lastTopic = moduleTopics[moduleTopics.length - 1];
  const isLast = this.currentTopic.id === lastTopic.topicId;
  
  console.log('🔍 Priority check:', {
    moduleId: this.moduleId,
    currentTopicId: this.currentTopic.id,
    lastTopicId: lastTopic.topicId,
    isLast: isLast,
    totalTopics: moduleTopics.length
  });
  
  return isLast;
}


private debugPriorityValues(): void {
  const allTopics = this.allModuleTopics.get(this.moduleId) || [];
  
  console.log('🔍 DEBUG PRIORITY VALUES for Module', this.moduleId);
  allTopics.forEach(topic => {
    console.log('   Topic:', {
      id: topic.id,
      name: topic.topicName,
      priority: topic.priority, // This is what we need to check
      rawTopic: topic // Show the whole object
    });
  });
}
// /**
//  * Alternative: Check if current topic has the highest priority
//  */
// isCurrentTopicHighestPriority(): boolean {
//   if (!this.currentTopic || !this.moduleId) return false;
  
//   const moduleTopics = this.modulePriorities.get(this.moduleId);
//   if (!moduleTopics || moduleTopics.length === 0) return false;
  
//   // Find current topic priority
//   const currentTopicData = moduleTopics.find(t => t.topicId === this.currentTopic!.id);
//   if (!currentTopicData) return false;
  
//   // Find max priority in module
//   const maxPriority = Math.max(...moduleTopics.map(t => t.priority));
  
//   return currentTopicData.priority === maxPriority;
// }

/**
 * Main method to determine if submit button should be shown
 */
// shouldShowSubmitButton(): boolean {
//   // Only show submit on the last topic of the module
//   const isLast = this.isLastTopicByPriority();
  
//   console.log('🎯 Submit button check:', {
//     moduleId: this.moduleId,
//     currentTopicId: this.currentTopic?.id,
//     currentTopicName: this.currentTopic?.topicName,
//     isLast: isLast,
//     shouldShow: isLast
//   });
  
//   return isLast;
// }

/**
 * Debug method to see topic information
 */
/**
 * Debug method to see topic information
 */
debugTopicInfo(): void {
  console.log('🔍 DEBUG Topic Info:', {
    routeParams: {
      moduleId: this.moduleId,
      topicId: this.topicId
    },
    currentModule: this.currentModule ? {
      id: this.currentModule.id,
      name: this.currentModule.moduleName,
      topicsInResponse: this.currentModule.topicDTOs?.length || 0
    } : null,
    currentTopic: this.currentTopic ? {
      id: this.currentTopic.id,
      name: this.currentTopic.topicName,
      priority: this.getTopicPriority(this.currentTopic)
    } : null,
    allTopicsCached: this.allModuleTopics.get(this.moduleId)?.length || 0,
    storedPriorities: this.modulePriorities.get(this.moduleId)?.length || 0,
    isLastByPriority: this.isLastTopicByPriority()
  });
}



/**
 * SIMPLE DEBUG - Shows what's happening with priorities
 */
simpleDebug(): void {
  console.log('🔍 ========== SIMPLE DEBUG ==========');
  
  // Basic info
  console.log('📌 Module:', this.moduleId, '-', this.currentModule?.moduleName);
  console.log('📌 Topic:', this.currentTopic?.id, '-', this.currentTopic?.topicName);
  
  // What topics we know about
  const discoveredTopics = this.allModuleTopics.get(this.moduleId) || [];
  console.log('📚 Topics discovered so far:', discoveredTopics.length);
  
  if (discoveredTopics.length > 0) {
    discoveredTopics.forEach(topic => {
      console.log('   -', topic.id, topic.topicName, 'Priority:', this.getTopicPriority(topic));
    });
  }
  
  // Priority list
  const priorities = this.modulePriorities.get(this.moduleId) || [];
  console.log('🎯 Priority list:', priorities.length, 'topics');
  
  if (priorities.length > 0) {
    const lastTopic = priorities[priorities.length - 1];
    console.log('   Last topic by priority:', lastTopic.topicId, lastTopic.topicName);
    console.log('   Current topic is last?', this.currentTopic?.id === lastTopic.topicId);
  }
  
  // Should show submit?
  console.log('✅ Should show submit button?', this.shouldShowSubmitButton());
  console.log('🔍 ========== END DEBUG ==========\n');
}

/**
 * Main method to determine if submit button should be shown
 */
private submitButtonCache: {[key: string]: boolean} = {}; // Add this property

shouldShowSubmitButton(): boolean {
  if (!this.currentTopic || !this.moduleId) return false;
  
  // Create cache key
  const cacheKey = `${this.moduleId}_${this.currentTopic.id}`;
  
  // Return cached result if available
  if (this.submitButtonCache[cacheKey] !== undefined) {
    return this.submitButtonCache[cacheKey];
  }
  
  const priorities = this.modulePriorities.get(this.moduleId) || [];
  if (priorities.length === 0) {
    this.submitButtonCache[cacheKey] = false;
    return false;
  }
  
  // Find the topic with the HIGHEST priority number
  const highestPriorityTopic = priorities.reduce((max, topic) => 
    topic.priority > max.priority ? topic : max
  );
  
  const currentTopicPriority = priorities.find(t => t.topicId === this.currentTopic!.id);
  const isHighestPriority = this.currentTopic.id === highestPriorityTopic.topicId;
  
  // Log only once per topic change
  console.log('🎯 SUBMIT BUTTON CHECK (CACHED):', {
    currentTopicId: this.currentTopic.id,
    currentTopicName: this.currentTopic.topicName,
    currentPriority: currentTopicPriority?.priority || 'Not found',
    highestPriorityTopicId: highestPriorityTopic.topicId,
    highestPriorityTopicName: highestPriorityTopic.topicName,
    highestPriorityValue: highestPriorityTopic.priority,
    shouldShowSubmit: isHighestPriority
  });
  
  // Cache the result
  this.submitButtonCache[cacheKey] = isHighestPriority;
  
  return isHighestPriority;
}

// Clear cache when module/topic changes
ngOnInit(): void {
  this.route.queryParams.subscribe((params) => {
    // Clear cache
    this.submitButtonCache = {};
    
    this.selectedCompanies = [];
    this.clearComponentData();

    this.moduleId = params["module"] ? parseInt(params["module"]) : 0;
    this.topicId = params["topic"] ? parseInt(params["topic"]) : 1;
    
    console.log('Loading module:', this.moduleId, 'topic:', this.topicId);
    this.loadPerformanceData();
    this.loadCompanies();
  });
}

/**
 * Workaround: Build topic list incrementally as user navigates
 */
private buildTopicListIncrementally(): void {
  if (!this.currentTopic || !this.moduleId) return;
  
  // Get or create topic list for this module
  if (!this.allModuleTopics.has(this.moduleId)) {
    this.allModuleTopics.set(this.moduleId, []);
  }
  
  const topicList = this.allModuleTopics.get(this.moduleId)!;
  
  // Add current topic if not already in list
  const existingTopic = topicList.find(t => t.id === this.currentTopic!.id);
  if (!existingTopic && this.currentTopic) {
    // Create a deep copy of the topic
    const topicCopy = {
      ...this.currentTopic,
      questions: this.currentTopic.questions ? [...this.currentTopic.questions] : [],
      questionDTOs: this.currentTopic.questionDTOs ? [...this.currentTopic.questionDTOs] : [],
      subTopics: this.currentTopic.subTopics ? [...this.currentTopic.subTopics] : []
    };
    
    topicList.push(topicCopy);
    console.log('➕ Added topic to incremental list:', {
      moduleId: this.moduleId,
      topicId: this.currentTopic.id,
      topicName: this.currentTopic.topicName,
      totalTopicsNow: topicList.length
    });
    
    // Update priorities
    this.storeModulePriorities();
  }
}

  /**
   * Get module name
   */
  getModuleName(moduleId: number): string {
    if (!this.modules || this.modules.length === 0) {
      return `Module ${moduleId}`;
    }
    
    const module = this.modules.find(m => m.id === moduleId);
    return module?.moduleName || `Module ${moduleId}`;
  }

  /**
   * Navigate to previous
   */
  navigatePrevious(): void {
    if (!this.currentTopic) return;

    this.loading = true;
    
    this.navigationHelper.navigateToPrevious(this.moduleId, this.currentTopic.id).subscribe({
      next: (prevTarget) => {
        this.loading = false;
        
        if (prevTarget) {
          console.log('Navigating to previous:', prevTarget);
          this.router.navigate(['dashboard/performance'], {
            queryParams: { 
              module: prevTarget.moduleId, 
              topic: prevTarget.topicId 
            },
            queryParamsHandling: 'merge'
          });
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error finding previous topic';
      }
    });
  }

  /**
   * Update navigation info
   */
  private updateNavigationInfo(): void {
    if (!this.currentTopic) return;
    
    this.navigationHelper.getNavigationInfo(this.moduleId, this.currentTopic.id).subscribe({
      next: (info) => {
        this.nextNavInfo = info.next;
        this.prevNavInfo = info.prev;
        this.navigationInfo = info;
        
        this.nextTopic = info.hasNext;
        this.prevTopic = info.hasPrevious;
        
        console.log('Navigation info:', info);
      },
      error: (error) => {
        console.error('Error updating navigation info:', error);
      }
    });
  }

  /**
   * Go to next module
   */
  goToNextModule() {
    if (this.nextModule) {
      let increment = 1;
      const roleName = this.authService.getUserRoleName();

      if (this.moduleId === 21 && roleName === 'Special Reserved Battalion') {
        increment = 2;
      }
      
      this.router.navigate(["dashboard/performance"], {
        queryParams: { module: this.moduleId + increment, topic: 1 },
      });
    }
  }

  /**
   * Go to previous module
   */
  goToPreviousModule() {
    if (this.prevModule) {
      let decrement = 1;
      const roleName = this.authService.getUserRoleName();

      if (this.moduleId === 23 && roleName === 'Special Reserved Battalion') {
        decrement = 2;
      }
      
      const currentModuleId = Number(this.moduleId);
      const prevModule = this.modules[currentModuleId - decrement];
      const lastTopicId = prevModule?.topicDTOs?.length || 1;

      this.router.navigate(["dashboard/performance"], {
        queryParams: { module: currentModuleId - decrement, topic: lastTopicId },
      });
    }
  }

  /**
   * Get form value
   */
  getFormValue(controlName: string): any {
    return this.performanceForm.get(controlName)?.value || "";
  }

  /**
   * Get matrix value
   */
  getMatrixValue(questionId: number, subTopicId: number, companyId?: number): string {
    if (companyId !== undefined) {
      const keyWithCompId = `matrix_${companyId}_${questionId}_${subTopicId}`;
      const value = this.performanceForm.get(keyWithCompId)?.value;
      if (value !== undefined && value !== null) {
        return value.toString();
      }
    }

    if (this.selectedCompanies.length > 0) {
      for (const compId of this.selectedCompanies) {
        const keyWithCompId = `matrix_${compId}_${questionId}_${subTopicId}`;
        const value = this.performanceForm.get(keyWithCompId)?.value;
        if (value !== undefined && value !== null) {
          return value.toString();
        }
      }
    }

    const keyWithoutCompId = `matrix_${questionId}_${subTopicId}`;
    const fallbackValue = this.performanceForm.get(keyWithoutCompId)?.value ?? "0";
    
    return fallbackValue.toString();
  }

  /**
   * Check if subtopic header should be shown
   */
  shouldShowSubtopicHeader(currentIndex: number, subTopicId: number): boolean {
    if (currentIndex === 0) return true;

    const prevQuestion = this.currentTopic?.questions?.[currentIndex - 1];
    return prevQuestion?.subTopicId !== subTopicId;
  }

  /**
   * Format question text
   */
  formatQuestionText(question: QuestionDTO): string {
    let text = question.question || "";

    text = text.replace(/\{userDistrict\}/g, this.userDistrict);
    text = text.replace(/\{monthYear\}/g, this.monthYear);

    return text;
  }

  /**
   * Calculate initial formula value
   */
  private calculateInitialFormulaValue(question: QuestionDTO): string {
    if (!question.formula) {
      return question.currentCount || question.defaultVal || "";
    }

    try {
      const formulaParts = question.formula.split("=");
      if (formulaParts.length !== 2) {
        return question.currentCount || question.defaultVal || "";
      }

      let calculationExpression = formulaParts[0].trim();

      if (this.currentTopic?.questionDTOs) {
        this.currentTopic.questionDTOs.forEach((q) => {
          const questionIdPattern = new RegExp(`\\b${q.id}\\b`, "g");

          if (questionIdPattern.test(calculationExpression)) {
            const valueToUse = parseFloat(q.currentCount || "0") || 0;
            calculationExpression = calculationExpression.replace(
              questionIdPattern,
              valueToUse.toString()
            );
          }
        });
      }

      if (!/^[\d\s+\-*/().]+$/.test(calculationExpression)) {
        return question.currentCount || question.defaultVal || "";
      }

      const result = eval(calculationExpression);
      const resultString = result.toString();
      return resultString;
    } catch (error) {
      console.error("Initial formula calculation error:", error);
      return question.currentCount || question.defaultVal || "";
    }
  }

  /**
   * Calculate formula value for column
   */
  calculateFormulaValueForColumn(question: QuestionDTO, subTopicId: number, companyId?: number): string {
    if (!question.formula) {
      return question.defaultVal || "";
    }

    try {
      const formulaParts = question.formula.split("=");
      if (formulaParts.length !== 2) {
        return question.defaultVal || "";
      }

      let calculationExpression = formulaParts[0].trim();

      if (this.currentTopic?.questions || this.currentTopic?.questionDTOs) {
        const questions = this.currentTopic.questions || this.currentTopic.questionDTOs || [];

        questions.forEach((q) => {
          const questionIdPattern = new RegExp(`\\b${q.id}\\b`, "g");

          if (questionIdPattern.test(calculationExpression)) {
            const cellValue = this.getMatrixValue(q.id, subTopicId, companyId);
            const numericValue = parseFloat(cellValue) || 0;
            calculationExpression = calculationExpression.replace(
              new RegExp(`\\b${q.id}\\b`, "g"),
              numericValue.toString()
            );
          }
        });
      }

      if (!/^[\d\s+\-*/().]+$/.test(calculationExpression)) {
        return question.defaultVal || "";
      }

      const result = eval(calculationExpression);
      return result.toString();
    } catch (error) {
      return question.defaultVal || "";
    }
  }

  /**
   * Calculate formula value
   */
  calculateFormulaValue(question: QuestionDTO): string {
    if (!question.formula) {
      return question.defaultVal || "";
    }

    try {
      const formulaParts = question.formula.split("=");
      if (formulaParts.length !== 2) {
        return question.defaultVal || "";
      }

      let calculationExpression = formulaParts[0].trim();
      const targetRef = formulaParts[1].trim();

      const formValues = this.performanceForm.value;

      Object.keys(formValues).forEach((key) => {
        if (key.startsWith("matrix_")) {
          const parts = key.replace("matrix_", "").split("_");
          if (parts.length === 2) {
            const questionId = parts[0];
            const subTopicId = parts[1];
            const formulaRef = `${questionId}_${subTopicId}`;

            const value = formValues[key] || "0";
            calculationExpression = calculationExpression.replace(
              new RegExp(`\\b${formulaRef}\\b`, "g"),
              value
            );
          }
        }
      });

      if (this.currentTopic?.questionDTOs) {
        this.currentTopic.questionDTOs.forEach((q) => {
          const questionIdPattern = new RegExp(`\\b${q.id}\\b`, "g");

          if (questionIdPattern.test(calculationExpression)) {
            let valueToReplace = 0;

            if (this.currentTopic?.formType === "NORMAL") {
              const controlName = `question_${q.id}`;
              const controlValue = formValues[controlName];
              valueToReplace =
                controlValue !== undefined && controlValue !== ""
                  ? parseFloat(controlValue) || 0
                  : parseFloat(q.currentCount || "0") || 0;
            } else {
              valueToReplace = this.calculateRowTotal(q.id);
            }

            calculationExpression = calculationExpression.replace(
              new RegExp(`\\b${q.id}\\b`, "g"),
              valueToReplace.toString()
            );
          }
        });
      }

      if (!/^[\d\s+\-*/().]+$/.test(calculationExpression)) {
        return question.defaultVal || "";
      }

      const result = eval(calculationExpression);
      const resultString = result.toString();
      return resultString;
    } catch (error) {
      console.error('Formula calculation error:', error);
      return question.defaultVal || "";
    }
  }

  /**
   * Calculate row total
   */
  calculateRowTotal(questionId: number): number {
    if (!this.currentTopic?.subTopics) return 0;

    let total = 0;
    this.currentTopic.subTopics.forEach((subTopic) => {
      const value = this.getMatrixValue(questionId, subTopic.id);
      total += parseFloat(value) || 0;
    });
    return total;
  }

  /**
   * Calculate column total
   */
  calculateColumnTotal(subTopicId: number): number {
    if (!this.currentTopic?.questionDTOs) return 0;

    let total = 0;
    this.currentTopic.questionDTOs.forEach((question) => {
      const value = this.getMatrixValue(question.id, subTopicId);
      total += parseFloat(value) || 0;
    });
    return total;
  }

  /**
   * Calculate subtopic total
   */
  calculateSubTopicTotal(subTopicId: number): number {
    if (!this.currentTopic?.questionDTOs) return 0;

    let total = 0;
    this.currentTopic.questionDTOs.forEach((question) => {
      const value = this.getMatrixValue(question.id, subTopicId);
      total += parseFloat(value) || 0;
    });
    return total;
  }

  /**
   * Calculate question total
   */
  calculateQuestionTotal(questionId: number): number {
    if (!this.currentTopic?.subTopics) return 0;

    let total = 0;
    this.currentTopic.subTopics.forEach((subTopic) => {
      const value = this.getMatrixValue(questionId, subTopic.id);
      total += parseFloat(value) || 0;
    });
    return total;
  }

  /**
   * Calculate grand total
   */
  calculateGrandTotal(): number {
    if (!this.currentTopic?.questionDTOs || !this.currentTopic?.subTopics)
      return 0;

    let total = 0;
    this.currentTopic.questionDTOs.forEach((question) => {
      this.currentTopic?.subTopics?.forEach((subTopic) => {
        const value = this.getMatrixValue(question.id, subTopic.id);
        total += parseFloat(value) || 0;
      });
    });
    return total;
  }

  /**
   * Close OTP modal
   */
  closeOTPModal(): void {
    this.showOTPModal = false;
    this.otpValue = "";
  }

  /**
   * Get cumulative value
   */
  getCumulativeValue(question: QuestionDTO): string {
    if (question.formula && question.formula.trim() !== "") {
      const controlName = `question_${question.id}`;
      const control = this.performanceForm.get(controlName);
      if (control) {
        const currentValue = control.value;
        return currentValue !== undefined && currentValue !== ""
          ? currentValue
          : "0";
      }
    }

    const controlName = `question_${question.id}`;
    const control = this.performanceForm.get(controlName);
    if (control) {
      const currentValue = control.value;
      if (currentValue !== undefined && currentValue !== "") {
        return currentValue;
      }
    }

    return question.finYearCount || question.currentCount || "0";
  }

  /**
   * Clear messages
   */
  clearMessages(): void {
    this.errorMessage = "";
    this.successMessage = "";
  }

  /**
   * Check if has document type
   */
  hasDocumentType(): boolean {
    return !!this.currentTopic?.questionDTOs?.some(
      (q) => q.type === "PDF_DOCUMENT" || q.type === "WORD_DOCUMENT"
    );
  }

  /**
   * Check if it's a document type
   */
  isDocumentType(question: any, subTopic?: any): boolean {
    // First check if question itself is document type
    if (question.type === 'DOCUMENT' || 
       
        question.question?.toLowerCase().includes('document') ||
        
        question.question?.toLowerCase().includes('upload')) {
      return true;
    }
    
    // Additional check based on subtopic name
    if (subTopic) {
      const subTopicName = subTopic.subTopicName?.toLowerCase() || '';
      const subTopicCode = subTopic.subTopicCode?.toLowerCase() || '';
      
      // Check for document-related subtopics
      return subTopicName.includes('signed') || 
             subTopicName.includes('pdf') || 
             subTopicName.includes('document') ||
             
             subTopicName.includes('word') ||
             subTopicName.includes('editable') ||
             subTopicCode.includes('doc') ||
          
             subTopicCode.includes('pdf');
    }
    
    return false;
  }

  /**
   * Check if subtopic should accept PDF only
   */
  shouldAcceptPDFOnly(subTopic: any): boolean {
    const pdfKeywords = ['signed', 'signature', 'pdf', 'signed pdf', 'signature copy'];
    const subTopicName = subTopic.subTopicName?.toLowerCase() || '';
    
    return pdfKeywords.some(keyword => subTopicName.includes(keyword));
  }

  /**
   * Check if subtopic should accept Word only
   */
  shouldAcceptWordOnly(subTopic: any): boolean {
    const wordKeywords = ['editable', 'word', 'doc', 'docx', 'editable word', 'word file'];
    const subTopicName = subTopic.subTopicName?.toLowerCase() || '';
    
    return wordKeywords.some(keyword => subTopicName.includes(keyword));
  }

  /**
   * Check if we should show company filter
   */
  shouldShowCompanyFilter(): boolean {
    const formType = this.currentTopic?.formType;
    const isMatrixForm = formType === 'Q/ST' || formType === 'ST/Q';
    
    return isMatrixForm && this.currentTopic?.topicSubName === "Strength in all Coys";
  }

  /**
   * Handle company selection
   */
  onCompanySelect(event: any) {
    const selectedOptions = Array.from(event.target.selectedOptions).map(
      (o: any) => Number(o.value)
    );
    this.loadPerformanceData();
    this.selectedCompanies = selectedOptions;
    console.log("selected Company", this.selectedCompanies);
  }

  /**
   * Get company name
   */
  getCompanyName(id: number) {
    return this.company.find((c) => c.id === id)?.companyName || "";
  }

  /**
   * Get company preview value
   */
  getCompanyPreviewValue(questionId: number, subTopicId: number): string {
    let total = 0;
    
    this.selectedCompanies.forEach(companyId => {
      const controlName = `matrix_${companyId}_${questionId}_${subTopicId}`;
      const control = this.performanceForm.get(controlName);
      
      if (control && control.value !== null && control.value !== undefined && control.value !== '') {
        const value = parseFloat(control.value);
        if (!isNaN(value)) {
          total += value;
        }
      }
    });
    
    return total.toString();
  }

  /**
   * Get question total preview
   */
  getQuestionTotalPreview(questionId: number): string {
    if (!this.currentTopic?.subTopics) return "0";
    
    let total = 0;
    const subTopicIds = [285, 286, 287, 288, 289, 290];
    
    subTopicIds.forEach(subTopicId => {
      const value = parseFloat(this.getCompanyPreviewValue(questionId, subTopicId));
      if (!isNaN(value)) {
        total += value;
      }
    });
    
    return total.toString();
  }

  /**
   * Get subtopic total preview
   */
  getSubTopicTotalPreview(subTopicId: number): string {
    const questionIds = [1078, 1079, 1080, 1081, 1082];
    
    let total = 0;
    questionIds.forEach(questionId => {
      const value = parseFloat(this.getCompanyPreviewValue(questionId, subTopicId));
      if (!isNaN(value)) {
        total += value;
      }
    });
    
    return total.toString();
  }

  /**
   * Get grand total preview
   */
  getGrandTotalPreview(): string {
    const questionIds = [1078, 1079, 1080, 1081, 1082];
    const subTopicIds = [285, 286, 287, 288, 289, 290];
    
    let total = 0;
    questionIds.forEach(questionId => {
      subTopicIds.forEach(subTopicId => {
        const value = parseFloat(this.getCompanyPreviewValue(questionId, subTopicId));
        if (!isNaN(value)) {
          total += value;
        }
      });
    });
    
    return total.toString();
  }

  /**
   * Check if company is selected
   */
  isCompanySelected(companyId: number): boolean {
    return this.selectedCompanies.some((st) => st === companyId);
  }

  /**
   * Handle file upload
   */
  onFileUpload(event: any, question: any, subTopicId: number, fileType: string) {
    const file = event.target.files[0];
    if (!file) return;

    console.log(`Uploading ${fileType} for question ${question.id}, subTopicId: ${subTopicId}`, file);

    this.performanceService.uploadDocument(file).subscribe({
      next: (response: any) => {
        if (response.status === "SUCCESS") {
          const fileUrl = response.fileUrl;
          console.log(`✅ File uploaded successfully: ${fileUrl}`);

          const controlName = `matrix_${question.id}_${subTopicId}`;
          const control = this.performanceForm.get(controlName);
          if (control) {
            control.setValue(fileUrl);
            console.log(`Form control '${controlName}' updated with: ${fileUrl}`);
          }
        }
      },
      error: (err) => {
        console.error("❌ File upload failed:", err);
      },
    });
  }

  /**
   * Check if we should show the preview
   */
  shouldShowStrengthPreview(): boolean {
    return this.shouldShowCompanyFilter() && 
           this.selectedCompanies.length > 0 &&
           this.currentTopic?.topicSubName === "Strength in all Coys";
  }

  /**
   * Get current topic ID
   */
  getCurrentTopicId(): number {
    return this.currentTopic?.id || this.topicId;
  }

  /**
   * Navigate to specific topic
   */
  navigateToTopic(topicId: number) {
    this.router.navigate([], {
      queryParams: {
        module: this.currentModule,
        topicId: topicId
      },
      queryParamsHandling: 'merge'
    });
  }
}