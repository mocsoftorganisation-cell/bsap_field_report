// navigation-helper.service.ts (frontend)
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { PerformanceStatisticService } from './performance-statistic.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationHelperService {
  constructor(
    private performanceService: PerformanceStatisticService
  ) {}

  // Get next navigation target
  getNextTopic(moduleId: number, topicId: number): Observable<{ moduleId: number, topicId: number , isSameModule:boolean } | null> {
    return this.performanceService.getNextTopic(moduleId, topicId).pipe(
      map(response => {
        if (response.status === 'SUCCESS' && response.data) {
           const responseModuleId = response.data.moduleId;
          return {...response.data,
          isSameModule : responseModuleId === moduleId
          };
        }
        return null;
      }),
      catchError(error => {
        console.error('Error getting next topic:', error);
        return of(null);
      })
    );
  }

  // Get previous navigation target
  getPreviousTopic(moduleId: number, topicId: number): Observable<{ moduleId: number, topicId: number } | null> {
    return this.performanceService.getPreviousTopic(moduleId, topicId).pipe(
      map(response => {
        if (response.status === 'SUCCESS' && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error getting previous topic:', error);
        return of(null);
      })
    );
  }

  // Get complete navigation info
  getNavigationInfo(moduleId: number, topicId: number): Observable<{
    next: { moduleId: number, topicId: number } | null;
    prev: { moduleId: number, topicId: number } | null;
    currentPosition: any;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    return this.performanceService.getNavigationInfo(moduleId, topicId).pipe(
      map(response => {
        if (response.status === 'SUCCESS' && response.data) {
          return response.data;
        }
        return {
          next: null,
          prev: null,
          currentPosition: {},
          hasNext: false,
          hasPrevious: false
        };
      }),
      catchError(error => {
        console.error('Error getting navigation info:', error);
        return of({
          next: null,
          prev: null,
          currentPosition: {},
          hasNext: false,
          hasPrevious: false
        });
      })
    );
  }

  // Navigate to next
  // navigateToNext(moduleId: number, currentTopicId: number): Observable<{ moduleId: number, topicId: number , isSameModule:boolean} | null> {
  //   return this.performanceService.getNextTopic(moduleId, currentTopicId).pipe(
  //   map(response => {
  //     if (response.status === 'SUCCESS' && response.data) {
  //       return response.data;
  //     }
  //     return null;
  //   }),
  //   catchError(error => {
  //     console.error('Error getting next topic:', error);
  //     return of(null);
  //   })
  // );

  // }

  navigateToNext(moduleId: number, currentTopicId: number): Observable<{ 
  moduleId: number, 
  topicId: number,
  isSameModule: boolean 
} | null> {
  return this.getNextTopic(moduleId, currentTopicId);
}

  // Navigate to previous
  navigateToPrevious(moduleId: number, topicId: number): Observable<{ moduleId: number, topicId: number } | null> {
    return this.getPreviousTopic(moduleId, topicId);
  }
}