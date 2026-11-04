import { AppDataSource } from '../../config/data-source';
import { Message } from '../message/message.entity';
import { Conversation } from '../message/conversation.entity';
import { SchoolService, schoolService as defaultSchoolService } from '../school/school.service';
import { encrypt } from '../../shared/utils/encryption';

export class SchoolAdminMessagesService {
  constructor(
    private readonly messageRepo = AppDataSource.getRepository(Message),
    private readonly conversationRepo = AppDataSource.getRepository(Conversation),
    private readonly schoolService: SchoolService = defaultSchoolService,
  ) {}

  async sendMessage(schoolId: string, data: any) {
    await this.schoolService.assertMessagesCapacity(schoolId);

    let conversationId = data.conversationId;
    if (!conversationId) {
      const existingConv = await this.conversationRepo.findOne({
        where: {
          teacherId: data.senderType === 'teacher' ? data.senderId : data.receiverId,
          parentId: data.senderType === 'parent' ? data.senderId : data.receiverId,
          studentId: data.studentId,
          schoolId,
        },
      });

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        const conversation = this.conversationRepo.create({
          teacherId: data.senderType === 'teacher' ? data.senderId : data.receiverId,
          parentId: data.senderType === 'parent' ? data.senderId : data.receiverId,
          studentId: data.studentId,
          schoolId,
          lastMessageAt: new Date(),
        });
        const savedConv = await this.conversationRepo.save(conversation);
        conversationId = savedConv.id;
      }
    }

    const encryptedContent = encrypt(data.content);
    const message = this.messageRepo.create({
      ...data,
      content: encryptedContent,
      schoolId,
      conversationId,
    });

    await this.conversationRepo.update(conversationId, { lastMessageAt: new Date() });
    return this.messageRepo.save(message);
  }
}

export const schoolAdminMessagesService = new SchoolAdminMessagesService();
