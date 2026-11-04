import { In, IsNull } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { Message } from './message.entity';
import { Conversation } from './conversation.entity';
import { Student } from '../student/student.entity';
import { Course } from '../course/course.entity';
import { Parent } from '../parent/parent.entity';
import { Teacher } from '../teacher/teacher.entity';
import { SchoolAdmin } from '../schoolAdmin/schoolAdmin.entity';
import { School } from '../school/school.entity';
import { SchoolService, schoolService as defaultSchoolService } from '../school/school.service';
import { NotificationService, notificationService as defaultNotificationService } from '../notification/notification.service';
import { ApiError } from '../../shared/utils/ApiError';
import { encrypt, decrypt } from '../../shared/utils/encryption';
import type { SenderType } from '../../shared/interfaces';

interface ConversationRow {
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

export class MessageService {
  constructor(
    private readonly messageRepo = AppDataSource.getRepository(Message),
    private readonly conversationRepo = AppDataSource.getRepository(Conversation),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly courseRepo = AppDataSource.getRepository(Course),
    private readonly parentRepo = AppDataSource.getRepository(Parent),
    private readonly teacherRepo = AppDataSource.getRepository(Teacher),
    private readonly schoolAdminRepo = AppDataSource.getRepository(SchoolAdmin),
    private readonly schoolRepo = AppDataSource.getRepository(School),
    private readonly schoolService: SchoolService = defaultSchoolService,
    private readonly notificationService: NotificationService = defaultNotificationService,
  ) {}

  async getConversationList(schoolId: string, userId: string, userRole: string): Promise<ConversationRow[]> {
    if (userRole === 'school_admin') return this.getAdminConversationList(schoolId, userId);
    if (userRole === 'teacher') return this.getTeacherConversationList(schoolId, userId);
    return this.getParentConversationList(schoolId, userId);
  }

  private async getAdminConversationList(schoolId: string, adminId: string): Promise<ConversationRow[]> {
    const parents = await this.parentRepo.find({
      where: { schoolId, isActive: true },
      order: { firstName: 'ASC' },
    });
    const conversations = await this.conversationRepo.find({ where: { schoolId, adminId } });
    const enrichment = await this.buildEnrichment(conversations, adminId);

    const rows = parents.map((p) => {
      const conv = conversations.find((c) => c.parentId === p.id);
      const en = conv ? enrichment.get(conv.id) : null;
      return {
        id: conv?.id ?? null,
        conversationId: conv?.id ?? null,
        participantId: p.id,
        participantName: `${p.firstName} ${p.lastName}`,
        participantRole: 'parent' as const,
        studentId: null,
        studentName: null,
        lastMessage: en?.lastMessage ?? null,
        lastMessageAt: en?.lastMessageAt ? new Date(en.lastMessageAt).toISOString() : null,
        unreadCount: en?.unreadCount ?? 0,
        isAdmin: false,
      };
    });

    return this.sortRows(rows);
  }

  private async getTeacherStudents(schoolId: string, teacherId: string): Promise<Student[]> {
    const teacher = await this.teacherRepo.findOne({ where: { id: teacherId, schoolId } });
    if (!teacher) return [];

    const byId = new Map<string, Student>();
    if (teacher.classroomId) {
      const classroomStudents = await this.studentRepo.find({
        where: { classroom: { id: teacher.classroomId }, schoolId },
        relations: ['parent'],
      });
      for (const student of classroomStudents) {
        if (student.isActive !== false) byId.set(student.id, student);
      }
    }

    const courses = await this.courseRepo.find({
      where: { teacherId, schoolId },
      relations: ['enrolledStudents'],
    });
    const enrolledIds = [
      ...new Set(courses.flatMap((course) => (course.enrolledStudents || []).map((s) => s.id))),
    ].filter((id) => !byId.has(id));
    if (enrolledIds.length > 0) {
      const enrolledStudents = await this.studentRepo.find({
        where: { id: In(enrolledIds), schoolId },
        relations: ['parent'],
      });
      for (const student of enrolledStudents) {
        if (student.isActive !== false) byId.set(student.id, student);
      }
    }

    return [...byId.values()].sort(
      (a, b) =>
        a.firstName.localeCompare(b.firstName, 'ar') || a.lastName.localeCompare(b.lastName, 'ar'),
    );
  }

  private async getTeacherConversationList(schoolId: string, teacherId: string): Promise<ConversationRow[]> {
    const students = await this.getTeacherStudents(schoolId, teacherId);
    if (students.length === 0) return [];
    const conversations = await this.conversationRepo.find({ where: { schoolId, teacherId } });
    const enrichment = await this.buildEnrichment(conversations, teacherId);

    const rows = students.map((s) => {
      const conv = conversations.find((c) => c.parentId === s.parentId && c.studentId === s.id);
      const en = conv ? enrichment.get(conv.id) : null;
      return {
        id: conv?.id ?? null,
        conversationId: conv?.id ?? null,
        participantId: s.parentId,
        participantName: s.parent ? `${s.parent.firstName} ${s.parent.lastName}` : 'ولي أمر',
        participantRole: 'parent' as const,
        studentId: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        lastMessage: en?.lastMessage ?? null,
        lastMessageAt: en?.lastMessageAt ? new Date(en.lastMessageAt).toISOString() : null,
        unreadCount: en?.unreadCount ?? 0,
        isAdmin: false,
      };
    });

    return this.sortRows(rows);
  }

  private async getParentConversationList(schoolId: string, parentId: string): Promise<ConversationRow[]> {
    const conversations = await this.conversationRepo.find({ where: { schoolId, parentId } });

    const schoolName = (await this.schoolRepo.findOne({ where: { id: schoolId } }))?.name || null;

    const teacherIds = [...new Set(conversations.map((c) => c.teacherId).filter(Boolean))] as string[];
    const studentIds = [...new Set(conversations.map((c) => c.studentId).filter(Boolean))] as string[];
    const [teachers, students] = await Promise.all([
      teacherIds.length ? this.teacherRepo.find({ where: { id: In(teacherIds) } }) : Promise.resolve([]),
      studentIds.length ? this.studentRepo.find({ where: { id: In(studentIds) } }) : Promise.resolve([]),
    ]);
    const teacherMap = new Map(teachers.map((t) => [t.id, t]));
    const studentMap = new Map(students.map((s) => [s.id, s]));

    const enrichment = await this.buildEnrichment(conversations, parentId);

    const rows: ConversationRow[] = conversations.map((conv) => {
      const en = enrichment.get(conv.id);
      if (conv.adminId) {
        return {
          id: conv.id,
          conversationId: conv.id,
          participantId: conv.adminId!,
          participantName: schoolName || 'الإدارة',
          participantRole: 'school_admin' as const,
          studentId: null,
          studentName: null,
          lastMessage: en?.lastMessage ?? null,
          lastMessageAt: en?.lastMessageAt ? new Date(en.lastMessageAt).toISOString() : null,
          unreadCount: en?.unreadCount ?? 0,
          isAdmin: true,
        };
      }
      const t = conv.teacherId ? teacherMap.get(conv.teacherId) : null;
      const st = conv.studentId ? studentMap.get(conv.studentId) : null;
      return {
        id: conv.id,
        conversationId: conv.id,
        participantId: conv.teacherId || '',
        participantName: t ? `${t.firstName} ${t.lastName}` : 'معلم',
        participantRole: 'teacher' as const,
        studentId: conv.studentId,
        studentName: st ? `${st.firstName} ${st.lastName}` : null,
        lastMessage: en?.lastMessage ?? null,
        lastMessageAt: en?.lastMessageAt ? new Date(en.lastMessageAt).toISOString() : null,
        unreadCount: en?.unreadCount ?? 0,
        isAdmin: false,
      };
    });

    const children = await this.studentRepo.find({
      where: { parentId, schoolId },
      relations: ['enrolledCourses'],
    });

    const courseTeacherIds = [
      ...new Set(
        children.flatMap((child) => (child.enrolledCourses || []).map((c) => c.teacherId).filter(Boolean)),
      ),
    ] as string[];
    const classroomTeacherIds: string[] = [];
    for (const child of children) {
      if (!child.classroomId) continue;
      const classroomTeacher = await this.teacherRepo.findOne({
        where: { classroomId: child.classroomId, schoolId },
        select: ['id'],
      });
      if (classroomTeacher) classroomTeacherIds.push(classroomTeacher.id);
    }
    const contactTeacherIds = [...new Set([...courseTeacherIds, ...classroomTeacherIds])];
    const contactTeachers = contactTeacherIds.length
      ? await this.teacherRepo.find({ where: { id: In(contactTeacherIds), schoolId } })
      : [];
    const contactTeacherMap = new Map(contactTeachers.map((t) => [t.id, t]));

    for (const child of children) {
      const teacherIdsForChild = new Set<string>();
      for (const course of child.enrolledCourses || []) {
        if (course.teacherId) teacherIdsForChild.add(course.teacherId);
      }
      if (child.classroomId) {
        const classroomTeacher = contactTeachers.find((t) => t.classroomId === child.classroomId);
        if (classroomTeacher) teacherIdsForChild.add(classroomTeacher.id);
      }
      for (const teacherId of teacherIdsForChild) {
        const exists = rows.some((r) => r.participantId === teacherId && r.studentId === child.id);
        if (exists) continue;
        const teacher = contactTeacherMap.get(teacherId);
        rows.push({
          id: null,
          conversationId: null,
          participantId: teacherId,
          participantName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'معلم',
          participantRole: 'teacher' as const,
          studentId: child.id,
          studentName: `${child.firstName} ${child.lastName}`,
          lastMessage: null,
          lastMessageAt: null,
          unreadCount: 0,
          isAdmin: false,
        });
      }
    }

    const admins = await this.schoolAdminRepo.find({
      where: { schoolId, isActive: true },
      order: { firstName: 'ASC' },
    });
    for (const admin of admins) {
      const exists = rows.some((r) => r.isAdmin && r.participantId === admin.id);
      if (exists) continue;
      rows.push({
        id: null,
        conversationId: null,
        participantId: admin.id,
        participantName: schoolName || 'الإدارة',
        participantRole: 'school_admin' as const,
        studentId: null,
        studentName: null,
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0,
        isAdmin: true,
      });
    }

    rows.sort((a, b) => (new Date(b.lastMessageAt || 0).getTime()) - (new Date(a.lastMessageAt || 0).getTime()));
    return rows;
  }

  private sortRows(rows: ConversationRow[]): ConversationRow[] {
    return rows.slice().sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      if (tb !== ta) return tb - ta;
      return String(a.participantName).localeCompare(String(b.participantName), 'ar');
    });
  }

  private async buildEnrichment(conversations: Conversation[], viewerId: string) {
    const map = new Map<string, { lastMessage: string | null; lastMessageAt: Date | null; unreadCount: number }>();
    if (conversations.length === 0) return map;

    const messages = await this.messageRepo.find({
      where: { conversationId: In(conversations.map((c) => c.id)) },
      order: { createdAt: 'ASC' },
    });

    for (const conv of conversations) {
      const convMsgs = messages.filter((m) => m.conversationId === conv.id);
      const last = convMsgs[convMsgs.length - 1];
      map.set(conv.id, {
        lastMessage: last ? decrypt(last.content) : null,
        lastMessageAt: last ? last.createdAt : conv.lastMessageAt,
        unreadCount: convMsgs.filter((m) => m.receiverId === viewerId && !m.isRead).length,
      });
    }
    return map;
  }

  async getConversationMessages(conversationId: string, userId: string, userRole: string) {
    const conv = await this.conversationRepo.findOne({ where: { id: conversationId } });
    if (!conv) {
      throw ApiError.notFound('المحادثة غير موجودة');
    }

    const isMember = userRole === 'school_admin'
      ? conv.adminId === userId || conv.teacherId === userId
      : userRole === 'teacher'
        ? conv.teacherId === userId
        : conv.parentId === userId;
    if (!isMember) {
      throw ApiError.forbidden('لا تملك صلاحية الوصول لهذه المحادثة');
    }

    const messages = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    await this.messageRepo.update(
      { conversationId, receiverId: userId, isRead: false },
      { isRead: true }
    );

    const participant = await this.getConversationParticipant(conv, userRole);

    return {
      conversation: participant,
      messages: messages.map((m) => ({
        ...m,
        content: decrypt(m.content),
        mine: m.senderId === userId,
      })),
    };
  }

  private async getConversationParticipant(conv: Conversation, userRole: string) {
    if (userRole === 'parent') {
      if (conv.adminId) {
        const schoolName = (await this.schoolRepo.findOne({ where: { id: conv.schoolId } }))?.name || null;
        return {
          participantId: conv.adminId,
          participantName: schoolName || 'الإدارة',
          participantRole: 'school_admin' as const,
          isAdmin: true,
          studentId: null,
          studentName: null,
        };
      }
      const t = conv.teacherId ? await this.teacherRepo.findOne({ where: { id: conv.teacherId } }) : null;
      const st = conv.studentId ? await this.studentRepo.findOne({ where: { id: conv.studentId } }) : null;
      return {
        participantId: conv.teacherId || '',
        participantName: t ? `${t.firstName} ${t.lastName}` : 'معلم',
        participantRole: 'teacher' as const,
        isAdmin: false,
        studentId: conv.studentId,
        studentName: st ? `${st.firstName} ${st.lastName}` : null,
      };
    }

    const parent = await this.parentRepo.findOne({ where: { id: conv.parentId } });
    const student = conv.studentId ? await this.studentRepo.findOne({ where: { id: conv.studentId } }) : null;
    return {
      participantId: conv.parentId,
      participantName: parent ? `${parent.firstName} ${parent.lastName}` : 'ولي أمر',
      participantRole: 'parent' as const,
      isAdmin: false,
      studentId: conv.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : null,
    };
  }

  async sendMessage(schoolId: string, data: any, userId: string, userRole: string) {
    await this.schoolService.assertMessagesCapacity(schoolId);

    const content = String(data.content || '').trim();
    if (!content) {
      throw ApiError.badRequest('محتوى الرسالة فارغ');
    }
    if (!data.receiverId) {
      throw ApiError.badRequest('المستلم مطلوب');
    }

    let conversationId = data.conversationId;
    if (conversationId) {
      const conv = await this.conversationRepo.findOne({ where: { id: conversationId, schoolId } });
      if (!conv) {
        throw ApiError.notFound('المحادثة غير موجودة');
      }
      const isMember = userRole === 'school_admin'
        ? conv.adminId === userId || conv.teacherId === userId
        : userRole === 'teacher'
          ? conv.teacherId === userId
          : conv.parentId === userId;
      if (!isMember) {
        throw ApiError.forbidden('لا تملك صلاحية الوصول لهذه المحادثة');
      }
    } else {
      const studentId = data.studentId || null;
      if (userRole === 'teacher') {
        await this.assertTeacherStudentParent(schoolId, userId, studentId, data.receiverId);
      } else if (userRole === 'parent') {
        await this.assertParentCanMessage(schoolId, userId, studentId, data.receiverId);
      } else if (userRole === 'school_admin') {
        const parent = await this.parentRepo.findOne({ where: { id: data.receiverId, schoolId } });
        if (!parent) {
          throw ApiError.forbidden('المستلم غير موجود في هذه المدرسة');
        }
      }
      conversationId = await this.getOrCreateConversationId(schoolId, userRole, userId, data.receiverId, studentId);
    }

    const senderType = (userRole === 'school_admin' ? 'school_admin' : userRole) as SenderType;
    const message = this.messageRepo.create({
      content: encrypt(content),
      senderType,
      senderId: userId,
      receiverId: data.receiverId,
      studentId: data.studentId || null,
      schoolId,
      conversationId,
    });
    const saved = await this.messageRepo.save(message);
    await this.conversationRepo.update(conversationId, { lastMessageAt: new Date() });

    const recipientRole = userRole === 'parent' ? (await this.getReceiverRoleForParent(conversationId)) : 'parent';
    await this.notifyReceiver(schoolId, userId, userRole, data.receiverId, recipientRole, conversationId);

    return {
      ...saved,
      content,
      conversationId,
    };
  }

  async sendGroup(schoolId: string, data: any, userId: string, userRole: string) {
    if (userRole === 'parent') {
      throw ApiError.forbidden('لا يمكن إرسال رسائل جماعية');
    }
    const content = String(data.content || '').trim();
    if (!content) {
      throw ApiError.badRequest('محتوى الرسالة فارغ');
    }
    await this.schoolService.assertMessagesCapacity(schoolId);

    if (userRole === 'teacher') {
      const studentIds = Array.isArray(data.studentIds) ? data.studentIds.filter(Boolean) : [];
      if (studentIds.length === 0) {
        throw ApiError.badRequest('يجب تحديد تلميذ واحد على الأقل');
      }
      let sent = 0;
      for (const studentId of studentIds) {
        const parentId = await this.assertTeacherStudentParent(schoolId, userId, studentId);
        const conversationId = await this.getOrCreateConversationId(schoolId, 'teacher', userId, parentId, studentId);
        const message = this.messageRepo.create({
          content: encrypt(content),
          senderType: 'teacher' as SenderType,
          senderId: userId,
          receiverId: parentId,
          studentId,
          schoolId,
          conversationId,
        });
        await this.messageRepo.save(message);
        await this.conversationRepo.update(conversationId, { lastMessageAt: new Date() });
        await this.notifyReceiver(schoolId, userId, 'teacher', parentId, 'parent', conversationId);
        sent++;
      }
      return { sent };
    }

    const parentIds = Array.isArray(data.parentIds) ? data.parentIds.filter(Boolean) : [];
    if (parentIds.length === 0) {
      throw ApiError.badRequest('يجب تحديد مستلم واحد على الأقل');
    }

    let sent = 0;
    for (const parentId of parentIds) {
      const conversationId = await this.getOrCreateConversationId(schoolId, userRole, userId, parentId, null);
      const message = this.messageRepo.create({
        content: encrypt(content),
        senderType: userRole as SenderType,
        senderId: userId,
        receiverId: parentId,
        studentId: null,
        schoolId,
        conversationId,
      });
      await this.messageRepo.save(message);
      await this.conversationRepo.update(conversationId, { lastMessageAt: new Date() });
      await this.notifyReceiver(schoolId, userId, userRole, parentId, 'parent', conversationId);
      sent++;
    }
    return { sent };
  }

  async getRecipients(schoolId: string, userId: string, userRole: string) {
    if (userRole === 'parent') return [];

    if (userRole === 'school_admin') {
      const parents = await this.parentRepo.find({
        where: { schoolId, isActive: true },
        order: { firstName: 'ASC' },
      });
      return parents.map((p) => ({
        parentId: p.id,
        parentName: `${p.firstName} ${p.lastName}`,
        children: [] as string[],
      }));
    }

    const students = await this.getTeacherStudents(schoolId, userId);
    return students
      .filter((s) => s.parentId)
      .map((s) => ({
        parentId: s.parentId!,
        parentName: s.parent ? `${s.parent.firstName} ${s.parent.lastName}` : 'ولي أمر',
        studentId: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
      }));
  }

  private async getOrCreateConversationId(schoolId: string, role: string, userId: string, receiverId: string, studentId: string | null) {
    if (role === 'school_admin') {
      const existing = await this.conversationRepo.findOne({
        where: { schoolId, adminId: userId, parentId: receiverId },
      });
      if (existing) return existing.id;
      const conv = this.conversationRepo.create({
        schoolId, adminId: userId, parentId: receiverId, studentId: null, lastMessageAt: new Date(),
      });
      return (await this.conversationRepo.save(conv)).id;
    }

    if (role === 'teacher') {
      const existing = await this.conversationRepo.findOne({
        where: { schoolId, teacherId: userId, parentId: receiverId, studentId: studentId || IsNull() },
      });
      if (existing) return existing.id;
      const conv = this.conversationRepo.create({
        schoolId, teacherId: userId, parentId: receiverId, studentId, lastMessageAt: new Date(),
      });
      return (await this.conversationRepo.save(conv)).id;
    }

    if (studentId) {
      const existing = await this.conversationRepo.findOne({
        where: { schoolId, parentId: userId, teacherId: receiverId, studentId },
      });
      if (existing) return existing.id;
      const conv = this.conversationRepo.create({
        schoolId, parentId: userId, teacherId: receiverId, studentId, lastMessageAt: new Date(),
      });
      return (await this.conversationRepo.save(conv)).id;
    }

    const existing = await this.conversationRepo.findOne({
      where: { schoolId, parentId: userId, adminId: receiverId },
    });
    if (existing) return existing.id;
    const conv = this.conversationRepo.create({
      schoolId, parentId: userId, adminId: receiverId, studentId: null, lastMessageAt: new Date(),
    });
    return (await this.conversationRepo.save(conv)).id;
  }

  private async assertTeacherStudentParent(schoolId: string, teacherId: string, studentId: string, parentId?: string): Promise<string> {
    const students = await this.getTeacherStudents(schoolId, teacherId);
    const student = students.find((s) => s.id === studentId);
    if (!student || !student.parentId) {
      throw ApiError.forbidden('التلميذ غير موجود أو لا يملك ولي أمر');
    }
    if (parentId && student.parentId !== parentId) {
      throw ApiError.forbidden('المستلم غير مرتبط بهذا التلميذ');
    }
    return student.parentId;
  }

  private async assertParentCanMessage(
    schoolId: string,
    parentId: string,
    studentId: string | null,
    receiverId: string,
  ): Promise<void> {
    if (!studentId) {
      const admin = await this.schoolAdminRepo.findOne({
        where: { id: receiverId, schoolId, isActive: true },
      });
      if (!admin) {
        throw ApiError.forbidden('المستلم غير موجود في هذه المدرسة');
      }
      return;
    }

    const student = await this.studentRepo.findOne({
      where: { id: studentId, schoolId, parentId },
      relations: ['enrolledCourses'],
    });
    if (!student) {
      throw ApiError.forbidden('التلميذ غير موجود أو غير مرتبط بك');
    }

    const teacher = await this.teacherRepo.findOne({ where: { id: receiverId, schoolId } });
    if (!teacher) {
      throw ApiError.forbidden('المستلم غير موجود في هذه المدرسة');
    }
    const teachesViaClassroom = Boolean(
      student.classroomId && teacher.classroomId && student.classroomId === teacher.classroomId,
    );
    const teachesViaCourse = (student.enrolledCourses || []).some((c) => c.teacherId === receiverId);
    if (!teachesViaClassroom && !teachesViaCourse) {
      throw ApiError.forbidden('هذا الأستاذ لا يدرّس هذا التلميذ');
    }
  }

  private async getReceiverRoleForParent(conversationId: string): Promise<string> {
    const conv = await this.conversationRepo.findOne({ where: { id: conversationId } });
    if (!conv) return 'teacher';
    return conv.adminId ? 'school_admin' : 'teacher';
  }

  private async notifyReceiver(schoolId: string, senderId: string, senderRole: string, receiverId: string, recipientRole: string, conversationId: string) {
    let senderName = '';
    if (senderRole === 'school_admin') {
      const admin = await this.schoolAdminRepo.findOne({ where: { id: senderId, schoolId } });
      senderName = admin ? `${admin.firstName} ${admin.lastName}` : 'الإدارة';
    } else if (senderRole === 'teacher') {
      const teacher = await this.teacherRepo.findOne({ where: { id: senderId, schoolId } });
      senderName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'معلم';
    } else {
      const parent = await this.parentRepo.findOne({ where: { id: senderId, schoolId } });
      senderName = parent ? `${parent.firstName} ${parent.lastName}` : 'ولي أمر';
    }
    await this.notificationService.createMessageNotification(senderName, receiverId, recipientRole, schoolId, conversationId);
  }

  async getUnreadCount(schoolId: string, userId: string) {
    const count = await this.messageRepo.count({
      where: { receiverId: userId, schoolId, isRead: false },
    });
    return { unreadCount: count };
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.messageRepo.update(
      { conversationId, receiverId: userId, isRead: false },
      { isRead: true }
    );
  }

  async deleteMessage(id: string, userId: string) {
    const message = await this.messageRepo.findOne({ where: { id } });
    if (!message) {
      throw ApiError.notFound('الرسالة غير موجودة');
    }
    if (message.senderId !== userId) {
      throw ApiError.forbidden('لا يمكن حذف رسائل المستخدمين الآخرين');
    }
    await this.messageRepo.remove(message);
  }

  async deleteOldest(schoolId: string, count: number) {
    if (!Number.isInteger(count) || count <= 0) {
      throw ApiError.badRequest('عدد الرسائل المطلوب حذفها غير صالح');
    }
    const messages = await this.messageRepo.find({
      where: { schoolId },
      order: { createdAt: 'ASC', id: 'ASC' },
      take: count,
    });
    const deleted = messages.length;
    if (deleted > 0) {
      await this.messageRepo.remove(messages);
    }
    const remaining = await this.messageRepo.count({ where: { schoolId } });
    return { deleted, remaining };
  }
}

export const messageService = new MessageService();
