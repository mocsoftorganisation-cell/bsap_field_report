import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

export interface LoginRequest {
  email: string;
  password: string;
}

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
  roleId?: number;
  role: Role;
  stateId?: number;
  rangeId?: number;
  isFirst?: boolean;
  battalion?: number;
  verified?: boolean;
  permissions?: string[];
  created_date?: string;
  updated_date?: string;
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

// User interface updated above

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
      this.loadUserProfile();
    } else {
      this.clearAuthData();
    }
  }

  // Token management
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private setTokens(token: string, refreshToken?: string): void {
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  private clearAuthData(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  private getHeaders(contentType?: string): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (contentType) {
      headers = headers.set('Content-Type', contentType);
    } else {
      headers = headers.set('Content-Type', 'application/json');
    }
    
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

    // Handle authentication errors
    if (error.status === 401) {
      this.clearAuthData();
      this.router.navigate(['/login']);
    }

    return throwError(() => new Error(errorMessage));
  }

  // Authentication methods
  login(loginData: LoginRequest, remember: boolean = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${environment.apiUrl}auth/login`,
      loginData,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
  if ((response.status === 'SUCCESS' || response.status === 'true') && response.data.token) {
          this.setTokens(response.data.token, response.data.refreshToken);
          this.userSubject.next(response.data.user);
          this.isAuthenticatedSubject.next(true);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userEmail', response.data.user.email);
          // Store additional user info in localStorage
          localStorage.setItem('lastName', response.data.user.lastName || '');
          localStorage.setItem('firstName', response.data.user.firstName || '');
          localStorage.setItem('roleName', response.data.user.role?.roleName || '');
          localStorage.setItem('email', response.data.user.email || '');

          const userRole = response.data.user.role;
        const roleId = userRole?.id || response.data.user.roleId;


         console.log('Role info from API:', {
          roleObject: userRole,
          roleId: roleId,
          roleName: userRole?.roleName
        });


        if (userRole) {
          // If we have role object
          localStorage.setItem('roleId', userRole.id.toString());
          localStorage.setItem('roleName', userRole.roleName);
        } else if (roleId) {
          // If we only have roleId
          localStorage.setItem('roleId', roleId.toString());
          localStorage.setItem('roleName', ''); // Clear or set default
        }
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // Legacy login method for backward compatibility
  async loginLegacy(email: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.login({ email, password }).subscribe({
        next: (response) => {
          if (response.status) {
            resolve();
          } else {
            reject(new Error(response.message || 'Login failed'));
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  // logout(): Observable<any> {
  //   const token = this.getToken();
  //   if (token) {
  //     return this.http.post(
  //       `${environment.apiUrl}auth/logout`,
  //       {},
  //       { headers: this.getHeaders() }
  //     ).pipe(
  //       tap(() => this.clearAuthData()),
  //       catchError((error) => {
  //         this.clearAuthData();
  //         return throwError(() => error);
  //       })
  //     );
  //   } else {
  //     this.clearAuthData();
  //     return new Observable(observer => {
  //       observer.next({});
  //       observer.complete();
  //     });
  //   }
  // }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearAuthData();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<LoginResponse>(
      `${environment.apiUrl}auth/refresh`,
      { refreshToken },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response.status && response.data.token) {
          this.setTokens(response.data.token, response.data.refreshToken);
          this.userSubject.next(response.data.user);
          this.isAuthenticatedSubject.next(true);
        }
      }),
      catchError(error => {
        this.clearAuthData();
        return this.handleError(error);
      })
    );
  }

  // User profile methods
  loadUserProfile(): Observable<User> {
    return this.http.get<ApiResponse<User>>(
      `${environment.apiUrl}auth/profile`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      tap(user => {
        this.userSubject.next(user);
        localStorage.setItem('userEmail', user.email);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  profile(): Observable<User> {
    return this.loadUserProfile();
  }

  updateProfile(profileData: Partial<User>): Observable<User> {
    return this.http.put<ApiResponse<User>>(
      `${environment.apiUrl}auth/profile`,
      profileData,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      tap(user => this.userSubject.next(user)),
      catchError(this.handleError.bind(this))
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}auth/change-password`,
      { oldPassword, newPassword },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Utility methods
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
    const user = this.getCurrentUser();
    return user?.permissions?.includes(permission) || false;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
  return user?.role?.roleName === role;
  }

  // Legacy method for backward compatibility
  logins(data: any): Observable<any> {
    return this.login(data);
  }

  getUserRoleName(): string | null {
  // First try to get from current user object
  const currentUser = this.getCurrentUser();
  if (currentUser?.role?.roleName) {
    return currentUser.role.roleName;
  }
  
  // Fall back to localStorage
  return localStorage.getItem('roleName');
}

getUserRoleId(): number | null {
  // First try to get from current user object
  const currentUser = this.getCurrentUser();
  const roleId = currentUser?.role?.id || currentUser?.roleId;
  if (roleId !== undefined && roleId !== null) {
    return roleId;
  }
  
  // Fall back to localStorage
  const storedRoleId = localStorage.getItem('roleId');
  return storedRoleId ? parseInt(storedRoleId) : null;
}
// hasRole(roleName: string): boolean {
//   return this.getUserRoleName() === roleName;
// }

hasRoleId(roleId: number): boolean {
  return this.getUserRoleId() === roleId;
}
}