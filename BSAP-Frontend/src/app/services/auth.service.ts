import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

export interface Role {
  id: number;
  roleName: string;
  createdBy?: number;
  updatedBy?: number;
  active?: boolean;
  created_date?: string;
  updated_date?: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo?: string;
  contactNo?: string;
  roleId?: number;
  role: Role;
  stateId?: number;
  rangeId?: number;
  battalion?: number;
  verified?: boolean;
  permissions?: string[];
  created_date?: string;
  updated_date?: string;
  joining_date?: string;
  isFirst?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken?: string;
    isFirstLogin?: boolean;
  };
}

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<User | null>(null);

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      this.isAuthenticatedSubject.next(true);
      this.loadUserProfile().subscribe();
    } else {
      this.clearAuthData();
    }
  }

  /** ======================== PUBLIC METHODS ======================== */
  public setUser(user: User): void {
    this.userSubject.next(user);
  }

  /** ================= TOKEN HANDLING ================= */
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private setTokens(token: string, refreshToken?: string): void {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  }

  private clearAuthData(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('roleName');
    localStorage.removeItem('contactNo'); // Add this
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }

  private getHeaders(contentType?: string): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    headers = headers.set('Content-Type', contentType || 'application/json');
    return headers;
  }

  private handleError(error: any): Observable<never> {
  let errorMessage = 'An error occurred';
  
  if (error.error) {
    if (typeof error.error === 'string') {
      errorMessage = error.error;
    } else if (error.error.message) {
      errorMessage = error.error.message;
    }
  } else if (error.message) {
    errorMessage = error.message;
  }

  console.log('Error details:', {
    status: error.status,
    url: error.url,
    message: errorMessage
  });

  // Don't logout for password change errors (401)
  const isPasswordChangeError = error.url?.includes('change-password');
  
  if (error.status === 401 && !isPasswordChangeError) {
    console.log('Session expired, logging out...');
    this.clearAuthData();
    this.router.navigate(['/login']);
  }
  
  return throwError(() => new Error(errorMessage));
}

  /** ================= AUTHENTICATION ================= */
  login(loginData: LoginRequest, remember: boolean = false): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}auth/login`, loginData, { headers: this.getHeaders() })
      .pipe(
        tap(response => {
          if ((response.status === 'SUCCESS' || response.status === 'true') && response.data.token) {
            this.setTokens(response.data.token, response.data.refreshToken);
            this.setUser(response.data.user);
            this.isAuthenticatedSubject.next(true);

            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', response.data.user.email);
            localStorage.setItem('firstName', response.data.user.firstName || '');
            localStorage.setItem('lastName', response.data.user.lastName || '');
            localStorage.setItem('roleName', response.data.user.role?.roleName || '');
            if (response.data.user.contactNo) {
              localStorage.setItem('contactNo', response.data.user.contactNo);
            }
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return throwError(() => new Error('No refresh token available'));

    return this.http.post<LoginResponse>(`${environment.apiUrl}auth/refresh`, { refreshToken }, { headers: this.getHeaders() }).pipe(
      tap(response => {
        if (response.status && response.data.token) {
          this.setTokens(response.data.token, response.data.refreshToken);
          this.setUser(response.data.user);
          this.isAuthenticatedSubject.next(true);
        }
      }),
      catchError(error => {
        this.clearAuthData();
        return this.handleError(error);
      })
    );
  }

  /** ================= USER PROFILE ================= */
  loadUserProfile(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}auth/profile`, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('Profile loaded from API:', res.data);
        return res.data;
      }),
      tap(user => {
        this.setUser(user);
        // Update localStorage with contactNo
        if (user.contactNo) {
          localStorage.setItem('contactNo', user.contactNo);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /** ================= UPDATE PROFILE ================= */
  updateProfile(profileData: Partial<User>): Observable<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      console.error('No user logged in');
      return throwError(() => new Error('No user logged in'));
    }

    console.log('=== UPDATE PROFILE REQUEST ===');
    console.log('User ID:', currentUser.id);
    console.log('Profile Data Received:', profileData);
    console.log('ContactNo in profileData:', profileData.contactNo);

    // IMPORTANT: Remove mobileNo if it exists (we don't want to update mobileNo)
    const { mobileNo, ...dataWithoutMobile } = profileData;
    
    // Create payload with userId - ONLY send contactNo, not mobileNo
    const payload = { 
      userId: currentUser.id, 
      ...dataWithoutMobile 
    };

    console.log('Payload being sent (mobileNo removed):', payload);

    const apiEndpoint = `${environment.apiUrl}users/profile`;
    console.log('Using endpoint:', apiEndpoint);

    return this.http.put<any>(apiEndpoint, payload, { headers: this.getHeaders() }).pipe(
      map((response: any) => {
        console.log('Raw backend response:', response);
        
        // Handle backend response format
        if (response.success !== undefined) {
          if (!response.success) {
            throw new Error(response.message || 'Update failed');
          }
          return response.user;
        }
        else if (response.status !== undefined) {
          if (!response.status) {
            throw new Error(response.message || 'Update failed');
          }
          return response.data;
        }
        else {
          return response;
        }
      }),
      tap((user: User) => {
        console.log('✅ Profile updated successfully:', user);
        console.log('Updated contactNo:', user.contactNo);
        
        this.setUser(user);
        
        // Update localStorage
        localStorage.setItem('firstName', user.firstName);
        localStorage.setItem('lastName', user.lastName || '');
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('roleName', user.role?.roleName || '');
        if (user.contactNo) {
          localStorage.setItem('contactNo', user.contactNo);
        }
      }),
      catchError(error => {
        console.error('❌ Update profile error:', error);
        return this.handleError(error);
      })
    );
  }

changePassword(currentPassword: string, newPassword: string): Observable<any> {
  console.log('🔑 Sending password change request:', {
    hasCurrentPassword: !!currentPassword,
    hasNewPassword: !!newPassword
  });
  
  const payload = { 
    currentPassword, 
    newPassword 
  };
  
  console.log('Payload:', payload);

  return this.http.post(`${environment.apiUrl}auth/change-password`, payload, { 
    headers: this.getHeaders() 
  }).pipe(
    map((response: any) => {
      console.log('✅ Password change response:', response);
      return response;
    }),
    catchError(error => {
      console.error('❌ Password change error:', error);
      
      // Handle password change errors specifically
      if (error.status === 401) {
        // Password is incorrect - don't logout, just show error
        const errorMsg = error.error?.message || 'Current password is incorrect';
        return throwError(() => new Error(errorMsg));
      }
      
      if (error.status === 400) {
        const errorMsg = error.error?.message || 'Invalid password data';
        return throwError(() => new Error(errorMsg));
      }
      
      return this.handleError(error);
    })
  );
}

  /** ================= UTILITIES ================= */
  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  getUserEmail(): string | null {
    const user = this.getCurrentUser();
    return user ? user.email : localStorage.getItem('userEmail');
  }

  hasPermission(permission: string): boolean {
    return this.getCurrentUser()?.permissions?.includes(permission) || false;
  }

  hasRole(role: string): boolean {
    return this.getCurrentUser()?.role?.roleName === role;
  }

  getUserRoleName(): string | null {
    return this.getCurrentUser()?.role?.roleName || localStorage.getItem('roleName');
  }

  getUserRoleId(): number | null {
    const currentUser = this.getCurrentUser();
    const roleId = currentUser?.role?.id || currentUser?.roleId;
    if (roleId !== undefined && roleId !== null) return roleId;
    const storedRoleId = localStorage.getItem('roleId');
    return storedRoleId ? parseInt(storedRoleId) : null;
  }

  hasRoleId(roleId: number): boolean {
    return this.getUserRoleId() === roleId;
  }

  logins(data: any): Observable<any> {
    return this.login(data);
  }
}