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

  // Add these properties to your component
private strengthTopicId: number = 4; // ID from your API
private companyTopicId: number = 117; // ID from your API
companyValuesCache: Map<number, Map<number, Map<number, number>>> = new Map(); // companyId -> questionId -> subTopicId -> value



  // Form and data properties
  previousMonthMin!: string;
  previousMonthMax!: string;
  performanceForm!: FormGroup;
  modules: ModuleDTO[] = [];
  currentModule: ModuleDTO | null = null;
  currentTopic: TopicDTO | null = null;
  userDistrict: string = "";
  monthYear: string = "";

  //  modules: any[] = [];
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
  // currentCompany: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private performanceService: PerformanceStatisticService,
    private apiService: ApiService,
    private navigationHelper: NavigationHelperService , // Add this
    private authService : AuthService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Get route parameters
    this.route.queryParams.subscribe((params) => {
      // Clear all data first
      // this.currentCompany = [];
      this.selectedCompanies = [];
      this.clearComponentData();
      // this.setPreviousMonthRange();

      this.moduleId = params["module"] ? parseInt(params["module"]) : 0;
      this.topicId = params["topic"] ? parseInt(params["topic"]) : 1;
      // console.log('Route params - Module:', params['module'], 'Topic:', params['topic']);
      console.log('Parsed - Module ID:', this.moduleId, 'Topic ID:', this.topicId);
      this.loadPerformanceData();
      this.loadCompanies();

      console.log(
        "Query Params → module =",
        this.moduleId,
        "topic =",
        this.topicId
      );
      console.log("Modules array =", this.modules);
    });
  }

  ngOnDestroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }


  getCurrentTopicId(): number {
  return this.currentTopic?.id || this.topicId;
}



  setMonthRange(year: number, month: number) {
    // month = 1–12
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

    // console.log('Component data cleared');
  }

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
           console.log('API Response received:', response);
          if (response.status === "SUCCESS" && response.data) {
            console.log('Performance Form Data:', response.data);
            this.processFormData(response.data);
          } else {
            // console.error('API Error:', response.message);
            this.errorMessage =
              response.message || "Failed to load performance data";
          }
          this.loading = false;
        },
        error: (error: any) => {
          // console.error('HTTP Error:', error);
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
    // console.log('Processing form data response:', data);z

    this.modules = data.modules || [];
    this.userDistrict = data.userDistrict || "";
    this.monthYear = data.monthYear || "";
    this.isSuccess = data.isSuccess || false;
    this.nextModule = data.nextModule || false;
    this.prevModule = data.prevModule || false;
    this.nextTopic = data.nextTopic || false;
    this.prevTopic = data.prevTopic || false;


    // Set current module and topic
    // Backend returns only the selected module, so always use index 0
    if (this.modules.length > 0) {
      this.currentModule = this.modules[0]; // Always use first (and only) module from response
     

      if (
        this.currentModule.topicDTOs &&
        this.currentModule.topicDTOs.length > 0
        
      ) {
        // Backend returns only the selected topic, so always use index 0
        this.currentTopic = this.currentModule.topicDTOs[0]; // FIX: Actually assign the current topic
        this.updateNavigationInfo();
    
       console.log("current module ",this.currentModule);
        console.log("current topic ",this.currentTopic);
        
    
        this.buildFormControls();

        // Setup auto-save after form is built
        this.setupAutoSave();
      } else {
        // console.log('No topics found in module');
        console.warn('No topics available for this module — attempting to skip to next');
        this.trySkipToNextAvailable();
      }
    } else {
      // console.log('No modules found in response');
      console.warn('No modules found in response — attempting to skip to next');
      this.trySkipToNextAvailable();
    }
  }


// Navigate to specific topic by ID
navigateToTopic(topicId: number) {
  this.router.navigate([], {
    queryParams: {
      module: this.currentModule,
      topicId: topicId
    },
    queryParamsHandling: 'merge' // Keep other params
  });

}


  /**
   * Try to skip to the next module/topic when the current one has no content.
   * Limits attempts to avoid infinite navigation loops.
   */
  private trySkipToNextAvailable(maxModuleSearch: number = 20, maxTopicsPerModule: number = 30): void {
    // Only one skip operation at a time
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
          // No data in this module - try next module
          moduleProbe++;
          setTimeout(probeModule, 100);
          return;
        }
        topicAttempts++;

        console.log(`Probing module=${moduleProbe}, topic=${topicProbe} (moduleAttempt=${moduleAttempts}, topicAttempt=${topicAttempts})`);

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
              // try next topic in this module
              topicProbe++;
              setTimeout(probeTopic, 120);
            }
          },
          error: (err: any) => {
            console.error('Probe request failed for', moduleProbe, topicProbe, err);
            // try next topic
            topicProbe++;
            setTimeout(probeTopic, 200);
          }
        });
      };

      probeTopic();
    };

    probeModule();
  }



  // chandani  4-12-25


calculateStrengthTotals(): void {
  // Only calculate if we're in the strength topic
  if (!this.isStrengthTopic()) {
//     return;
//   }
  if (this.currentTopic?.id !== this.strengthTopicId) {
    return;
  }

// calculateStrengthTotals(): void {
//   // Only calculate if we're in the strength topic
//   if (!this.isStrengthTopic()) {
//     return;
//   }

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
    // Map company topic questions to strength topic questions
    const companyQuestionId = this.getMatchingCompanyQuestionId(question.id);
    
    subTopics.forEach(subTopic => {
      // Map strength subtopics to company subtopics
      const companySubTopicId = this.getMatchingCompanySubTopicId(subTopic.id);
      
      if (companyQuestionId && companySubTopicId) {
        let total = 0;
         let calculationDetails: string[] = [];
        // Sum values from all selected companies
        this.selectedCompanies.forEach(companyId => {
          const value = this.getCompanyValue(companyId, companyQuestionId, companySubTopicId);
           calculationDetails.push(`Company ${companyId}: ${value}`);
          total += value;
        });
        
        // Update the strength topic control
        const controlName = `matrix_${question.id}_${subTopic.id}`;
        const control = this.performanceForm.get(controlName);
        if (control) {
          control.setValue(total.toString(), { emitEvent: false });
        }
      }
    });
  });
}
}
// Helper to get matching question IDs between topics
private getMatchingCompanyQuestionId(strengthQuestionId: number): number | null {
  // Map strength topic questions to company topic questions
  const questionMap: { [key: number]: number } = {
    664: 1078, // Sanctioned Posts -> Sanctioned
    665: 1079, // Actual numbers posted -> Available
    666: 1081, // Working elsewhere -> On Deputation
    667: 1082  // Actual number working -> Actually working in company
  };
  
  return questionMap[strengthQuestionId] || null;
}

// Helper to get matching subtopic IDs
private getMatchingCompanySubTopicId(strengthSubTopicId: number): number | null {
  // Map strength subtopics to company subtopics
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

// Get value from a specific company
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

// Method to cache company values
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
          
          // Store in cache
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







// Add this method to cache company values
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

// Update form value change listener
private setupValueChangeListener(): void {
  this.performanceForm.valueChanges.subscribe((formValues) => {
    // Cache company values when they change
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
      
      // Auto-calculate strength totals
      this.calculateStrengthTotals();
    }
  });
}
// Add this method to find the strength topic ID
getStrengthTopicId(): number | null {
  // Look for the topic with topicSubName = "Strength in all Coys"
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

// Add this method to check if we're on the strength topic
isStrengthTopic(): boolean {
  return this.currentTopic?.topicSubName === "Strength in all Coys";
}

navigateToStrengthTopic(): void {
  // 1. Cache current company values
  this.cacheCompanyValues();
  
  // 2. Navigate to strength topic
  const strengthTopicId = 4; // From your API
  
  this.router.navigate(['dashboard/performance'], {
    queryParams: { module: this.moduleId, topic: strengthTopicId }
  }).then(() => {
    // 3. After navigation, calculate and apply totals
    setTimeout(() => {
      if (this.isStrengthTopic()) {
        this.calculateStrengthTotals();
      }
    }, 1000); // Wait for page to load
  });
}


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


// Add to your component class
getPreviewQuestions(): any[] {
  if (!this.currentTopic || !this.shouldShowCompanyFilter()) return [];
  
  return (this.currentTopic.questions || []).map(q => ({
    id: q.id,
    // text: q.question
     text: this.getPreviewQuestionText(q.id), // Use custom text
    originalText: q.question // Keep original if needed

  }));
}

// Map company questions to strength summary display text
private getPreviewQuestionText(questionId: number): string {
  const questionTextMap: { [key: number]: string } = {
    1078: 'Sanctioned Posts', // Instead of just "Sanctioned"
    1079: 'Actual numbers posted in all Coys', // Instead of "Available"
    1080: 'Vacant Posts', // Instead of "Vacant"
    1081: 'How many of these working elsewhere from these Coys?', // More descriptive
    1082: 'Actual number working in Coys' // Instead of "Actually working in company"
  };
   return questionTextMap[questionId] || 'Unknown Question';
}
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

// END chandani  4-12-25


  // Load modules from API
  loadCompanies(): void {
    this.apiService.getCompanies().subscribe({
      next: (response) => {
        // Handle the API response structure
        if (response.status === "SUCCESS" && response.data) {
          this.company = response.data;
        }
      },
      error: (error) => {
        console.error("Error loading modules:", error);
      },
    });
  }

  private buildFormControls(): void {
    if (!this.currentTopic) {
      console.log("No current topic found");
      return;
    }

    console.log(
      "Building form controls for topic:",
      this.currentTopic.topicName
    );

    const formControls: { [key: string]: any } = {};


    // ===== NORMAL FORM =====
    if (this.currentTopic.formType === "NORMAL") {
      const questions = this.currentTopic.questionDTOs || [];

      questions.forEach((question) => {
        if (this.isDocumentType(question)) {
          formControls[`pdf_${question.id}`] = [null];
          formControls[`word_${question.id}`] = [null];
        } else if (question.type === "DATE") {
          // For date questions, we'll handle them dynamically based on police sabha count
          const policeSabhaCount = this.getInitialPoliceSabhaCount();
          if (policeSabhaCount > 0) {
            for (let i = 0; i < policeSabhaCount; i++) {
              formControls[`date_${question.id}_${i}`] = [
                "",
                Validators.required,
              ];
            }
          }
        } else {
          const controlName = `question_${question.id}`;
          const isCalculated =
            question.formula && question.formula.trim() !== "";

          if (isCalculated) {
            const calculatedValue = this.calculateInitialFormulaValue(question);
            formControls[controlName] = [
              { value: calculatedValue, disabled: true },
              question.type === "REQUIRED" ? [Validators.required] : [],
            ];
          } else {
            const initialValue =
              question.currentCount || question.defaultVal || "";
            formControls[controlName] = [
              initialValue,
              question.type === "REQUIRED" ? [Validators.required] : [],
            ];
          }
        }
      });
    }

 

    if (["Q/ST", "ST/Q"].includes(this.currentTopic.formType)) {
      const questions =
        this.currentTopic.questions || this.currentTopic.questionDTOs || [];
      const subTopics = this.currentTopic.subTopics || [];
      // Suppose currentTopic has questions
      // const questions = this.currentTopic.questionDTOs || [];

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
              // this.currentCompany.push(company);

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

if (this.currentTopic?.id === this.strengthTopicId) {
    // Initialize strength topic with calculated values
    const questions = this.currentTopic.questions || [];
    const subTopics = this.currentTopic.subTopics || [];
    
    questions.forEach(question => {
      const companyQuestionId = this.getMatchingCompanyQuestionId(question.id);
      
      subTopics.forEach(subTopic => {
        const companySubTopicId = this.getMatchingCompanySubTopicId(subTopic.id);
        const controlName = `matrix_${question.id}_${subTopic.id}`;
 if (companyQuestionId && companySubTopicId) {
          // Calculate total from all selected companies
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

  hasCumulativeQuestion(): boolean {
    return !!this.currentTopic?.questionDTOs?.some(
      (q) => q.isCumulative === true
    );
  }

  hasPreviousQuestion(): boolean {
    return !!this.currentTopic?.questionDTOs?.some(
      (q) => q.isPrevious === true
    );
  }

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
    if (topic.topicSubName == "No. of sessions") return "Training Session";
    if (topic.topicSubName == "Tradesmen, Ministerial, Supporting Staff")
      return "Rank";

    if (topic.topicSubName == "Earnings from monetized assets")
      return "Amenities";

    return "DETAILS";
  }

  //CHANDANI------------------------------------------------------------------

  // Add these properties to your component class
  selectedSubTopics: any[] = [];
  // showSubTopicFilter: boolean = false;
  // filteredSubTopics: any[] = [];

  // Add this method to check if we should show the filter
  shouldShowSubTopicFilter(): boolean {
    return this.currentTopic?.topicSubName === "Earnings from monetized assets"||
    this.currentTopic?.topicSubName === "Company's Deployment";
  }

  // Add this method to handle subtopic selection
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

  // Update the method to get subtopics for display - multiple selected ones
  getSubTopicsToDisplay(): any[] {
    if (this.shouldShowSubTopicFilter()) {
      return this.selectedSubTopics; // Return all selected subtopics
    }
    // For all other topics, return all subtopics
    return this.currentTopic?.subTopics || [];
  }

  // Helper method to check if a subtopic is selected
  isSubTopicSelected(subTopicId: number): boolean {
    return this.selectedSubTopics.some((st) => st.id === subTopicId);
  }

  // Select all subtopics
  selectAllSubTopics(): void {
    this.selectedSubTopics = [...(this.currentTopic?.subTopics || [])];
    this.updateSelectElement();
  }

  hasSelectedSubTopics(): boolean {
    if (this.shouldShowSubTopicFilter()) {
      return this.selectedSubTopics.length > 0;
    }
    // For non-filtered topics, always return true since we show all subtopics
    return true;
  }

  // Clear all selections
  clearAllSubTopics(): void {
    this.selectedSubTopics = [];
    this.updateSelectElement();
  }

  // Update the select element to reflect current selections
  private updateSelectElement(): void {
    // This method ensures the select element shows the current selections
    setTimeout(() => {
      const selectElement = document.getElementById(
        "subtopic-select"
      ) as HTMLSelectElement;
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
   * Setup automatic formula calculations when form values change
   */
  private setupFormulaCalculations(): void {
    if (!this.currentTopic || !this.performanceForm) {
      // console.log('setupFormulaCalculations: Missing currentTopic or performanceForm');
      return;
    }

    // console.log('setupFormulaCalculations: Setting up formula calculations for topic:', this.currentTopic.topicName);

    // Listen for form value changes
    this.performanceForm.valueChanges.subscribe((formValues) => {
      // console.log('Form values changed, triggering formula calculations:', formValues);
      this.updateCalculatedFields();
    });

    // Run initial calculation
    // console.log('Running initial formula calculations');
    this.updateCalculatedFields();
  }



private updateCalculatedFields(): void {
  if (!this.currentTopic) {
    return;
  }

  const questions = this.currentTopic.questionDTOs || this.currentTopic.questions || [];

  questions.forEach((question) => {
    if (question.formula) {
      const calculatedValue = this.calculateFormulaValue(question);

      if (this.currentTopic && this.currentTopic.formType === "NORMAL") {
        // For NORMAL forms, update the question control directly
        const formulaParts = question.formula.split("=");
        if (formulaParts.length === 2) {
          const targetRef = formulaParts[1].trim();
          const targetControlName = `question_${targetRef}`;
          const targetControl = this.performanceForm.get(targetControlName);

          if (targetControl) {
            console.log(
              `NORMAL form - Setting calculated value "${calculatedValue}" to control "${targetControlName}"`
            );
            targetControl.setValue(calculatedValue, { emitEvent: false });
          }
        }
      } else if (
        this.currentTopic &&
        (this.currentTopic.formType === "Q/ST" || this.currentTopic.formType === "ST/Q")
      ) {
        // For matrix forms, find the target field from the formula
        const formulaParts = question.formula.split("=");

        if (formulaParts.length === 2) {
          const targetRef = formulaParts[1].trim();
          const targetParts = targetRef.split("_");

          if (targetParts.length === 2) {
            // Matrix format: questionId_subTopicId
            const targetQuestionId = targetParts[0];
            const targetSubTopicId = targetParts[1];

            // Apply formula to ALL selected companies
            if (this.selectedCompanies.length > 0) {
              this.selectedCompanies.forEach((companyId) => {
                const targetControlName = `matrix_${companyId}_${targetQuestionId}_${targetSubTopicId}`;
                const targetControl = this.performanceForm.get(targetControlName);

                if (targetControl) {
                  console.log(
                    `Setting value "${calculatedValue}" for company ${companyId}, control "${targetControlName}"`
                  );
                  targetControl.setValue(calculatedValue, { emitEvent: false });
                } else {
                  console.warn(`Control not found: "${targetControlName}"`);
                }
              });
            } else {
              // If no companies selected, use the regular control name
              const targetControlName = `matrix_${targetQuestionId}_${targetSubTopicId}`;
              const targetControl = this.performanceForm.get(targetControlName);

              if (targetControl) {
                targetControl.setValue(calculatedValue, { emitEvent: false });
              }
            }
          } else if (targetParts.length === 1 && /^\d+$/.test(targetRef)) {
            // Simple question ID format: QID (like: 651-652=653)
            // Calculate for each subtopic individually for ALL companies
            const targetQuestionId = targetRef;

            if (this.currentTopic?.subTopics) {
              // Apply formula to ALL selected companies and ALL subtopics
              if (this.selectedCompanies.length > 0) {
                this.selectedCompanies.forEach((companyId) => {
                  this.currentTopic!.subTopics!.forEach((subTopic) => {
                    // Calculate formula value for this specific subtopic and company
                    // const columnCalculatedValue = this.calculateFormulaValueForColumn(question, subTopic.id);
                  const columnCalculatedValue = this.calculateFormulaValueForColumn(question, subTopic.id, companyId);  
                    // Create control name with the current company ID
                    const targetControlName = `matrix_${companyId}_${targetQuestionId}_${subTopic.id}`;
                    const targetControl = this.performanceForm.get(targetControlName);
                    
                    console.log(`Setting value "${columnCalculatedValue}" for company ${companyId}, control "${targetControlName}"`);

                    if (targetControl) {
                      targetControl.setValue(columnCalculatedValue, {
                        emitEvent: false,
                      });
                    }
                  });
                });
              } else {
                // If no companies selected, apply to regular controls
                this.currentTopic.subTopics.forEach((subTopic) => {
                  const columnCalculatedValue = this.calculateFormulaValueForColumn(question, subTopic.id);
                  const targetControlName = `matrix_${targetQuestionId}_${subTopic.id}`;
                  const targetControl = this.performanceForm.get(targetControlName);

                  if (targetControl) {
                    targetControl.setValue(columnCalculatedValue, {
                      emitEvent: false,
                    });
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
   * Check if a question is calculated by a formula in NORMAL forms
   */
  isCalculatedFieldNormal(questionId: number): boolean {
    if (!this.currentTopic || this.currentTopic.formType !== "NORMAL")
      return false;

    const questions =
      this.currentTopic.questionDTOs || this.currentTopic.questions || [];
    const question = questions.find((q) => q.id === questionId);

    return !!(question && question.formula && question.formula.trim() !== "");
  }

  /**
   * Check if a specific field is calculated by a formula (for matrix forms)
   */
  isCalculatedField(questionId: number, subTopicId: number): boolean {
    if (!this.currentTopic) return false;

    const questions =
      this.currentTopic.questionDTOs || this.currentTopic.questions || [];
    const targetRef = `${questionId}_${subTopicId}`;

    // Check if any question has a formula that calculates this field
    const isCalculated = questions.some((question) => {
      if (!question.formula) return false;

      const formulaParts = question.formula.split("=");
      if (formulaParts.length === 2) {
        const formulaTargetRef = formulaParts[1].trim();
        return formulaTargetRef === targetRef;
      }
      return false;
    });

    if (isCalculated) {
      // console.log(`Field ${targetRef} is calculated`);
    }

    return isCalculated;
  }

  /**
   * Debug method to manually trigger formula calculations (for testing)
   */
  debugFormulas(): void {
    // console.log('=== FORMULA DEBUG START ===');
    // console.log('Current topic:', this.currentTopic?.topicName);
    // console.log('Form type:', this.currentTopic?.formType);

    if (this.currentTopic) {
      const questions =
        this.currentTopic.questionDTOs || this.currentTopic.questions || [];
      // console.log('Total questions:', questions.length);

      const formulaQuestions = questions.filter((q) => q.formula);
      // console.log('Questions with formulas:', formulaQuestions.length);

      formulaQuestions.forEach((question) => {
        // console.log(`Question ${question.id}: "${question.question}"`);
        // console.log(`Formula: "${question.formula}"`);
        const result = this.calculateFormulaValue(question);
        // console.log(`Result: "${result}"`);
        // console.log('---');
      });
    }

    // console.log('Current form controls:');
    if (this.performanceForm) {
      Object.keys(this.performanceForm.controls).forEach((key) => {
        const control = this.performanceForm.get(key);
        // console.log(`${key}: ${control?.value}`);
      });
    }

    // console.log('=== FORMULA DEBUG END ===');
  }

  /**
   * Setup auto-save functionality
   */
  private setupAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      if (this.performanceForm.dirty && !this.saving) {
        this.autoSave();
      }
    }, 30000); // Auto-save every 30 seconds
  }

  /**
   * Auto-save form data
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
              // console.log('Auto-saved successfully');
            }
          },
          error: (error: any) => console.error("Auto-save failed:", error),
        });
    }
  }

  /**
   * Save form data
   */
  saveForm(): void {
    if (!this.performanceForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;
    const statistics = this.prepareStatisticsData("SAVED");

    this.performanceService
      .saveStatistics({ performanceStatistics: statistics })
      .subscribe({
        next: (response: ApiResponse) => {
          if (response.status === "SUCCESS") {
            this.successMessage = "Form saved successfully";
            this.performanceForm.markAsPristine();
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

  onFileSelect(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    console.log(`File selected for ${controlName}:`, file.name);

    // Update form control
    this.performanceForm.get(controlName)?.setValue(file);
    this.performanceForm.get(controlName)?.markAsDirty();

    if (!this.performanceForm.get(controlName)) {
      console.warn(
        `⚠️ Control '${controlName}' does NOT exist in the form group!`
      );
    }

    // Immediately upload file
    this.performanceService.uploadDocument(file).subscribe({
      next: (response: any) => {
        if (response.status === "SUCCESS") {
          const fileUrl = response.fileUrl; // Backend returns this
          console.log("Uploaded file URL:", fileUrl);

          // Set form control to file URL
          this.performanceForm.get(controlName)?.setValue(fileUrl);
        }
      },
      error: (err) => {
        console.error("File upload failed:", err);
      },
    });
  }

  /**
   * Submit form with OTP verification
   */
  submitForm(): void {
    if (!this.performanceForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    // First save the form data
    this.saving = true;
    const statistics = this.prepareStatisticsData("SUBMITTED");

    this.performanceService
      .saveStatistics({ performanceStatistics: statistics })
      .subscribe({
        next: (response: ApiResponse) => {
          if (response.status === "SUCCESS") {
            // Send OTP
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
   * Send OTP for verification
   */
  sendOTP(): void {
    this.performanceService.sendOTP().subscribe({
      next: (response: ApiResponse) => {
        if (response.status === "SUCCESS") {
          this.showOTPModal = true;
          this.successMessage =
            "OTP sent successfully to your registered mobile number";
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
   * Verify OTP and complete submission
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
          // Navigate to next topic or module if available
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
   * Prepare statistics data for submission
   */

  // private prepareStatisticsData(status: string): PerformanceStatistic[] {
  //   const statistics: PerformanceStatistic[] = [];
  //   const formValues = this.performanceForm.value;

  //   console.log("Preparing statistics data with status:", status);
  //   console.log("Form values:", formValues);

  //   const questions =
  //     this.currentTopic?.questions || this.currentTopic?.questionDTOs || [];

  //   if (this.currentTopic?.formType === "NORMAL") {
  //     questions.forEach((question) => {
  //       if (this.isDocumentType(question)) {
  //         const pdfFile = formValues[`pdf_${question.id}`];
  //         const wordFile = formValues[`word_${question.id}`];

  //         [pdfFile, wordFile].forEach((fileValue) => {
  //           if (fileValue) {
  //             statistics.push({
  //               questionId: question.id,
  //               value: fileValue,
  //               topicId: this.currentTopic!.id,
  //               moduleId: this.currentModule!.id,
  //               status,
  //             });
  //           }
  //         });
  //       } else {
  //         const value = formValues[`question_${question.id}`];
  //         if (
  //           value !== undefined &&
  //           value !== null &&
  //           (value !== "" || value === 0 || value === "0")
  //         ) {
  //           statistics.push({
  //             questionId: question.id,
  //             value: value.toString(),
  //             topicId: this.currentTopic!.id,
  //             moduleId: this.currentModule!.id,
  //             status,
  //           });
  //         }
  //       }
  //     });
  //   }

  //   if (["Q/ST", "ST/Q"].includes(this.currentTopic?.formType ?? "")) {
  //     questions.forEach((question) => {
  //       this.currentTopic?.subTopics?.forEach((subTopic) => {
  //         if (this.isDocumentType(question)) {
  //           const pdfControlName = `pdf_${question.id}_${subTopic.id}`;
  //           const wordControlName = `word_${question.id}_${subTopic.id}`;

  //           const pdfFile = formValues[pdfControlName];
  //           const wordFile = formValues[wordControlName];

  //           [pdfFile, wordFile].forEach((fileValue) => {
  //             if (fileValue) {
  //               statistics.push({
  //                 questionId: question.id,
  //                 subTopicId: subTopic.id,
  //                 value: fileValue,
  //                 topicId: this.currentTopic!.id,
  //                 moduleId: this.currentModule!.id,
  //                 status,
  //               });
  //             }
  //           });
  //         } else {
  //           const controlName = `matrix_${question.id}_${subTopic.id}`;
  //           const value = formValues[controlName];
  //           statistics.push({
  //             questionId: question.id,
  //             subTopicId: subTopic.id,
  //             value: value.toString(),
  //             topicId: this.currentTopic!.id,
  //             moduleId: this.currentModule!.id,
  //             status,
  //           });
  //         }
  //       });
  //     });
  //   }

  //   console.log("✅ Final prepared statistics:", statistics);
  //   return statistics;
  // }


  private prepareStatisticsData(status: string): PerformanceStatistic[] {
  const statistics: PerformanceStatistic[] = [];
  const formValues = this.performanceForm.value;

  console.log('Preparing statistics data with status:', status);
  console.log('Form values:', formValues);

  const questions = this.currentTopic?.questions || this.currentTopic?.questionDTOs || [];

  if (this.currentTopic?.formType === 'NORMAL') {
    questions.forEach(question => {
      if (this.isDocumentType(question)) {
        const pdfFile = formValues[`pdf_${question.id}`];
        const wordFile = formValues[`word_${question.id}`];

        [pdfFile, wordFile].forEach(fileValue => {
          if (fileValue) {
            statistics.push({
              companyId: null,
              questionId: question.id,
              value: fileValue,
              topicId: this.currentTopic!.id,
              moduleId: this.currentModule!.id,
              status,
            });
          }
        });
      } else {
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
      }
    });
  }

  if (['Q/ST', 'ST/Q'].includes(this.currentTopic?.formType ?? '')) {

  const hasCompanies = this.selectedCompanies && this.selectedCompanies.length > 0;

  questions.forEach(question => {

const companiesToLoop = hasCompanies ? this.selectedCompanies : [ null ];
    console.log("company",companiesToLoop);
    
    companiesToLoop.forEach(company => {

      this.currentTopic?.subTopics?.forEach(subTopic => {

        // --------------------------------------------------------------------
        // DOCUMENT TYPE (PDF/WORD)
        // --------------------------------------------------------------------
        if (this.isDocumentType(question)) {

          const pdfControlName = hasCompanies
            ? `pdf_${company}_${question.id}_${subTopic.id}`
            : `pdf_${question.id}_${subTopic.id}`;

          const wordControlName = hasCompanies
            ? `word_${company}_${question.id}_${subTopic.id}`
            : `word_${question.id}_${subTopic.id}`;

          const pdfFile = formValues[pdfControlName];
          const wordFile = formValues[wordControlName];

          [pdfFile, wordFile].forEach(fileValue => {
            if (fileValue) {
              statistics.push({
               companyId: company ,
                questionId: question.id,
                subTopicId: subTopic.id,
                value: fileValue,
                topicId: this.currentTopic!.id,
                moduleId: this.currentModule!.id,
                status,
              });
            }
          });

        } 
        // --------------------------------------------------------------------
        // NORMAL MATRIX TYPE
        // --------------------------------------------------------------------
        else {

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
        }
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
      console.log(
        `Should show date fields for question ${question.id}: ${shouldShow}`
      );
      return shouldShow;
    }
    return false;
  }

  /**
   * Get Police Sabha count from form
   */
  getPoliceSabhaCount(): number {
    const policeSabhaQuestion = this.currentTopic?.questionDTOs?.find(
      (q) => q.question?.includes("No. of Police Sabha") || q.id === 1
    );

    if (policeSabhaQuestion) {
      const controlName = `question_${policeSabhaQuestion.id}`;
      const control = this.performanceForm.get(controlName);
      const count = control ? parseInt(control.value) || 0 : 0;
      console.log(`Police Sabha count: ${count}`);
      return count;
    }
    return 0;
  }

  /**
   * Get initial Police Sabha count from API data (before form is built)
   */
  private getInitialPoliceSabhaCount(): number {
    const policeSabhaQuestion = this.currentTopic?.questionDTOs?.find(
      (q) => q.question?.includes("No. of Police Sabha") || q.id === 1
    );

    if (policeSabhaQuestion) {
      // Get count from currentCount (API data) instead of form control
      const count = parseInt(policeSabhaQuestion.currentCount) || 0;
      console.log(`Initial Police Sabha count from API: ${count}`);
      return count;
    }
    return 0;
  }

  /**
   * Get array for generating multiple date fields
   */
  getDateFieldsArray(): any[] {
    const count = this.getPoliceSabhaCount();
    console.log(`Date fields array count: ${count}`);
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
          return true; // Duplicate found
        }
        dates.push(control.value);
      }
    }

    return false;
  }

  /**
   * Get colspan for date field based on table structure
   */
  getDateFieldColspan(): number {
    let colspan = 1;

    if (this.hasPreviousQuestion()) colspan++;
    if (this.hasCumulativeQuestion()) colspan++;

    return colspan;
  }

  /**
   * Update date fields based on count
   */
  updateDateFields(count: number): void {
    const dateQuestion = this.currentTopic?.questionDTOs?.find(
      (q) => q.type === "DATE"
    );

    if (!dateQuestion) {
      console.log("No date question found");
      return;
    }

    console.log(
      `Updating date fields for question ${dateQuestion.id}, count: ${count}`
    );

    // Remove old date controls
    this.removeDateControls(dateQuestion.id);

    // Add new date controls
    if (count > 0) {
      this.addDateControls(dateQuestion.id, count);
    }
    this.dateFieldsCount = count;
  }

  /**
   * Clear all date fields
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
   * Remove all date controls for a question
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
   * Add date controls dynamically
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
   * Handle Police Sabha count changes
   */
  onPoliceSabhaCountChange(event: any, questionId: number): void {
    const policeSabhaQuestion = this.currentTopic?.questionDTOs?.find(
      (q) => q.question?.includes("No. of Police Sabha") || q.id === 1
    );

    if (policeSabhaQuestion && policeSabhaQuestion.id === questionId) {
      const newCount = parseInt(event.target.value) || 0;
      console.log(`Police Sabha count changed to: ${newCount}`);

      // Update date fields dynamically
      this.updateDateFields(newCount);

      // Clear dates if count is 0
      if (newCount === 0) {
        this.clearDateFields();
      }
    }
  }

  /**
   * Mark all form controls as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.performanceForm.controls).forEach((key) => {
      this.performanceForm.get(key)?.markAsTouched();
    });
  }

 
nextNavInfo: { moduleId: number, topicId: number } | null = null;
prevNavInfo: { moduleId: number, topicId: number } | null = null;
navigationInfo: any = null;


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

        // Show message if moving to different module
        if (nextTarget.isSameModule === false) {
          this.successMessage = `Moving to next module: ${this.getModuleName(nextTarget.moduleId)}`;
          console.log('Module transition detected:', nextTarget);
        }

        // Navigate to the target
        this.router.navigate(['dashboard/performance'], {
          queryParams: { 
            module: nextTarget.moduleId, 
            topic: nextTarget.topicId 
          },
          queryParamsHandling: 'merge'
        }).then(() => {
          // Optional: Show a brief message about the transition
          if (nextTarget.isSameModule === false) {
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          }
        });
      } else {
        // No next target found - completed all modules
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


getModuleName(moduleId: number): string {
  if (!this.modules || this.modules.length === 0) {
    return `Module ${moduleId}`;
  }
  
  const module = this.modules.find(m => m.id === moduleId);
  return module?.moduleName || `Module ${moduleId}`;
}
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

// Update navigation info in processFormData
private updateNavigationInfo(): void {
  if (!this.currentTopic) return;
  
  this.navigationHelper.getNavigationInfo(this.moduleId, this.currentTopic.id).subscribe({
    next: (info) => {
      this.nextNavInfo = info.next;
      this.prevNavInfo = info.prev;
      this.navigationInfo = info;
      
      // Update UI flags
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
   * Navigate to next module
   */

  goToNextModule() {
    if (this.nextModule) {
  let increment =1;
    const roleName = this.authService.getUserRoleName();
  

    console.log('Role name raw:', `"${roleName}"`);
    console.log('Role name length:', roleName?.length);


    if (this.moduleId === 21 && roleName === 'Special Reserved Battalion') {
      increment = 2;
    }
      // Your routing logic here, e.g.:
      this.router.navigate(["dashboard/performance"], {
        queryParams: { module: this.moduleId + increment, topic: 1 },
      });
    }
  }
  /**
   * Navigate to previous module
   */

  goToPreviousModule() {
    if (this.prevModule) {


      let decrement =1;
        const roleName = this.authService.getUserRoleName();
  
    if (this.moduleId === 23 && roleName === 'Special Reserved Battalion') {
      decrement = 2;
    }
    // Check by role ID instead of role name
    
      const currentModuleId = Number(this.moduleId);
      const prevModule = this.modules[currentModuleId - decrement];
      const lastTopicId = prevModule?.topicDTOs?.length || 1;


      this.router.navigate(["dashboard/performance"], {
        queryParams: { module: currentModuleId - decrement, topic: lastTopicId },
      });
    }
  }

  /**
   * Get form control value
   */
  getFormValue(controlName: string): any {
    return this.performanceForm.get(controlName)?.value || "";
  }



getMatrixValue(questionId: number, subTopicId: number, companyId?: number): string {
  // If specific companyId provided, use it
  if (companyId !== undefined) {
    const keyWithCompId = `matrix_${companyId}_${questionId}_${subTopicId}`;
    const value = this.performanceForm.get(keyWithCompId)?.value;
    if (value !== undefined && value !== null) {
      return value.toString();
    }
  }

  // If companies are selected, try each one
  if (this.selectedCompanies.length > 0) {
    for (const compId of this.selectedCompanies) {
      const keyWithCompId = `matrix_${compId}_${questionId}_${subTopicId}`;
      const value = this.performanceForm.get(keyWithCompId)?.value;
      if (value !== undefined && value !== null) {
        return value.toString();
      }
    }
  }

  // Fallback to control without company ID
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
   * Format question text for display
   */
  formatQuestionText(question: QuestionDTO): string {
    let text = question.question || "";

    // Replace placeholders with actual values
    text = text.replace(/\{userDistrict\}/g, this.userDistrict);
    text = text.replace(/\{monthYear\}/g, this.monthYear);

    return text;
  }

  /**
   * Calculate initial formula value using currentCount from API data (before form is built)
   */
  private calculateInitialFormulaValue(question: QuestionDTO): string {
    if (!question.formula) {
      return question.currentCount || question.defaultVal || "";
    }

    try {
      // Split the formula by '=' to get the calculation part
      const formulaParts = question.formula.split("=");
      if (formulaParts.length !== 2) {
        return question.currentCount || question.defaultVal || "";
      }

      let calculationExpression = formulaParts[0].trim();

      // Replace question IDs with their currentCount values from API
      if (this.currentTopic?.questionDTOs) {
        this.currentTopic.questionDTOs.forEach((q) => {
          const questionIdPattern = new RegExp(`\\b${q.id}\\b`, "g");

          if (questionIdPattern.test(calculationExpression)) {
            const valueToUse = parseFloat(q.currentCount || "0") || 0;
            console.log(
              `Initial calculation - Replacing ${q.id} with currentCount: ${valueToUse}`
            );
            calculationExpression = calculationExpression.replace(
              questionIdPattern,
              valueToUse.toString()
            );
          }
        });
      }

      // Evaluate the expression
      if (!/^[\d\s+\-*/().]+$/.test(calculationExpression)) {
        return question.currentCount || question.defaultVal || "";
      }

      const result = eval(calculationExpression);
      const resultString = result.toString();
      console.log(
        `Initial formula calculation for question ${question.id}: ${question.formula} = ${resultString}`
      );
      return resultString;
    } catch (error) {
      console.error("Initial formula calculation error:", error);
      return question.currentCount || question.defaultVal || "";
    }
  }


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

    // For QID format formulas, replace question IDs with their values for this specific subtopic and company
    if (this.currentTopic?.questions || this.currentTopic?.questionDTOs) {
      const questions = this.currentTopic.questions || this.currentTopic.questionDTOs || [];

      questions.forEach((q) => {
        const questionIdPattern = new RegExp(`\\b${q.id}\\b`, "g");

        if (questionIdPattern.test(calculationExpression)) {
          // Get the value for this question, subtopic, and company
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
   * Calculate formula-based values
   */
  calculateFormulaValue(question: QuestionDTO): string {
    if (!question.formula) {
      // console.log(`No formula for question ${question.id}`);
      return question.defaultVal || "";
    }

    try {
      // console.log(`Calculating formula for question ${question.id}:`, question.formula);

      // Split the formula by '=' to get the calculation part (left side) and target (right side)
      const formulaParts = question.formula.split("=");
      if (formulaParts.length !== 2) {
        // console.error('Invalid formula format - should contain exactly one "=" sign:', question.formula);
        return question.defaultVal || "";
      }

      // Get the calculation expression (left side of =)
      let calculationExpression = formulaParts[0].trim();
      const targetRef = formulaParts[1].trim();

      // console.log('Calculation expression:', calculationExpression);
      // console.log('Target reference:', targetRef);

      const formValues = this.performanceForm.value;
      // console.log('Current form values:', formValues);

      // Replace matrix references (questionId_subTopicId) and simple question references (QID) in calculation expression
      Object.keys(formValues).forEach((key) => {
        if (key.startsWith("matrix_")) {
          // Extract questionId and subTopicId from key like 'matrix_483_36'
          const parts = key.replace("matrix_", "").split("_");
          if (parts.length === 2) {
            const questionId = parts[0];
            const subTopicId = parts[1];
            const formulaRef = `${questionId}_${subTopicId}`;

            // Replace all occurrences of this reference in the calculation expression
            const value = formValues[key] || "0";
            // console.log(`Replacing ${formulaRef} with ${value} in expression`);
            calculationExpression = calculationExpression.replace(
              new RegExp(`\\b${formulaRef}\\b`, "g"),
              value
            );
          }
        }
      });

      // Handle simple question ID references based on form type
      if (this.currentTopic?.questionDTOs) {
        this.currentTopic.questionDTOs.forEach((q) => {
          const questionIdPattern = new RegExp(`\\b${q.id}\\b`, "g");

          // Check if this question ID appears in the calculation expression
          if (questionIdPattern.test(calculationExpression)) {
            let valueToReplace = 0;

            if (this.currentTopic?.formType === "NORMAL") {
              // For NORMAL forms, use form control values or currentCount from API
              const controlName = `question_${q.id}`;
              const controlValue = formValues[controlName];
              valueToReplace =
                controlValue !== undefined && controlValue !== ""
                  ? parseFloat(controlValue) || 0
                  : parseFloat(q.currentCount || "0") || 0;

              console.log(
                `NORMAL form - Replacing question ID ${q.id} with value: ${valueToReplace} (control: ${controlValue}, currentCount: ${q.currentCount})`
              );
            } else {
              // For matrix forms (Q/ST, ST/Q), calculate row totals
              valueToReplace = this.calculateRowTotal(q.id);
              console.log(
                `Matrix form - Replacing question ID ${q.id} with row total: ${valueToReplace}`
              );
            }

            calculationExpression = calculationExpression.replace(
              new RegExp(`\\b${q.id}\\b`, "g"),
              valueToReplace.toString()
            );
          }
        });
      }

      // console.log('Expression after substitution:', calculationExpression);

      // Clean up the expression - ensure it's safe for evaluation
      if (!/^[\d\s+\-*/().]+$/.test(calculationExpression)) {
        // console.error('Invalid characters in calculation expression:', calculationExpression);
        return question.defaultVal || "";
      }

      // Evaluate arithmetic expression
      const result = eval(calculationExpression);
      const resultString = result.toString();
      // console.log('Formula calculation result:', resultString);
      return resultString;
    } catch (error) {
      // console.error('Formula calculation error:', error);
      // console.error('Original formula:', question.formula);
      return question.defaultVal || "";
    }
  }

  /**
   * Calculate row total for Q/ST matrix
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
   * Calculate column total for Q/ST matrix
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
   * Calculate subtopic total for ST/Q matrix
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
   * Calculate question total for ST/Q matrix
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
   * Calculate grand total for matrix
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
   * Get cumulative value for a question (for NORMAL forms)
   */
  getCumulativeValue(question: QuestionDTO): string {
    // For calculated fields, use the current form control value
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

    // For regular fields, use finYearCount from API or current form value
    const controlName = `question_${question.id}`;
    const control = this.performanceForm.get(controlName);
    if (control) {
      const currentValue = control.value;
      // If form has a value, use it; otherwise fallback to finYearCount
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

  // sonam

  hasDocumentType(): boolean {
    return !!this.currentTopic?.questionDTOs?.some(
      (q) => q.type === "PDF_DOCUMENT" || q.type === "WORD_DOCUMENT"
    );
  }

  isDocumentType(question: any): boolean {
    return (
      question.type === "PDF_DOCUMENT" || question.type === "WORD_DOCUMENT"
    );
  }

  // Method to check if we should show the preview
shouldShowStrengthPreview(): boolean {
  return this.shouldShowCompanyFilter() && 
         this.selectedCompanies.length > 0 &&
         this.currentTopic?.topicSubName === "Strength in all Coys";
}
  shouldShowCompanyFilter(): boolean {
  const formType = this.currentTopic?.formType;
  const isMatrixForm = formType === 'Q/ST' || formType === 'ST/Q';
  
  return isMatrixForm && this.currentTopic?.topicSubName === "Strength in all Coys";
}
  // Add this method to handle company selection
  onCompanySelect(event: any) {
    const selectedOptions = Array.from(event.target.selectedOptions).map(
      (o: any) => Number(o.value)
    );
    this.loadPerformanceData();
    this.selectedCompanies = selectedOptions;
    console.log("selected Company", this.selectedCompanies);
  }
  getCompanyName(id: number) {
    return this.company.find((c) => c.id === id)?.companyName || "";
  }

  // Get value for a specific question and subtopic across all companies
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

// Get total for a specific question across all subtopics
getQuestionTotalPreview(questionId: number): string {
  if (!this.currentTopic?.subTopics) return "0";
  
  let total = 0;
  const subTopicIds = [285, 286, 287, 288, 289, 290]; // Company subtopic IDs
  
  subTopicIds.forEach(subTopicId => {
    const value = parseFloat(this.getCompanyPreviewValue(questionId, subTopicId));
    if (!isNaN(value)) {
      total += value;
    }
  });
  
  return total.toString();
}

// Get total for a specific subtopic across all questions
getSubTopicTotalPreview(subTopicId: number): string {
  const questionIds = [1078, 1079, 1080, 1081, 1082]; // Company question IDs
  
  let total = 0;
  questionIds.forEach(questionId => {
    const value = parseFloat(this.getCompanyPreviewValue(questionId, subTopicId));
    if (!isNaN(value)) {
      total += value;
    }
  });
  
  return total.toString();
}

// Get grand total across all questions and subtopics
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

  isCompanySelected(companyId: number): boolean {
    return this.selectedCompanies.some((st) => st === companyId);
  }

  onFileUpload(
    event: any,
    question: any,
    subTopicId: number,
    fileType: string
  ) {
    const file = event.target.files[0];
    if (!file) return;

    console.log(
      `Uploading ${fileType} for question ${question.id}, subTopicId: ${subTopicId}`,
      file
    );

    this.performanceService.uploadDocument(file).subscribe({
      next: (response: any) => {
        if (response.status === "SUCCESS") {
          const fileUrl = response.fileUrl;
          console.log(`✅ File uploaded successfully: ${fileUrl}`);

          // Form control name — e.g. "matrix_979_232"
          const controlName = `matrix_${question.id}_${subTopicId}`;

          // Check if control exists and update it
          const control = this.performanceForm.get(controlName);
          if (control) {
            control.setValue(fileUrl);
            console.log(
              `Form control '${controlName}' updated with: ${fileUrl}`
            );
          } else {
            console.warn(`⚠️ Form control '${controlName}' not found.`);
          }
        }
      },
      error: (err) => {
        console.error("❌ File upload failed:", err);
      },
    });
  }
}
