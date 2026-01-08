import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiResponse<T = any> {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: T;
  error?: string;
}



export interface PerformanceFormResponse {
  modules: ModuleDTO[];
  userDistrict: string;
  monthYear: string;
  
  isSuccess: boolean;
  nextModule: boolean;
  prevModule: boolean;
  nextTopic: boolean;
  prevTopic: boolean;
}

export interface ModuleDTO {
  id: number;
  moduleName: string;
  priority: number;
  isDisabled: boolean;
  topicDTOs: TopicDTO[];
}

export interface TopicDTO {
  id: number;
  topicName: string;
  topicSubName: string;
  formType: string;
  moduleId: number;
  isShowPrevious: boolean;
  isShowCummulative: boolean;
  questionDTOs: QuestionDTO[];
  questions: QuestionDTO[];
  subTopics: SubTopicDTO[];
  priority?:number;
  nextTopic: boolean;
  prevTopic: boolean;
}

export interface QuestionDTO {
  defaultQue: any;
  id: number;
  tId: number;
  question: string;
  type: string;
  topicId: number;
  subTopicId?: number;
  subtopicName?: string;
  moduleId: number;
  formula?: string;
  defaultVal: string;
  previousCount?: string;
  currentCount: string;
  finYearCount?: string;
  isDisabled: boolean;
  isPrevious: boolean;
  isCumulative: boolean;
  checkID?: string;
  currentCountList?: string[];
  ISNew?: boolean;
  
}

export interface SubTopicDTO {
  id: number;
  subTopicName: string;
  isDisabled: boolean;
}

export interface PerformanceStatistic {
  companyId: number | null;
  questionId: number;
  value: string;
  topicId: number;
  subTopicId?: number;
  moduleId: number;
  status: string;
  
}

export interface SaveStatisticsRequest {
  performanceStatistics: PerformanceStatistic[];
}

export interface OTPRequest {
  otp: string;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceStatisticService {
  private readonly baseUrl = `${environment.apiUrl}performance-statistics`;
  private readonly uploadUrl = `${environment.apiUrl}upload`;

private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  constructor(private http: HttpClient) {}

  /**
   * Get performance form data with module and topic parameters
   * @param moduleId - Module ID (0-based index)
   * @param topicId - Topic ID (1-based index)
   * @returns Observable<ApiResponse<PerformanceFormResponse>>
   */
  getPerformanceForm(moduleId: number = 0, topicId: number = 1): Observable<ApiResponse<PerformanceFormResponse>> {
    const params = new HttpParams()
      .set('module', moduleId.toString())
      .set('topic', topicId.toString());

    return this.http.get<ApiResponse<PerformanceFormResponse>>(`${this.baseUrl}/performance`, { params });
  }

  //   getPerformanceForm(moduleId: number, topicId: number): Observable<ApiResponse<PerformanceFormResponse>> {
  //   return this.http.get<ApiResponse<PerformanceFormResponse>>(
  //     `${this.baseUrl}/performance?module=${moduleId}&topic=${topicId}`,
  //     { headers: this.getHeaders() }
  //   );
  // }


  //  // New navigation methods
  // getNextTopic(moduleId: number, topicId: number): Observable<ApiResponse<{ moduleId: number, topicId: number }>> {
  //   return this.http.get<ApiResponse<{ moduleId: number, topicId: number }>>(
  //     `${this.baseUrl}/next/${moduleId}/${topicId}`,
  //     { headers: this.getHeaders() }
  //   );
  // }

  // getPreviousTopic(moduleId: number, topicId: number): Observable<ApiResponse<{ moduleId: number, topicId: number }>> {
  //   return this.http.get<ApiResponse<{ moduleId: number, topicId: number }>>(
  //     `${this.Url}/previous/${moduleId}/${topicId}`,
  //     { headers: this.getHeaders() }
  //   );
  // }

  /**
   * Get performance form data by specific module and topic IDs
   * @param moduleId - Module ID
   * @param topicId - Topic ID
   * @returns Observable<ApiResponse<PerformanceFormResponse>>
   */
  getPerformanceFormByModuleTopic(moduleId: number, topicId: number): Observable<ApiResponse<PerformanceFormResponse>> {
    return this.http.get<ApiResponse<PerformanceFormResponse>>(
      `${this.baseUrl}/performance/module/${moduleId}/topic/${topicId}`
    );
  }


  // getNavigationInfo(moduleId: number, topicId: number): Observable<ApiResponse<any>> {
  //   return this.http.get<ApiResponse<any>>(
  //     `${this.apiUrl}/navigation-info/${moduleId}/${topicId}`,
  //     { headers: this.getHeaders() }
  //   );
  // }
  /**
   * Save performance statistics data
   * @param request - Save request containing performance statistics
   * @returns Observable<ApiResponse>
   */
  saveStatistics(request: SaveStatisticsRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/save-statistics`, request);
  }

  /**
   * Send OTP for verification
   * @returns Observable<ApiResponse>
   */
  sendOTP(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/sent-otp`, {});
  }

  /**
   * Verify OTP and complete submission
   * @param otp - OTP string
   * @returns Observable<ApiResponse>
   */
  verifyOTP(otp: string): Observable<ApiResponse> {
    const request: OTPRequest = { otp };
    return this.http.post<ApiResponse>(`${this.baseUrl}/verify-otp`, request);
  }

  /**
   * Make performance statistic active/inactive
   * @param id - Performance statistic ID
   * @param active - Active status
   * @returns Observable<ApiResponse>
   */
  makeActive(id: number, active: boolean = true): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/${id}/make-active`, { active });
  }

  /**
   * Get performance statistics list with filters
   * @param filters - Filter parameters
   * @returns Observable<ApiResponse>
   */
  getPerformanceStatistics(filters: any = {}): Observable<ApiResponse> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params = params.set(key, filters[key].toString());
      }
    });

    return this.http.get<ApiResponse>(`${this.baseUrl}`, { params });
  }

  /**
   * Get performance statistic by ID
   * @param id - Performance statistic ID
   * @returns Observable<ApiResponse>
   */
  getPerformanceStatisticById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create new performance statistic
   * @param data - Performance statistic data
   * @returns Observable<ApiResponse>
   */
  createPerformanceStatistic(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}`, data);
  }

  /**
   * Update performance statistic
   * @param id - Performance statistic ID
   * @param data - Update data
   * @returns Observable<ApiResponse>
   */
  updatePerformanceStatistic(id: number, data: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Delete performance statistic
   * @param id - Performance statistic ID
   * @returns Observable<ApiResponse>
   */
  deletePerformanceStatistic(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Bulk save performance statistics
   * @param statistics - Array of performance statistics
   * @returns Observable<ApiResponse>
   */
  bulkSaveStatistics(statistics: any[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/bulk-save`, { statistics });
  }

  /**
   * Get performance statistics by user ID
   * @param userId - User ID
   * @returns Observable<ApiResponse>
   */
  getByUserId(userId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/user/${userId}`);
  }

  /**
   * Get performance statistics by user ID and month
   * @param userId - User ID
   * @param monthYear - Month year string
   * @returns Observable<ApiResponse>
   */
  getByUserIdAndMonth(userId: number, monthYear: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/user/${userId}/month/${monthYear}`);
  }

  /**
   * Get performance statistics summary
   * @param filters - Filter parameters
   * @returns Observable<ApiResponse>
   */
  getSummary(filters: any = {}): Observable<ApiResponse> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params = params.set(key, filters[key].toString());
      }
    });

    return this.http.get<ApiResponse>(`${this.baseUrl}/summary`, { params });
  }

  /**
   * Get all unique month-year labels
   * @returns Observable<ApiResponse>
   */
  getLabels(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/labels`);
  }

  /**
   * Get labels by filters
   * @param filters - Filter conditions
   * @returns Observable<ApiResponse>
   */
  getLabelsByFilters(filters: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/labels/filter`, filters);
  }

  /**
   * Get values for report generation
   * @param filters - Filter conditions
   * @returns Observable<ApiResponse>
   */
  getReportValues(filters: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/report-values`, filters);
  }

  /**
   * Get count by user ID and date
   * @param userId - User ID
   * @param date - Date string
   * @returns Observable<ApiResponse>
   */
  getCountByUserDate(userId: number, date: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/count/user/${userId}/date/${date}`);
  }

  /**
   * Get success count by user ID and date
   * @param userId - User ID
   * @param date - Date string
   * @returns Observable<ApiResponse>
   */
  getSuccessCountByUserDate(userId: number, date: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/success-count/user/${userId}/date/${date}`);
  }


  // performance-statistic.service.ts (frontend)

// Add these methods to your existing service
getNextTopic(moduleId: number, topicId: number): Observable<ApiResponse<any>> {
  return this.http.get<ApiResponse<any>>(
    `${this.baseUrl}/next/${moduleId}/${topicId}`,
    { headers: this.getHeaders() }
  );
}

getPreviousTopic(moduleId: number, topicId: number): Observable<ApiResponse<any>> {
  return this.http.get<ApiResponse<any>>(
    `${this.baseUrl}/previous/${moduleId}/${topicId}`,
    { headers: this.getHeaders() }
  );
}

getNavigationInfo(moduleId: number, topicId: number): Observable<ApiResponse<any>> {
  return this.http.get<ApiResponse<any>>(
    `${this.baseUrl}/navigation-info/${moduleId}/${topicId}`,
    { headers: this.getHeaders() }
  );
}

    uploadDocument(file: File): Observable<ApiResponse<any>> {
  const formData = new FormData();
  formData.append('file', file);

  return this.http.post<ApiResponse<any>>(
    `${this.uploadUrl}
    `,
    formData
  );
}
}