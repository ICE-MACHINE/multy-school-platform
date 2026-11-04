export type MessageSenderType = 'teacher' | 'parent' | 'school_admin';

export interface Message {
  id: string;
  content: string;
  senderType: MessageSenderType;
  senderId: string;
  receiverId: string;
  studentId: string | null;
  schoolId: string;
  conversationId: string;
  isRead: boolean;
  createdAt: string;
  mine?: boolean;
}

export interface ConversationParticipant {
  participantId: string;
  participantName: string;
  participantRole: 'parent' | 'teacher' | 'school_admin';
  isAdmin: boolean;
  studentId: string | null;
  studentName: string | null;
}

export interface Conversation {
  id: string | null;
  conversationId: string | null;
  participantId: string;
  participantName: string;
  participantRole: 'parent' | 'teacher' | 'school_admin';
  studentId: string | null;
  studentName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isAdmin: boolean;
}

export interface ConversationThread {
  conversation: ConversationParticipant;
  messages: Message[];
}

export interface MessageRecipient {
  parentId: string;
  parentName: string;
  studentId?: string;
  studentName?: string;
  children?: string[];
}

export interface SendMessagePayload {
  content: string;
  receiverId: string;
  studentId?: string | null;
  conversationId?: string;
}

export interface SendGroupPayload {
  content: string;
  parentIds?: string[];
  studentIds?: string[];
}
