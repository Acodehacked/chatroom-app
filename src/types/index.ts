export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  roomId: string;
  timestamp: Date;
  reactions?: Record<string, string[]>; // emoji -> userIds
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  lastMessage?: {
    text: string;
    senderName: string;
    timestamp: Date;
  };
  participantCount: number;
  isPublic: boolean;
}

export interface TypingUser {
  uid: string;
  displayName: string;
  roomId: string;
  timestamp: Date;
}