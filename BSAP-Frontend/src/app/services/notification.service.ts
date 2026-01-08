import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  dismissible?: boolean;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private notifications: Notification[] = [];
  private nextId = 1;

  constructor() {}

  // Show success notification
  success(message: string, duration: number = 5000): void {
    this.addNotification({
      message,
      type: 'success',
      duration,
      dismissible: true
    });
  }

  // Show error notification
  error(message: string, duration: number = 8000): void {
    this.addNotification({
      message,
      type: 'error',
      duration,
      dismissible: true
    });
  }

  // Show warning notification
  warning(message: string, duration: number = 6000): void {
    this.addNotification({
      message,
      type: 'warning',
      duration,
      dismissible: true
    });
  }

  // Show info notification
  info(message: string, duration: number = 5000): void {
    this.addNotification({
      message,
      type: 'info',
      duration,
      dismissible: true
    });
  }

  // Add notification
  private addNotification(notificationData: Partial<Notification>): void {
    const notification: Notification = {
      id: this.generateId(),
      message: notificationData.message || '',
      type: notificationData.type || 'info',
      duration: notificationData.duration || 5000,
      dismissible: notificationData.dismissible !== false,
      timestamp: new Date()
    };

    this.notifications.push(notification);
    this.notificationsSubject.next([...this.notifications]);

    // Auto-dismiss after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }
  }

  // Dismiss notification by ID
  dismiss(notificationId: string): void {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      this.notifications.splice(index, 1);
      this.notificationsSubject.next([...this.notifications]);
    }
  }

  // Dismiss all notifications
  dismissAll(): void {
    this.notifications = [];
    this.notificationsSubject.next([]);
  }

  // Get current notifications
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  // Generate unique ID
  private generateId(): string {
    return `notification-${this.nextId++}-${Date.now()}`;
  }
}