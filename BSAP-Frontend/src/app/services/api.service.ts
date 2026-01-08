import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import Districts from '../models/Districts';

export interface Menu {
  id: number;
  menuName: string;
  menuUrl: string;
  priority: number;
  active: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: number;
  permissionName: string;
  permissionCode: string;
  permissionUrl?: string;
  active: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: number;
  roleName: string;
  description?: string;
  active: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}


export interface SubMenu {
  id: number;
  menuId: number;
  parentId?: number;
  subMenuName: string;
  subMenuUrl: string;
  priority: number;
  active: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}


export interface State {
  id: number;
  stateName: string;
  stateDescription?: string;
  active: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

export interface Module {
  id: number;
  moduleName: string;
  priority: number;
  active: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Companys{
  id:number;
  priority: number;
  active: boolean;
  companyName:string;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}
interface DisplayTopic extends Topic {
  name: string; // For display - maps to topicName
  description: string; // For display
  permissions: {
    selected: boolean;
  };
}

export interface Topic {
  id: number;
  moduleId: number;
  topicName: string;
  subName?: string;
  priority: number;
  formType?: string;
  subMenuId?: number;
  isShowCummulative?: boolean;
  isShowPrevious?: boolean;
  isStartJan?: boolean;
  startMonth?: number;
  endMonth?: number;
  active: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  moduleName?: string;
}

export interface SubTopic {
  id: number;
  subTopicName: string;
  topicId: number;
  priority?: number;
  active: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  topicName?: string;
}


export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  contactNo?: string;
  userImage?: string;
  stateId?: number;
  rangeId?: number;
  districtId?: number;
  roleId: number;
  password: string;
  battalionId?: number;
  token?: string;
  tokenValidity?: string;
  verified: boolean;
  otp?: string;
  otpValidity?: string;
  isFirst: boolean;
  joiningDate?: string;
  endDate?: string;
  numberSubdivision?: number;
  numberCircle?: number;
  numberPs?: number;
  numberOp?: number;
  active: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  state?: State;
  role?: Role;
  district?: Districts;
  range?: Range;
  battalion?: Battalion;
}

// export interface Topic {
//   id: number;
//   topicName: string;
//   priority: number;
//   formType?: string;
// }


export interface Range {
  id: number;
  rangeName: string;
  stateId?: number;
  active: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface District {
  id: number;
  districtName: string;
  rangeId?: number;
  stateId?: number;
  active: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Battalion {
  id: number;
  rangeId?: number;
  districtId?: number;
  battalionName: string;
  battalionHead?: string;
  battalionContactNo?: string;
  battalionMobileNo?: string;
  battalionEmail?: string;
  battalionImage?: string;
  battalionPersonImage?: string;
  battalionArea?: string;
  createdBy?: number;
  updatedBy?: number;
  active: boolean;
  created_date?: string;
  updated_date?: string;
  range?: {
    id: number;
    rangeName: string;
    rangeHead?: string;
  };
  district?: {
    id: number;
    districtName: string;
  };
}

export interface Question {
  id: number;
  topicId: number;
  subTopicId?: number;
  question: string;
  priority?: number;
  type?: 'TEXT' | 'DATE' | 'NUMBER' | 'PRICE' | 'MULTIPLE_CHOICE';
  defaultVal?: 'NONE' | 'PREVIOUS' | 'QUESTION' | 'PS' | 'SUB' | 'CIRCLE' | 'PSOP';
  defaultQue?: number;
  defaultSub?: number;
  defaultTo?: string;
  defaultFormula?: string;
  formula?: string;
  isPrevious?: boolean;
  isCumulative?: boolean;
  active: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  questionType?: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'MULTIPLE_CHOICE' | 'RATING';
  maxScore?: number;
  displayOrder?: number;
  isActive?: boolean;
  topic?: {
    id: number;
    topicName: string;
    moduleId: number;
    module?: {
      id: number;
      moduleName: string;
    };
  };
  subTopic?: {
    id: number;
    subTopicName: string;
  };
}



// ... your existing interfaces (Menu, Permission, Role, SubMenu, State, Module, Topic, SubTopic, User, Range, District, Battalion, Question) ...

// ===== ADD COMMUNICATION INTERFACES HERE =====
export interface Communication {
  id: number;
  name: string;
  subject?: string;
  message: string;
  createdDate?: Date;
  created_date?: string;
  createdAt?: string;
  battalionId: number;
  battalionName?: string;
  document?: string;
  active: boolean;
  replies?: Reply[];
  messages?: CommunicationMessage[];
  createdBy?: number;
  updatedBy?: number;
  description?: string;
  communicationUsers?: CommunicationUser[];
}

export interface Reply {
  id: number;
  replyDate: Date;
  replyBy: string;
  replyMessage: string;
  message?: string;
  document?: string;
  communicationsMessageId?: number;
  active?: boolean;
  attachments?: CommunicationAttachment[];
  user?: User;
}

export interface CommunicationMessage {
  id: number;
  communicationsId: number;
  message: string;
  createdBy: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  attachments?: CommunicationAttachment[];
  messageUsers?: CommunicationMessageUser[];
  user?: User;
}

export interface CommunicationAttachment {
  id: number;
  communicationsMessageId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  active: boolean;
}

export interface CommunicationMessageUser {
  id: number;
  communicationsMessageId: number;
  userId: number;
  updateStatus: 'READ' | 'UNREAD';
  active: boolean;
  user?: User;
}

export interface CommunicationUser {
  id: number;
  communicationsId: number;
  userId: number;
  active: boolean;
  user?: User;
}

export interface ApiResponse<T> {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  headersWithToken: HttpHeaders | { [header: string]: string | string[]; } | undefined;
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

 private getHeaders(contentType?: string): HttpHeaders {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    let headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    if (contentType) {
      headers = headers.set('Content-Type', contentType);
    }
    return headers;
  }

  // User Menu
  get_user_menu(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
        this.baseUrl + "menus/user",
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  // Module Operations
  addModule(data: Partial<Module>): Observable<ApiResponse<Module>> {
    return this.http.post<ApiResponse<Module>>(
        this.baseUrl + "modules", data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  getModules(page: number = 1, limit: number = 10, search?: string, sortBy?: string, sortOrder?: string): Observable<ApiResponse<Module[]>> {
    let params = `?page=${page}&limit=${limit}`;
    if (search && search.trim()) {
      params += `&search=${encodeURIComponent(search)}`;
    }
    if (sortBy) {
      params += `&sortBy=${sortBy}`;
    }
    if (sortOrder) {
      params += `&sortOrder=${sortOrder}`;
    }
    
    return this.http.get<ApiResponse<Module[]>>(
        this.baseUrl + "modules" + params,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  updateModule(id: number, data: Partial<Module>): Observable<ApiResponse<Module>> {
    return this.http.put<ApiResponse<Module>>(
        this.baseUrl + "modules/" + id, data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }





  // ADD COMPANY 
  
// add company
updateCompany(id: number, data: Partial<Companys>): Observable<ApiResponse<Companys>> {
    return this.http.put<ApiResponse<Companys>>(
        this.baseUrl + "companies/" + id, data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }


  addCompany(data: Partial<Companys>): Observable<ApiResponse<Companys>> {
    return this.http.post<ApiResponse<Companys>>(
        this.baseUrl + "companies", data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }
 

   getCompanies(page: number = 1, limit: number = 15, search?: string, sortBy?: string, sortOrder?: string): Observable<ApiResponse<Companys[]>> {
    let params = `?page=${page}&limit=${limit}`;
    if (search && search.trim()) {
      params += `&search=${encodeURIComponent(search)}`;
    }
    if (sortBy) {
      params += `&sortBy=${sortBy}`;
    }
    if (sortOrder) {
      params += `&sortOrder=${sortOrder}`;
    }
    
    return this.http.get<ApiResponse<Companys[]>>(
        this.baseUrl + "companies" + params,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  deleteModule(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
        this.baseUrl + "modules/" + id,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  toggleModuleStatus(id: number, data: { active: boolean }): Observable<ApiResponse<Module>> {
    return this.http.patch<ApiResponse<Module>>(
        this.baseUrl + "modules/" + id + "/status", data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  // Additional module methods
  getModuleById(id: number): Observable<ApiResponse<Module>> {
    return this.http.get<ApiResponse<Module>>(
        this.baseUrl + "modules/" + id,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getActiveModules(): Observable<ApiResponse<Module[]>> {
    return this.http.get<ApiResponse<Module[]>>(
        this.baseUrl + "modules/status/active",
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  searchModules(searchTerm: string, page = 1, limit = 10): Observable<ApiResponse<Module[]>> {
    return this.http.get<ApiResponse<Module[]>>(
        this.baseUrl + `modules/search/${searchTerm}?page=${page}&limit=${limit}`,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }
  getModuleDropdown(): Observable<ApiResponse<Module[]>> {
    return this.http.get<ApiResponse<Module[]>>(
        this.baseUrl + "modules/all",
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  // Topic Operations
  getTopics(page: number = 1, limit: number = 10, search?: string, sortBy?: string, sortOrder?: string, moduleId?: number, status?: string): Observable<ApiResponse<Topic[]>> {
    let params = `?page=${page}&limit=${limit}`;
    if (search && search.trim()) {
      params += `&search=${encodeURIComponent(search)}`;
    }
    if (sortBy) {
      params += `&sortBy=${sortBy}`;
    }
    if (sortOrder) {
      params += `&sortOrder=${sortOrder}`;
    }
    if (moduleId) {
      params += `&moduleId=${moduleId}`;
    }
    if (status) {
      params += `&status=${status}`;
    }
    
    return this.http.get<ApiResponse<Topic[]>>(
        this.baseUrl + "topics" + params,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getTopicById(id: number): Observable<ApiResponse<Topic>> {
    return this.http.get<ApiResponse<Topic>>(
        this.baseUrl + "topics/" + id,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  addTopic(data: Partial<Topic>): Observable<ApiResponse<Topic>> {
    return this.http.post<ApiResponse<Topic>>(
        this.baseUrl + "topics", data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  updateTopic(id: number, data: Partial<Topic>): Observable<ApiResponse<Topic>> {
    return this.http.put<ApiResponse<Topic>>(
        this.baseUrl + "topics/" + id, data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  deleteTopic(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
        this.baseUrl + "topics/" + id,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  activateTopic(id: number): Observable<ApiResponse<Topic>> {
    return this.http.post<ApiResponse<Topic>>(
        this.baseUrl + "topics/" + id + "/activate", {},
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  deactivateTopic(id: number): Observable<ApiResponse<Topic>> {
    return this.http.post<ApiResponse<Topic>>(
        this.baseUrl + "topics/" + id + "/deactivate", {},
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  getTopicsByModule(moduleId: number, page: number = 1, limit: number = 10): Observable<ApiResponse<Topic[]>> {
    return this.http.get<ApiResponse<Topic[]>>(
        this.baseUrl + `topics/by-module/${moduleId}?page=${page}&limit=${limit}`,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  searchTopics(searchTerm: string, page = 1, limit = 10): Observable<ApiResponse<Topic[]>> {
    return this.http.get<ApiResponse<Topic[]>>(
        this.baseUrl + `topics/search/${searchTerm}?page=${page}&limit=${limit}`,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getActiveTopics(): Observable<ApiResponse<Topic[]>> {
    return this.http.get<ApiResponse<Topic[]>>(
        this.baseUrl + "topics/status/active",
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getTopicStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
        this.baseUrl + "topics/stats/overview",
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  // SubTopic Operations
  getSubTopics(page: number = 1, limit: number = 10, search?: string, sortBy?: string, sortOrder?: string, topicId?: number, status?: string): Observable<ApiResponse<SubTopic[]>> {
    let params = `?page=${page}&limit=${limit}`;
    if (search && search.trim()) {
      params += `&search=${encodeURIComponent(search)}`;
    }
    if (sortBy) {
      params += `&sortBy=${sortBy}`;
    }
    if (sortOrder) {
      params += `&sortOrder=${sortOrder}`;
    }
    if (topicId) {
      params += `&topicId=${topicId}`;
    }
    if (status) {
      params += `&status=${status}`;
    }
    
    return this.http.get<ApiResponse<SubTopic[]>>(
        this.baseUrl + "sub-topics" + params,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getSubTopicById(id: number): Observable<ApiResponse<SubTopic>> {
    return this.http.get<ApiResponse<SubTopic>>(
        this.baseUrl + "sub-topics/" + id,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  addSubTopic(data: Partial<SubTopic>): Observable<ApiResponse<SubTopic>> {
    return this.http.post<ApiResponse<SubTopic>>(
        this.baseUrl + "sub-topics", data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  updateSubTopic(id: number, data: Partial<SubTopic>): Observable<ApiResponse<SubTopic>> {
    return this.http.put<ApiResponse<SubTopic>>(
        this.baseUrl + "sub-topics/" + id, data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  deleteSubTopic(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
        this.baseUrl + "sub-topics/" + id,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  activateSubTopic(id: number): Observable<ApiResponse<SubTopic>> {
    return this.http.post<ApiResponse<SubTopic>>(
        this.baseUrl + "sub-topics/" + id + "/activate", {},
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  deactivateSubTopic(id: number): Observable<ApiResponse<SubTopic>> {
    return this.http.post<ApiResponse<SubTopic>>(
        this.baseUrl + "sub-topics/" + id + "/deactivate", {},
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  getSubTopicsByTopic(topicId: number, ): Observable<ApiResponse<SubTopic[]>> {
    return this.http.get<ApiResponse<SubTopic[]>>(
        this.baseUrl + `sub-topics/by-topic/${topicId}`,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getSubTopicsByTopicForForm(topicId: number): Observable<ApiResponse<SubTopic[]>> {
    return this.http.get<ApiResponse<SubTopic[]>>(
        this.baseUrl + `sub-topics/topic/${topicId}`,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  searchSubTopics(searchTerm: string, page = 1, limit = 10): Observable<ApiResponse<SubTopic[]>> {
    return this.http.get<ApiResponse<SubTopic[]>>(
        this.baseUrl + `sub-topics/search/${searchTerm}?page=${page}&limit=${limit}`,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getActiveSubTopics(): Observable<ApiResponse<SubTopic[]>> {
    return this.http.get<ApiResponse<SubTopic[]>>(
        this.baseUrl + "sub-topics/active",
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getActiveSubTopicsStatus(): Observable<ApiResponse<SubTopic[]>> {
    return this.http.get<ApiResponse<SubTopic[]>>(
        this.baseUrl + "sub-topics/status/active",
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getSubTopicStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
        this.baseUrl + "sub-topics/stats/overview",
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  cloneSubTopic(id: number): Observable<ApiResponse<SubTopic>> {
    return this.http.post<ApiResponse<SubTopic>>(
        this.baseUrl + "sub-topics/" + id + "/clone", {},
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  updateSubTopicOrder(id: number, displayOrder: number): Observable<ApiResponse<SubTopic>> {
    return this.http.put<ApiResponse<SubTopic>>(
        this.baseUrl + "sub-topics/" + id + "/order", { displayOrder },
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  reorderSubTopics(orders: { id: number; displayOrder: number }[]): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
        this.baseUrl + "sub-topics/reorder", { orders },
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  getSubTopicQuestions(id: number, page: number = 1, limit: number = 10): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
        this.baseUrl + `sub-topics/${id}/questions?page=${page}&limit=${limit}`,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getSubTopicPerformanceStatistics(id: number, page: number = 1, limit: number = 10): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
        this.baseUrl + `sub-topics/${id}/performance-statistics?page=${page}&limit=${limit}`,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  // Question Operations - Simple pagination only
  getQuestions(page: number = 1, limit: number = 10): Observable<ApiResponse<Question[]>> {
    const params = `?page=${page}&limit=${limit}&sortBy=priority&sortOrder=ASC`;
    
    return this.http.get<ApiResponse<Question[]>>(
        this.baseUrl + "questions" + params,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  // Full Questions API with all filters (keeping for other use cases)
  getQuestionsWithFilters(page: number = 1, limit: number = 10, search?: string, sortBy?: string, sortOrder?: string, topicId?: number, subTopicId?: number, type?: string, status?: string, moduleId?: number): Observable<ApiResponse<Question[]>> {
    let params = `?page=${page}&limit=${limit}`;
    if (search && search.trim()) {
      params += `&search=${encodeURIComponent(search)}`;
    }
    if (sortBy) {
      params += `&sortBy=${sortBy}`;
    }
    if (sortOrder) {
      params += `&sortOrder=${sortOrder}`;
    }
    if (topicId) {
      params += `&topicId=${topicId}`;
    }
    if (subTopicId) {
      params += `&subTopicId=${subTopicId}`;
    }
    if (type) {
      params += `&type=${type}`;
    }
    if (status) {
      params += `&status=${status}`;
    }
    if (moduleId) {
      params += `&moduleId=${moduleId}`;
    }
    
    return this.http.get<ApiResponse<Question[]>>(
        this.baseUrl + "questions" + params,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getQuestionById(id: number): Observable<ApiResponse<Question>> {
    return this.http.get<ApiResponse<Question>>(
        this.baseUrl + "questions/" + id,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  addQuestion(data: Partial<Question>): Observable<ApiResponse<Question>> {
    return this.http.post<ApiResponse<Question>>(
        this.baseUrl + "questions", data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  updateQuestion(id: number, data: Partial<Question>): Observable<ApiResponse<Question>> {
    return this.http.put<ApiResponse<Question>>(
        this.baseUrl + "questions/" + id, data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  deleteQuestion(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
        this.baseUrl + "questions/" + id,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  activateQuestion(id: number): Observable<ApiResponse<Question>> {
    return this.http.post<ApiResponse<Question>>(
        this.baseUrl + "questions/" + id + "/activate", {},
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  deactivateQuestion(id: number): Observable<ApiResponse<Question>> {
    return this.http.post<ApiResponse<Question>>(
        this.baseUrl + "questions/" + id + "/deactivate", {},
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  getQuestionsBySubTopic(subTopicId: number, page: number = 1, sortBy?: string, sortOrder?: string, type?: string, status?: string): Observable<ApiResponse<Question[]>> {
    let params = `?page=${page}`;
    if (sortBy) {
      params += `&sortBy=${sortBy}`;
    }
    if (sortOrder) {
      params += `&sortOrder=${sortOrder}`;
    }
    if (type) {
      params += `&type=${type}`;
    }
    if (status) {
      params += `&status=${status}`;
    }
    
    return this.http.get<ApiResponse<Question[]>>(
        this.baseUrl + `questions/by-sub-topic/${subTopicId}` + params,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getQuestionsByTopic(topicId: number): Observable<ApiResponse<Question[]>> {
    return this.http.get<ApiResponse<Question[]>>(
        this.baseUrl + `questions/by-topic/${topicId}`,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getQuestionsByType(type: string, page: number = 1, limit: number = 10, sortBy?: string, sortOrder?: string, topicId?: number, subTopicId?: number, moduleId?: number, status?: string): Observable<ApiResponse<Question[]>> {
    let params = `?page=${page}&limit=${limit}`;
    if (sortBy) {
      params += `&sortBy=${sortBy}`;
    }
    if (sortOrder) {
      params += `&sortOrder=${sortOrder}`;
    }
    if (topicId) {
      params += `&topicId=${topicId}`;
    }
    if (subTopicId) {
      params += `&subTopicId=${subTopicId}`;
    }
    if (moduleId) {
      params += `&moduleId=${moduleId}`;
    }
    if (status) {
      params += `&status=${status}`;
    }
    
    return this.http.get<ApiResponse<Question[]>>(
        this.baseUrl + `questions/by-type/${type}` + params,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  searchQuestions(searchTerm: string, page = 1, limit = 10, topicId?: number, subTopicId?: number, moduleId?: number, type?: string, status?: string): Observable<ApiResponse<Question[]>> {
    let params = `?page=${page}&limit=${limit}`;
    if (topicId) {
      params += `&topicId=${topicId}`;
    }
    if (subTopicId) {
      params += `&subTopicId=${subTopicId}`;
    }
    if (moduleId) {
      params += `&moduleId=${moduleId}`;
    }
    if (type) {
      params += `&type=${type}`;
    }
    if (status) {
      params += `&status=${status}`;
    }
    
    return this.http.get<ApiResponse<Question[]>>(
        this.baseUrl + `questions/search/${searchTerm}` + params,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getActiveQuestions(): Observable<ApiResponse<Question[]>> {
    return this.http.get<ApiResponse<Question[]>>(
        this.baseUrl + "questions/active",
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getQuestionTypes(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
        this.baseUrl + "questions/config/types",
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getQuestionStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
        this.baseUrl + "questions/stats/overview",
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  validateQuestionFormula(formula: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
        this.baseUrl + "questions/validate-formula", { formula },
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  getQuestionsWithFormulas(topicId: number): Observable<ApiResponse<Question[]>> {
    return this.http.get<ApiResponse<Question[]>>(
        this.baseUrl + `questions/topic/${topicId}/formulas`,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getQuestionsForFormula(topicId: number): Observable<ApiResponse<Question[]>> {
    return this.http.get<ApiResponse<Question[]>>(
        this.baseUrl + `questions/topic/${topicId}/for-formula`,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  getQuestionsForForm(topicId: number): Observable<ApiResponse<Question[]>> {
    return this.http.get<ApiResponse<Question[]>>(
        this.baseUrl + `questions/topic/${topicId}/form`,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  cloneQuestion(id: number): Observable<ApiResponse<Question>> {
    return this.http.post<ApiResponse<Question>>(
        this.baseUrl + "questions/" + id + "/clone", {},
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  updateQuestionOrder(id: number, order: number): Observable<ApiResponse<Question>> {
    return this.http.put<ApiResponse<Question>>(
        this.baseUrl + "questions/" + id + "/order", { order },
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  reorderQuestions(items: { id: number; displayOrder: number }[]): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
        this.baseUrl + "questions/reorder", { items },
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  bulkCreateQuestions(questions: Partial<Question>[]): Observable<ApiResponse<Question[]>> {
    return this.http.post<ApiResponse<Question[]>>(
        this.baseUrl + "questions/bulk-create", { questions },
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  getQuestionPerformanceStatistics(id: number, page: number = 1, limit: number = 10): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
        this.baseUrl + `questions/${id}/performance-statistics?page=${page}&limit=${limit}`,
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  updateQuestionMetadata(id: number, metadata: any): Observable<ApiResponse<Question>> {
    return this.http.put<ApiResponse<Question>>(
        this.baseUrl + "questions/" + id + "/metadata", metadata,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  // Report Operations - Battalion-Based Reports
  
  /**
   * Generate Battalion Summary Report - POST /api/reports/getReport
   */
  generateBattalionSummaryReport(data: {
    reportType: 'SUMMARY';
    battalionIds: number[];
    moduleId: number;
    monthYear: string;
    viewType?: 'BOTH' | 'CHART' | 'TABLE';
    page?: number;
    size?: number;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      this.baseUrl + "reports/getReport",
      data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

 generateReport(data: {
  stateData?: string;
  districtData?: string;
  moduleData?: string;
  topicData?: string[];
  startMonthData?: string;
  endMonthData?: string;
}): Observable<any> {
  return this.http.post(
    this.baseUrl + "reports/generate",
    data,
    { headers: this.getHeaders('application/json') }
  );
}

  /**
   * Generate Detailed Report - POST /api/reports/getReport
   */
  generateDetailedReport(data: {
    reportType: 'DETAILED';
    battalionIds: number[];
    moduleId: number;
    fromDate: string;
    toDate: string;
    page?: number;
    size?: number;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      this.baseUrl + "reports/getReport",
      data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  /**
   * Generate Comparison Report - POST /api/reports/getReport
   */
  generateComparisonReport(data: {
    reportType: 'COMPARISON';
    battalionIds: number[];
    moduleId: number;
    fromDate: string;
    toDate: string;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
    chartConfig?: {
      chartType: 'BAR' | 'LINE' | 'PIE' | 'AREA';
      title: string;
    };
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      this.baseUrl + "reports/getReport",
      data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  /**
   * Generate Trend Analysis Report - POST /api/reports/getReport
   */
  generateTrendReport(data: {
    reportType: 'TREND';
    battalionIds: number[];
    moduleId: number;
    fromDate: string;
    toDate: string;
    trendPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
    chartConfig?: {
      chartType: 'LINE' | 'AREA';
      title: string;
    };
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      this.baseUrl + "reports/getReport",
      data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  /**
   * Generate Performance Report - POST /api/reports/getReport
   */
  generatePerformanceReport(data: {
    reportType: 'PERFORMANCE';
    battalionIds: number[];
    moduleId: number;
    monthYear: string;
    performanceMetrics?: string[];
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      this.baseUrl + "reports/getReport",
      data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  /**
   * Generate Compliance Report - POST /api/reports/getReport
   */
  generateComplianceReport(data: {
    reportType: 'COMPLIANCE';
    battalionIds: number[];
    moduleId: number;
    monthYear: string;
    complianceThreshold?: number;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      this.baseUrl + "reports/getReport",
      data,
      { headers: this.headersWithToken = this.getHeaders('application/json') }
    );
  }

  /**
   * Get Report Metadata - GET /api/reports/metadata
   */
  getReportMetadata(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      this.baseUrl + "reports/metadata",
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  /**
   * Get Report Templates - GET /api/reports/templates
   */
  getReportTemplates(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      this.baseUrl + "reports/templates",
      { headers: this.headersWithToken = this.getHeaders() }
    );
  }

  /**
   * Export Report - GET /api/reports/export/:reportId
   */
exportReport(reportId: string, format: 'EXCEL' | 'PDF' | 'CSV' | 'JSON'): Observable<any> {
  return this.http.get(
    this.baseUrl + "reports/export/" + reportId + `?format=${format}`,
    { responseType: 'blob'  as 'json',
      observe: 'response' 
    }
  );
}

  /**
   * Generic Report Generation Method - POST /api/reports/getReport
   * This is the main method that can handle all report types
   */
  // generateReport(data: {
  //   reportType: 'SUMMARY' | 'DETAILED' | 'COMPARISON' | 'TREND' | 'PERFORMANCE' | 'COMPLIANCE';
  //   battalionIds: number[];
  //   moduleId: number;
  //   monthYear?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   viewType?: 'BOTH' | 'CHART' | 'TABLE';
  //   page?: number;
  //   size?: number;
  //   sortBy?: string;
  //   sortDirection?: 'ASC' | 'DESC';
  //   trendPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  //   performanceMetrics?: string[];
  //   complianceThreshold?: number;
  //   chartConfig?: {
  //     chartType: 'BAR' | 'LINE' | 'PIE' | 'AREA';
  //     title: string;
  //   };
  // }): Observable<ApiResponse<any>> {
  //   return this.http.post<ApiResponse<any>>(
  //     this.baseUrl + "reports/getReport",
  //     data,
  //     { headers: this.headersWithToken = this.getHeaders('application/json') }
  //   );
  // }
getCommunications(
  page: number = 1, 
  limit: number = 10, 
  search?: string, 
  sortBy?: string, 
  sortOrder?: string,
  active?: boolean
): Observable<ApiResponse<Communication[]>> {
  let params = `?page=${page}&limit=${limit}`;
  if (search && search.trim()) {
    params += `&search=${encodeURIComponent(search)}`;
  }
  if (sortBy) {
    params += `&sortBy=${sortBy}`;
  }
  if (sortOrder) {
    params += `&sortOrder=${sortOrder}`;
  }
  if (active !== undefined) {
    params += `&active=${active}`;
  }
  
  return this.http.get<ApiResponse<any>>(
    this.baseUrl + "communications" + params,
    { headers: this.getHeaders() }
  );
}


// services/api.service.ts - ADD THIS METHOD
getUserCommunications(page?: number, limit?: number, search?: string) {
  const params: any = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (search) params.search = search;
  
  return this.http.get(`${this.baseUrl}communications/user`, { params });
}
getCommunicationById(id: number): Observable<ApiResponse<any>> {
  return this.http.get<ApiResponse<any>>(
    this.baseUrl + "communications/" + id,
    { headers: this.getHeaders() }
  );
}

createCommunication(data: any): Observable<ApiResponse<any>> {
  console.log('📤 Sending communication payload:', data);

  return this.http.post<ApiResponse<any>>(
    this.baseUrl + "communications/start",
    data,
    { headers: this.getHeaders('application/json') }
  );
}


updateCommunication(id: number, data: any): Observable<ApiResponse<any>> {
  return this.http.put<ApiResponse<any>>(
    this.baseUrl + "communications/" + id,
    data,
    { headers: this.getHeaders('application/json') }
  );
}

sendReply(communicationId: number, data: any): Observable<ApiResponse<any>> {
  return this.http.post<ApiResponse<any>>(
    this.baseUrl + "communications/" + communicationId + "/reply",
    data,
    { headers: this.getHeaders('application/json') }
  );
}


getMenus(
    page: number = 1, 
    limit: number = 10, 
    search?: string, 
    sortBy: string = 'priority', 
    sortOrder: string = 'ASC',
    status?: string
  ): Observable<ApiResponse<Menu[]>> {
    let params = `?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    
    if (search && search.trim()) {
      params += `&search=${encodeURIComponent(search)}`;
    }
    if (status) {
      params += `&status=${status}`;
    }
    
  return this.http.get<ApiResponse<Menu[]>>(
      `${this.baseUrl}menus${params}`,
      { headers: this.getHeaders() }
    );
  }


  getMenuById(id: number): Observable<ApiResponse<Menu>> {
    return this.http.get<ApiResponse<Menu>>(
      `${this.baseUrl}menus/${id}`,
      { headers: this.getHeaders() }
    );
  }


  createMenu(data: Partial<Menu>): Observable<ApiResponse<Menu>> {
    return this.http.post<ApiResponse<Menu>>(
      `${this.baseUrl}menus`,
      data,
      { headers: this.getHeaders('application/json') }
    );
  }


  updateMenu(id: number, data: Partial<Menu>): Observable<ApiResponse<Menu>> {
    return this.http.put<ApiResponse<Menu>>(
      `${this.baseUrl}menus/${id}`,
      data,
      { headers: this.getHeaders('application/json') }
    );
  }


  deleteMenu(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}menus/${id}`,
      { headers: this.getHeaders() }
    );
  }

  activateMenu(id: number): Observable<ApiResponse<Menu>> {
    return this.http.post<ApiResponse<Menu>>(
      `${this.baseUrl}menus/${id}/activate`,
      {},
      { headers: this.getHeaders('application/json') }
    );
  }

  deactivateMenu(id: number): Observable<ApiResponse<Menu>> {
    return this.http.post<ApiResponse<Menu>>(
      `${this.baseUrl}menus/${id}/deactivate`,
      {},
      { headers: this.getHeaders('application/json') }
    );
  }


  toggleMenuStatus(id: number, active: boolean): Observable<ApiResponse<Menu>> {
    if (active) {
      return this.activateMenu(id);
    } else {
      return this.deactivateMenu(id);
    }
  }


  updateMenuOrder(id: number, priority: number): Observable<ApiResponse<Menu>> {
    return this.http.put<ApiResponse<Menu>>(
      `${this.baseUrl}menus/${id}/order`,
      { priority },
      { headers: this.getHeaders('application/json') }
    );
  }


  getActiveMenus(): Observable<ApiResponse<Menu[]>> {
    return this.http.get<ApiResponse<Menu[]>>(
      `${this.baseUrl}menus/status/active`,
      { headers: this.getHeaders() }
    );
  }


  searchMenus(searchTerm: string, page: number = 1, limit: number = 10): Observable<ApiResponse<Menu[]>> {
    return this.http.get<ApiResponse<Menu[]>>(
      `${this.baseUrl}menus/search/${searchTerm}?page=${page}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
  }


  getUserMenus(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}menus/user`,
      { headers: this.getHeaders() }
    );
  }

  // Dashboard Operations
  /**
   * GET /dashboard/overview
   */
  getDashboardOverview(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/overview`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/stats
   */
  getDashboardStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/stats`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/users/stats
   */
  getDashboardUserStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/users/stats`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/users/by-role
   */
  getUsersByRole(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/users/by-role`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/users/by-state
   */
  getUsersByState(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/users/by-state`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/users/recent?limit=10
   */
  getRecentUsers(limit: number = 10): Observable<ApiResponse<any>> {
    const params = `?limit=${limit}`;
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/users/recent${params}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/performance/overview
   */
  getPerformanceOverview(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/performance/overview`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/performance/by-month
   */
  getPerformanceByMonth(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/performance/by-month`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/performance/by-module
   */
  getPerformanceByModule(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/performance/by-module`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/performance/trends
   */
  getPerformanceTrends(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/performance/trends`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/geography/stats
   */
  getGeographyStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/geography/stats`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/geography/distribution
   */
  getGeographyDistribution(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/geography/distribution`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/modules/stats
   */
  getDashboardModuleStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/modules/stats`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/questions/stats
   */
  getDashboardQuestionStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/questions/stats`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/system/health
   */
  getSystemHealth(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/system/health`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /dashboard/activity/recent?limit=20
   */
  getRecentActivity(limit: number = 20): Observable<ApiResponse<any>> {
    const params = `?limit=${limit}`;
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}dashboard/activity/recent${params}`,
      { headers: this.getHeaders() }
    );
  }


  getMenuDropdown(): Observable<ApiResponse<Menu[]>> {
    return this.http.get<ApiResponse<Menu[]>>(
      `${this.baseUrl}menus/active`,
      { headers: this.getHeaders() }
    );
  }


  bulkUpdatePriorities(updates: { id: number; priority: number }[]): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}menus/bulk/priorities`,
      { updates },
      { headers: this.getHeaders('application/json') }
    );
  }


  bulkUpdateStatus(menuIds: number[], active: boolean): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}menus/bulk/status`,
      { menuIds, active },
      { headers: this.getHeaders('application/json') }
    );
  }


getSubMenus(
  page: number = 1,
  limit: number = 10,
  search?: string,
  sortBy: string = 'priority',
  sortOrder: string = 'ASC',
  status?: string
): Observable<ApiResponse<SubMenu[]>> {
  let params = `?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
  if (search && search.trim()) {
    params += `&search=${encodeURIComponent(search)}`;
  }
  if (status) {
    params += `&status=${status}`;
  }
  return this.http.get<ApiResponse<SubMenu[]>>(
  this.baseUrl + "sub-menus" + params,
    { headers: this.getHeaders() }
  );
}

getSubMenuById(id: number): Observable<ApiResponse<SubMenu>> {
  return this.http.get<ApiResponse<SubMenu>>(
  this.baseUrl + "sub-menus/" + id,
    { headers: this.getHeaders() }
  );
}

createSubMenu(data: Partial<SubMenu>): Observable<ApiResponse<SubMenu>> {
  return this.http.post<ApiResponse<SubMenu>>(
  this.baseUrl + "sub-menus",
    data,
    { headers: this.getHeaders('application/json') }
  );
}

updateSubMenu(id: number, data: Partial<SubMenu>): Observable<ApiResponse<SubMenu>> {
  return this.http.put<ApiResponse<SubMenu>>(
  this.baseUrl + "sub-menus/" + id,
    data,
    { headers: this.getHeaders('application/json') }
  );
}

deleteSubMenu(id: number): Observable<ApiResponse<any>> {
  return this.http.delete<ApiResponse<any>>(
  this.baseUrl + "sub-menus/" + id,
    { headers: this.getHeaders() }
  );
}

activateSubMenu(id: number): Observable<ApiResponse<SubMenu>> {
  return this.http.post<ApiResponse<SubMenu>>(
  this.baseUrl + "sub-menus/" + id + "/activate",
    {},
    { headers: this.getHeaders('application/json') }
  );
}

deactivateSubMenu(id: number): Observable<ApiResponse<SubMenu>> {
  return this.http.post<ApiResponse<SubMenu>>(
  this.baseUrl + "sub-menus/" + id + "/deactivate",
    {},
    { headers: this.getHeaders('application/json') }
  );
}

toggleSubMenuStatus(id: number, active: boolean): Observable<ApiResponse<SubMenu>> {
  if (active) {
    return this.activateSubMenu(id);
  } else {
    return this.deactivateSubMenu(id);
  }
}

updateSubMenuOrder(id: number, priority: number): Observable<ApiResponse<SubMenu>> {
  return this.http.put<ApiResponse<SubMenu>>(
  this.baseUrl + "sub-menus/" + id + "/order",
    { priority },
    { headers: this.getHeaders('application/json') }
  );
}

getActiveSubMenus(): Observable<ApiResponse<SubMenu[]>> {
  return this.http.get<ApiResponse<SubMenu[]>>(
  this.baseUrl + "sub-menus/active",
    { headers: this.getHeaders() }
  );
}

searchSubMenus(searchTerm: string, page: number = 1, limit: number = 10): Observable<ApiResponse<SubMenu[]>> {
  return this.http.get<ApiResponse<SubMenu[]>>(
  this.baseUrl + `sub-menus/search/${searchTerm}?page=${page}&limit=${limit}`,
    { headers: this.getHeaders() }
  );
}

getSubMenusByMenu(menuId: number, page: number = 1, limit: number = 10): Observable<ApiResponse<SubMenu[]>> {
  return this.http.get<ApiResponse<SubMenu[]>>(
  this.baseUrl + `sub-menus/by-menu/${menuId}?page=${page}&limit=${limit}`,
    { headers: this.getHeaders() }
  );
}

getSubMenusByParent(parentId: number, page: number = 1, limit: number = 10): Observable<ApiResponse<SubMenu[]>> {
  return this.http.get<ApiResponse<SubMenu[]>>(
  this.baseUrl + `sub-menus/by-parent/${parentId}?page=${page}&limit=${limit}`,
    { headers: this.getHeaders() }
  );
}





// Get all roles (with optional pagination, search, status)
getRoles(page: number = 1, limit: number = 10, search?: string, status?: string): Observable<ApiResponse<Role[]>> {
  let params = `?page=${page}&limit=${limit}`;
  if (search && search.trim()) {
    params += `&search=${encodeURIComponent(search)}`;
  }
  if (status) {
    params += `&status=${status}`;
  }
  return this.http.get<ApiResponse<Role[]>>(
    this.baseUrl + 'roles' + params,
    { headers: this.getHeaders() }
  );
}

getRoleById(id: number): Observable<ApiResponse<Role>> {
  return this.http.get<ApiResponse<Role>>(
    this.baseUrl + 'roles/' + id,
    { headers: this.getHeaders() }
  );
}

createRole(data: Partial<Role>): Observable<ApiResponse<Role>> {
  return this.http.post<ApiResponse<Role>>(
    this.baseUrl + 'roles',
    data,
    { headers: this.getHeaders('application/json') }
  );
}

// Update an existing role
updateRole(id: number, data: Partial<Role>): Observable<ApiResponse<Role>> {
  return this.http.put<ApiResponse<Role>>(
    this.baseUrl + 'roles/' + id,
    data,
    { headers: this.getHeaders('application/json') }
  );
}

deleteRole(id: number): Observable<ApiResponse<any>> {
  return this.http.delete<ApiResponse<any>>(
    this.baseUrl + 'roles/' + id,
    { headers: this.getHeaders() }
  );
}

activateRole(id: number): Observable<ApiResponse<Role>> {
  return this.http.post<ApiResponse<Role>>(
    this.baseUrl + 'roles/' + id + '/activate',
    {},
    { headers: this.getHeaders('application/json') }
  );
}

deactivateRole(id: number): Observable<ApiResponse<Role>> {
  return this.http.post<ApiResponse<Role>>(
    this.baseUrl + 'roles/' + id + '/deactivate',
    {},
    { headers: this.getHeaders('application/json') }
  );
}

getActiveRoles(): Observable<ApiResponse<Role[]>> {
  return this.http.get<ApiResponse<Role[]>>(
    this.baseUrl + 'roles/active',
    { headers: this.getHeaders() }
  );
}

searchRoles(searchTerm: string, page: number = 1, limit: number = 10): Observable<ApiResponse<Role[]>> {
  return this.http.get<ApiResponse<Role[]>>(
    this.baseUrl + `roles/search/${searchTerm}?page=${page}&limit=${limit}`,
    { headers: this.getHeaders() }
  );
}

  /**
   * Get all permissions with pagination and filtering
   */
  getPermissions(
    page: number = 1, 
    limit: number = 10, 
    search?: string, 
    sortBy: string = 'permissionName', 
    sortOrder: string = 'ASC',
    status?: string
  ): Observable<ApiResponse<Permission[]>> {
    let params = `?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    
    if (search && search.trim()) {
      params += `&search=${encodeURIComponent(search)}`;
    }
    if (status) {
      params += `&status=${status}`;
    }
    
    return this.http.get<ApiResponse<Permission[]>>(
      `${this.baseUrl}permissions${params}`,
      { headers: this.getHeaders() }
    );
  }

  getPermissionById(id: number): Observable<ApiResponse<Permission>> {
    return this.http.get<ApiResponse<Permission>>(
      `${this.baseUrl}permissions/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getPermissionByCode(code: string): Observable<ApiResponse<Permission>> {
    return this.http.get<ApiResponse<Permission>>(
      `${this.baseUrl}permissions/by-code/${code}`,
      { headers: this.getHeaders() }
    );
  }

  createPermission(data: Partial<Permission>): Observable<ApiResponse<Permission>> {
    return this.http.post<ApiResponse<Permission>>(
      `${this.baseUrl}permissions`,
      data,
      { headers: this.getHeaders('application/json') }
    );
  }

  updatePermission(id: number, data: Partial<Permission>): Observable<ApiResponse<Permission>> {
    return this.http.put<ApiResponse<Permission>>(
      `${this.baseUrl}permissions/${id}`,
      data,
      { headers: this.getHeaders('application/json') }
    );
  }

  deletePermission(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}permissions/${id}`,
      { headers: this.getHeaders() }
    );
  }

  activatePermission(id: number): Observable<ApiResponse<Permission>> {
    return this.http.post<ApiResponse<Permission>>(
      `${this.baseUrl}permissions/${id}/activate`,
      {},
      { headers: this.getHeaders('application/json') }
    );
  }

  deactivatePermission(id: number): Observable<ApiResponse<Permission>> {
    return this.http.post<ApiResponse<Permission>>(
      `${this.baseUrl}permissions/${id}/deactivate`,
      {},
      { headers: this.getHeaders('application/json') }
    );
  }

  togglePermissionStatus(id: number, active: boolean): Observable<ApiResponse<Permission>> {
    if (active) {
      return this.activatePermission(id);
    } else {
      return this.deactivatePermission(id);
    }
  }

  getActivePermissions(): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(
      `${this.baseUrl}permissions/active`,
      { headers: this.getHeaders() }
    );
  }

  searchPermissions(searchTerm: string, page: number = 1, limit: number = 10): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(
      `${this.baseUrl}permissions/search/${searchTerm}?page=${page}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
  }

  getPermissionDropdown(): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(
      `${this.baseUrl}permissions/active`,
      { headers: this.getHeaders() }
    );
  }

  getPermissionStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}permissions/stats/overview`,
      { headers: this.getHeaders() }
    );
  }

  bulkUpdatePermissionStatus(permissionIds: number[], active: boolean): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}permissions/bulk/status`,
      { permissionIds, active },
      { headers: this.getHeaders('application/json') }
    );
  }

  // State Operations
  getStates(
    page: number = 1, 
    limit: number = 10, 
    search?: string, 
    sortBy: string = 'stateName', 
    sortOrder: string = 'ASC',
    status?: string
  ): Observable<ApiResponse<State[]>> {
    let params = `?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    
    if (search && search.trim()) {
      params += `&search=${encodeURIComponent(search)}`;
    }
    if (status) {
      params += `&status=${status}`;
    }
    
    return this.http.get<ApiResponse<State[]>>(
      `${this.baseUrl}states${params}`,
      { headers: this.getHeaders() }
    );
  }

  getStateById(id: number): Observable<ApiResponse<State>> {
    return this.http.get<ApiResponse<State>>(
      `${this.baseUrl}states/${id}`,
      { headers: this.getHeaders() }
    );
  }

  createState(data: Partial<State>): Observable<ApiResponse<State>> {
    return this.http.post<ApiResponse<State>>(
      `${this.baseUrl}states`,
      data,
      { headers: this.getHeaders('application/json') }
    );
  }

  updateState(id: number, data: Partial<State>): Observable<ApiResponse<State>> {
    return this.http.put<ApiResponse<State>>(
      `${this.baseUrl}states/${id}`,
      data,
      { headers: this.getHeaders('application/json') }
    );
  }

  deleteState(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}states/${id}`,
      { headers: this.getHeaders() }
    );
  }

  activateState(id: number): Observable<ApiResponse<State>> {
    return this.http.post<ApiResponse<State>>(
      `${this.baseUrl}states/${id}/activate`,
      {},
      { headers: this.getHeaders('application/json') }
    );
  }

  deactivateState(id: number): Observable<ApiResponse<State>> {
    return this.http.post<ApiResponse<State>>(
      `${this.baseUrl}states/${id}/deactivate`,
      {},
      { headers: this.getHeaders('application/json') }
    );
  }

  toggleStateStatus(id: number, active: boolean): Observable<ApiResponse<State>> {
    if (active) {
      return this.activateState(id);
    } else {
      return this.deactivateState(id);
    }
  }
  toggledistrictstatus(id: number, active: boolean): Observable<ApiResponse<State>> {
    if (active) {
      return this.activateState(id);
    } else {
      return this.deactivateState(id);
    }
  }
  getActiveStates(): Observable<ApiResponse<State[]>> {
    return this.http.get<ApiResponse<State[]>>(
      `${this.baseUrl}states/active`,
      { headers: this.getHeaders() }
    );
  }

  searchStates(searchTerm: string, page: number = 1, limit: number = 10): Observable<ApiResponse<State[]>> {
    return this.http.get<ApiResponse<State[]>>(
      `${this.baseUrl}states/search/${searchTerm}?page=${page}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
  }

  getStateDropdown(): Observable<ApiResponse<State[]>> {
    return this.http.get<ApiResponse<State[]>>(
      `${this.baseUrl}states/active`,
      { headers: this.getHeaders() }
    );
  }

  getStateStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}states/stats/overview`,
      { headers: this.getHeaders() }
    );
  }

  bulkUpdateStateStatus(stateIds: number[], active: boolean): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}states/bulk/status`,
      { stateIds, active },
      { headers: this.getHeaders('application/json') }
    );
  }





  // User Operations
getUsers(
  page: number = 1, 
  limit: number = 10, 
  search?: string, 
  sortBy?: string, 
  sortOrder?: string,
  roleId?: number,
  stateId?: number
): Observable<ApiResponse<User[]>> {
  let params = `?page=${page}&limit=${limit}`;
  if (search && search.trim()) {
    params += `&search=${encodeURIComponent(search)}`;
  }
  if (sortBy) {
    params += `&sortBy=${sortBy}`;
  }
  if (sortOrder) {
    params += `&sortOrder=${sortOrder}`;
  }
  if (roleId) {
    params += `&roleId=${roleId}`;
  }
  if (stateId) {
    params += `&stateId=${stateId}`;
  }
  
  return this.http.get<ApiResponse<User[]>>(
    this.baseUrl + "users" + params,
    { headers: this.headersWithToken = this.getHeaders() }
  );
}

getUserSelf(): Observable<ApiResponse<User>> {
  return this.http.get<ApiResponse<User>>(
    this.baseUrl + "users/self",
    { headers: this.headersWithToken = this.getHeaders() }
  );
}

createUser(data: Partial<User>): Observable<ApiResponse<User>> {
  return this.http.post<ApiResponse<User>>(
    this.baseUrl + "users", data,
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

updateUser(id: number, data: Partial<User>): Observable<ApiResponse<User>> {
  return this.http.put<ApiResponse<User>>(
    this.baseUrl + "users/" + id, data,
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

changeUserPassword(userId: number, newPassword: string) {
  return this.http.post<ApiResponse<any>>(
    `${this.baseUrl}users/${userId}/change-password`,
    { newPassword }
  );
}

deleteUser(id: number): Observable<ApiResponse<any>> {
  return this.http.delete<ApiResponse<any>>(
    this.baseUrl + "users/" + id,
    { headers: this.headersWithToken = this.getHeaders() }
  );
}

toggleUserStatus(id: number, active: boolean): Observable<ApiResponse<User>> {
  return this.http.post<ApiResponse<User>>(
    this.baseUrl + "users/" + id + "/toggle-status", 
    { active },
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

verifyUser(id: number): Observable<ApiResponse<User>> {
  return this.http.post<ApiResponse<User>>(
    this.baseUrl + "users/" + id + "/verify", 
    {},
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

changePassword(id: number, newPassword: string): Observable<ApiResponse<any>> {
  return this.http.post<ApiResponse<any>>(
    this.baseUrl + "users/" + id + "/change-password", 
    { newPassword },
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

getActiveUsers(): Observable<ApiResponse<User[]>> {
  return this.http.get<ApiResponse<User[]>>(
    this.baseUrl + "users/active",
    { headers: this.headersWithToken = this.getHeaders() }
  );
}

// Range Operations
getRanges(
  page: number = 1, 
  limit: number = 10, 
  search?: string, 
  sortBy?: string, 
  sortOrder?: string,
  stateId?: number
): Observable<ApiResponse<Range[]>> {
  let params = `?page=${page}&limit=${limit}`;
  if (search && search.trim()) {
    params += `&search=${encodeURIComponent(search)}`;
  }
  if (sortBy) {
    params += `&sortBy=${sortBy}`;
  }
  if (sortOrder) {
    params += `&sortOrder=${sortOrder}`;
  }
  if (stateId) {
    params += `&stateId=${stateId}`;
  }
  
  return this.http.get<ApiResponse<Range[]>>(
    this.baseUrl + "ranges" + params,
    { headers: this.headersWithToken = this.getHeaders() }
  );
}

createRange(data: Partial<Range>): Observable<ApiResponse<Range>> {
  return this.http.post<ApiResponse<Range>>(
    this.baseUrl + "ranges", data,
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

updateRange(id: number, data: Partial<Range>): Observable<ApiResponse<Range>> {
  return this.http.put<ApiResponse<Range>>(
    this.baseUrl + "ranges/" + id, data,
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

deleteRange(id: number): Observable<ApiResponse<any>> {
  return this.http.delete<ApiResponse<any>>(
    this.baseUrl + "ranges/" + id,
    { headers: this.headersWithToken = this.getHeaders() }
  );
}

activateRange(id: number): Observable<ApiResponse<Range>> {
  return this.http.put<ApiResponse<Range>>(
    this.baseUrl + "ranges/" + id + "/activate", {},
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

deactivateRange(id: number): Observable<ApiResponse<Range>> {
  return this.http.put<ApiResponse<Range>>(
    this.baseUrl + "ranges/" + id + "/deactivate", {},
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

GetRangeDropdown(): Observable<ApiResponse<any>> {
  return this.http.get<ApiResponse<any>>(
    this.baseUrl + "ranges/status/active",
    { headers: this.headersWithToken = this.getHeaders() }
  );
}


// District Operations
getDistricts(
  page: number = 1, 
  limit: number = 10, 
  search?: string, 
  sortBy?: string, 
  sortOrder?: string,
  stateId?: number,
  rangeId?: number
): Observable<ApiResponse<Districts[]>> {
  let params = `?page=${page}&limit=${limit}`;
  if (search && search.trim()) {
    params += `&search=${encodeURIComponent(search)}`;
  }
  if (sortBy) {
    params += `&sortBy=${sortBy}`;
  }
  if (sortOrder) {
    params += `&sortOrder=${sortOrder}`;
  }
  if (stateId) {
    params += `&stateId=${stateId}`;
  }
  if (rangeId) {
    params += `&rangeId=${rangeId}`;
  }
  
  return this.http.get<ApiResponse<Districts[]>>(
    this.baseUrl + "districts" + params,
    { headers: this.headersWithToken = this.getHeaders() }
  );
}

createDistrict(data: Partial<Districts>): Observable<ApiResponse<Districts>> {
  return this.http.post<ApiResponse<Districts>>(
    this.baseUrl + "districts", data,
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

updateDistrict(id: number, data: Partial<Districts>): Observable<ApiResponse<Districts>> {
  const url = this.baseUrl + "districts/" + id;
  console.log('Update District URL:', url);
  console.log('Update District Data:', JSON.stringify(data));
  
  return this.http.put<ApiResponse<Districts>>(
    url, data,
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

deleteDistrict(id: number): Observable<ApiResponse<any>> {
  return this.http.delete<ApiResponse<any>>(
    this.baseUrl + "districts/" + id,
    { headers: this.headersWithToken = this.getHeaders() }
  );
}

getDistrictDropdown(): Observable<ApiResponse<any>> {
  return this.http.get<ApiResponse<any>>(
    this.baseUrl + "districts/status/active",
    { headers: this.headersWithToken = this.getHeaders() }
  );
}




toggleRoleStatus(id: number, active: boolean): Observable<ApiResponse<Role>> {
  return this.http.post<ApiResponse<Role>>(
    this.baseUrl + "roles/" + id + "/toggle-status", 
    { active },
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

// Battalion Operations
getBattalions(
  page: number = 1,
  limit: number = 10,
  sortOrder: 'ASC' | 'DESC' = 'ASC'
): Observable<ApiResponse<Battalion[]>> {
  const params = `?page=${page}&limit=${limit}&sortOrder=${sortOrder}`;
  return this.http.get<ApiResponse<Battalion[]>>(
    this.baseUrl + "battalions" + params,
    { headers: this.headersWithToken = this.getHeaders() }
  );
}

getActiveBattalions(): Observable<ApiResponse<Battalion[]>> {
  return this.http.get<ApiResponse<Battalion[]>>(
    this.baseUrl + "battalions/active",
    { headers: this.headersWithToken = this.getHeaders() }
  );
}

getBattalionById(id: number): Observable<ApiResponse<Battalion>> {
  return this.http.get<ApiResponse<Battalion>>(
    this.baseUrl + "battalions/" + id,
    { headers: this.headersWithToken = this.getHeaders() }
  );
}

createBattalion(data: Partial<Battalion>): Observable<ApiResponse<Battalion>> {
  return this.http.post<ApiResponse<Battalion>>(
    this.baseUrl + "battalions", data,
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

updateBattalion(id: number, data: Partial<Battalion>): Observable<ApiResponse<Battalion>> {
  return this.http.put<ApiResponse<Battalion>>(
    this.baseUrl + "battalions/" + id, data,
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

deleteBattalion(id: number): Observable<ApiResponse<any>> {
  return this.http.delete<ApiResponse<any>>(
    this.baseUrl + "battalions/" + id,
    { headers: this.headersWithToken = this.getHeaders() }
  );
}

toggleBattalionStatus(id: number): Observable<ApiResponse<Battalion>> {
  return this.http.patch<ApiResponse<Battalion>>(
    this.baseUrl + "battalions/" + id + "/toggle-status", {},
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}

getBattalionsByRange(rangeId: number): Observable<ApiResponse<Battalion[]>> {
  return this.http.get<ApiResponse<Battalion[]>>(
    this.baseUrl + "battalions/by-range/" + rangeId,
    { headers: this.headersWithToken = this.getHeaders() }
  );
}

getBattalionsByDistrict(districtId: number): Observable<ApiResponse<Battalion[]>> {
  return this.http.get<ApiResponse<Battalion[]>>(
    this.baseUrl + "battalions/by-district/" + districtId,
    { headers: this.headersWithToken = this.getHeaders() }
  );
}

testBattalionRoutes(): Observable<any> {
  return this.http.get<any>(
    this.baseUrl + "battalions/test",
    { headers: this.headersWithToken = this.getHeaders() }
  );
}


getRolePermissions(roleId: number): Observable<ApiResponse<Permission[]>> {
  return this.http.get<ApiResponse<Permission[]>>(
    this.baseUrl + 'permission-handle/'+ roleId,
    { headers: this.headersWithToken = this.getHeaders() }
  );
}
createRolePermissions(roleId: number, data: any): Observable<ApiResponse<any>> {
   console.log('Sending to API:', {
    roleId,
    data: JSON.stringify(data, null, 2)
  });
  
  return this.http.post<ApiResponse<any>>(
    this.baseUrl + 'permission-handle/' + roleId,
    data,
    { headers: this.headersWithToken = this.getHeaders('application/json') }
  );
}
}

