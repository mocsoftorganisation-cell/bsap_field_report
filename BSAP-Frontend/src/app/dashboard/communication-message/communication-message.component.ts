import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Message {
  id: number;
  message: string;
  createdDateFormatted: string;
}

interface Communication {
  name: string;
  message: Message;
}

interface Reply {
  replyDate: string;
  replyBy: string;
  message: string;
  document?: string;
}

@Component({
  selector: 'app-communication',
  templateUrl: './communication-message.component.html',
  styleUrls: ['./communication-message.component.css'],
  standalone:true,
  imports:[FormsModule,CommonModule]
})
export class CommunicationMessageComponent {
  CMVWUS = true;   // flag for "Show Status" button
  RLYCOM = true;   // flag for reply box

  communication: Communication = {
    name: 'Test Communication',
    message: { id: 1, message: 'This is a test message', createdDateFormatted: '25-Sep-2025' }
  };

  replies: Reply[] = [
    { replyDate: '25-Sep-2025', replyBy: 'Admin', message: 'Reply 1', document: '' },
    { replyDate: '26-Sep-2025', replyBy: 'User', message: 'Reply 2', document: 'file.pdf' }
  ];

  users: string[] = ['User A', 'User B', 'User C'];

  userStatus = [
    { name: 'User A', state: 'Read' },
    { name: 'User B', state: 'Unread' }
  ];

  replyMessage: string = '';
  replyAttachments: File[] = [];

  goBack() {
    history.back();
  }

  viewMessageInfo() {
    console.log('Show Status clicked');
  }

  onFileChange(event: any) {
    this.replyAttachments = Array.from(event.target.files);
  }

  sendReply() {
    if (this.replyMessage.trim()) {
      console.log('Sending reply:', this.replyMessage, this.replyAttachments);
      this.replyMessage = '';
      this.replyAttachments = [];
    }
  }
}
