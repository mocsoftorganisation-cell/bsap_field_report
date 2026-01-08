import { Injectable, Injector } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(
    private injector: Injector,  // Use Injector to avoid circular dependency
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Lazily get AuthService to avoid circular dependency
    const authService = this.injector.get(AuthService);
    
    // Check if this is an API request
    if (this.isApiUrl(request.url)) {
      const token = authService.getToken();
      
      if (token) {
        request = this.addToken(request, token);
      }
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next, authService);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(
    request: HttpRequest<any>, 
    next: HttpHandler, 
    authService: AuthService
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = authService.getRefreshToken();
      
      if (refreshToken) {
        return authService.refreshToken().pipe(
          switchMap((response: any) => {
            this.isRefreshing = false;
            const newToken = response.data.token;
            this.refreshTokenSubject.next(newToken);
            
            // Retry the original request with new token
            return next.handle(this.addToken(request, newToken));
          }),
          catchError((error) => {
            this.isRefreshing = false;
            authService.logout();
            return throwError(() => error);
          })
        );
      } else {
        // No refresh token available, redirect to login
        authService.logout();
        return throwError(() => new Error('Authentication required'));
      }
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        return next.handle(this.addToken(request, token!));
      })
    );
  }

  private isApiUrl(url: string): boolean {
    // Check if the request is to your API
    return url.includes('/api/') || 
           url.includes('localhost:5050') || 
           (url.startsWith('http') && url.includes('/api'));
  }
}