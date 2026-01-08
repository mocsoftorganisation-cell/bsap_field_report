import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';
        let shouldShowNotification = true;

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Client Error: ${error.error.message}`;
          this.notificationService.error('A network error occurred. Please check your connection.');
        } else {
          // Server-side error
          switch (error.status) {
            case 400:
              errorMessage = this.extractErrorMessage(error) || 'Bad Request';
              this.notificationService.warning(errorMessage);
              break;
            case 401:
              errorMessage = 'Unauthorized access';
              shouldShowNotification = false; // Handled by token interceptor
              break;
            case 403:
              errorMessage = 'Access forbidden';
              this.notificationService.error('You do not have permission to access this resource.');
              break;
            case 404:
              errorMessage = 'Resource not found';
              this.notificationService.warning('The requested resource was not found.');
              break;
            case 409:
              errorMessage = this.extractErrorMessage(error) || 'Conflict occurred';
              this.notificationService.warning(errorMessage);
              break;
            case 422:
              errorMessage = this.extractErrorMessage(error) || 'Validation error';
              this.notificationService.warning(errorMessage);
              break;
            case 429:
              errorMessage = 'Too many requests';
              this.notificationService.warning('Too many requests. Please try again later.');
              break;
            case 500:
              errorMessage = 'Internal server error';
              this.notificationService.error('A server error occurred. Please try again later.');
              break;
            case 502:
            case 503:
            case 504:
              errorMessage = 'Service unavailable';
              this.notificationService.error('The service is temporarily unavailable. Please try again later.');
              break;
            default:
              errorMessage = this.extractErrorMessage(error) || `HTTP Error: ${error.status}`;
              this.notificationService.error('An unexpected error occurred. Please try again.');
          }
        }

        // Log error to console for debugging
        console.error('HTTP Error:', {
          status: error.status,
          message: errorMessage,
          url: request.url,
          method: request.method,
          error: error
        });

        // Return error with formatted message
        const formattedError = new Error(errorMessage);
        (formattedError as any).status = error.status;
        (formattedError as any).originalError = error;

        return throwError(() => formattedError);
      })
    );
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.error) {
      if (typeof error.error === 'string') {
        try {
          const parsedError = JSON.parse(error.error);
          return parsedError.message || parsedError.error || error.error;
        } catch {
          return error.error;
        }
      } else if (error.error.message) {
        return error.error.message;
      } else if (error.error.error) {
        return error.error.error;
      } else if (error.error.errors && Array.isArray(error.error.errors)) {
        return error.error.errors.join(', ');
      }
    }
    
    return error.message || 'Unknown error occurred';
  }
}