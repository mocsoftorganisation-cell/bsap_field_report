import { Injectable } from '@angular/core';
// UNUSED 2025-11-12 - WebSocketService disabled. Methods left as safe no-ops to avoid
// breaking callers across the frontend while removing runtime socket traffic.
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  // Keep the same API surface but make everything a safe no-op.
  // socket is intentionally left undefined when sockets are disabled.
  private socket: any;
  private isConnected = false;

  constructor() {
    console.warn('[UNUSED 2025-11-12] WebSocketService initialized but sockets are disabled.');
    // Do NOT initialize socket to avoid any network/socket activity.
  }

  // All listeners return an Observable that immediately completes and logs that sockets are disabled.
  onNewMessage(): Observable<any> {
    return new Observable(observer => {
      console.warn('[UNUSED 2025-11-12] onNewMessage called but WebSockets are disabled.');
      observer.complete();
      return () => {};
    });
  }

  onCommunicationUpdate(): Observable<any> {
    return new Observable(observer => { observer.complete(); return () => {}; });
  }

  onMessageStatusUpdate(): Observable<any> {
    return new Observable(observer => { observer.complete(); return () => {}; });
  }

  sendMessage(_messageData: any) {
    console.warn('[UNUSED 2025-11-12] sendMessage called but WebSockets are disabled.');
  }

  markAsRead(_readData: any) {
    console.warn('[UNUSED 2025-11-12] markAsRead called but WebSockets are disabled.');
  }

  notifyBattalion(_battalionId: string, _event: string, _data: any) {
    console.warn('[UNUSED 2025-11-12] notifyBattalion called but WebSockets are disabled.');
  }

  startTyping(_payload: any) {
    // no-op
  }

  stopTyping(_payload: any) {
    // no-op
  }

  onNewCommunication(): Observable<any> {
    return new Observable(observer => { observer.complete(); return () => {}; });
  }

  onUserTyping(): Observable<any> {
    return new Observable(observer => { observer.complete(); return () => {}; });
  }

  disconnect() {
    console.warn('[UNUSED 2025-11-12] disconnect called but WebSockets are disabled.');
  }

  getConnectionStatus(): boolean {
    return false;
  }
}
