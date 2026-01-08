export interface Communication {
  id: number;
  name: string;
  subject: string;
  message: string;
  createdDate: Date;
  createdDateFormatted?: string;
  battalionId: number;
  battalionName?: string;
  document?: string;
  active: boolean;
  replies?: Reply[];
  createdBy?: number;
  updatedBy?: number;
  description?: string;
  communicationUsers?: CommunicationUser[];
  messages?: CommunicationMessage[];
}

export interface Reply {
  id: number;
  replyDate: Date;
  replyBy: string;
  message: string;
  document?: string;
  communicationsMessageId?: number;
  active?: boolean;
  attachments?: CommunicationAttachment[];
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

export interface Battalion {
  id: number;
  battalionName: string;
  rangeId?: number;
  districtId?: number;
  active: boolean;
  range?: {
    id: number;
    rangeName: string;
  };
  district?: {
    id: number;
    districtName: string;
  };
}

// Reuse your existing User interface from api.service.ts
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  roleId: number;
  role?: Role;
  stateId?: number;
  rangeId?: number;
  districtId?: number;
  battalionId?: number;
  active: boolean;
}

export interface Role {
  id: number;
  roleName: string;
  active: boolean;
}