import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add auth header with jwt if user is logged in and request is to the API
    if (this.authService.isLoggedIn() && this.isApiUrl(request.url)) {
      request = this.addTokenHeader(request);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addTokenHeader(request: HttpRequest<any>): HttpRequest<any> {
    const token = this.getToken();
    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return request;
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.getRefreshToken();
      
      if (refreshToken) {
        return this.authService.refreshToken().pipe(
          switchMap((response: any) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(response.data.token);
            
            return next.handle(this.addTokenHeader(request));
          }),
          catchError((error) => {
            this.isRefreshing = false;
            this.authService['clearAuthData']();
            this.router.navigate(['/login']);
            return throwError(() => error);
          })
        );
      } else {
        // No refresh token available, redirect to login
        this.authService['clearAuthData']();
        this.router.navigate(['/login']);
        return throwError(() => new Error('Authentication required'));
      }
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(() => next.handle(this.addTokenHeader(request)))
    );
  }

  private isApiUrl(url: string): boolean {
    // Check if the request is to your API
    return url.includes('/api/') || url.startsWith('http://localhost:3000/') || url.startsWith('https://your-api-domain.com/');
  }

  private getToken(): string | null {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  private getRefreshToken(): string | null {
    return sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
  }
}