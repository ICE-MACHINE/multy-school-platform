export interface SendMessageDTO {
  content: string;
  senderType: 'teacher' | 'parent';
  senderId: string;
  receiverId: string;
  studentId: string;
  schoolId: string;
  conversationId?: string;
}