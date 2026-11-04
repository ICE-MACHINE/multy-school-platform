import { Router } from 'express';
import { SchoolAdminController } from './schoolAdmin.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';
import { authLimiter } from '../../shared/middleware/rateLimiter.middleware';

const router = Router({ mergeParams: true });

router.post('/login', authLimiter, SchoolAdminController.login);
router.post('/refresh-token', authenticate, SchoolAdminController.refreshToken);

router.get('/dashboard', authenticate, authorize('school_admin'), SchoolAdminController.getDashboardStats);
router.post('/admins', authenticate, authorize('school_admin'), SchoolAdminController.createAdmin);

router.get('/teachers', authenticate, authorize('school_admin'), SchoolAdminController.getAllTeachers);
router.get('/teachers/:id', authenticate, authorize('school_admin'), SchoolAdminController.getTeacherById);
router.post('/teachers', authenticate, authorize('school_admin'), SchoolAdminController.createTeacher);
router.put('/teachers/:id', authenticate, authorize('school_admin'), SchoolAdminController.updateTeacher);
router.delete('/teachers/:id', authenticate, authorize('school_admin'), SchoolAdminController.deleteTeacher);

router.get('/parents', authenticate, authorize('school_admin'), SchoolAdminController.getAllParents);
router.get('/parents/:id/delete-preview', authenticate, authorize('school_admin'), SchoolAdminController.getParentDeletePreview);
router.get('/parents/:id', authenticate, authorize('school_admin'), SchoolAdminController.getParentById);
router.post('/parents', authenticate, authorize('school_admin'), SchoolAdminController.createParent);
router.put('/parents/:id', authenticate, authorize('school_admin'), SchoolAdminController.updateParent);
router.delete('/parents/:id', authenticate, authorize('school_admin'), SchoolAdminController.deleteParent);

router.get('/students', authenticate, authorize('school_admin'), SchoolAdminController.getAllStudents);
router.get('/students/:id/delete-preview', authenticate, authorize('school_admin'), SchoolAdminController.getStudentDeletePreview);
router.get('/students/:id', authenticate, authorize('school_admin'), SchoolAdminController.getStudentById);
router.post('/students', authenticate, authorize('school_admin'), SchoolAdminController.createStudent);
router.put('/students/:id', authenticate, authorize('school_admin'), SchoolAdminController.updateStudent);
router.delete('/students/:id', authenticate, authorize('school_admin'), SchoolAdminController.deleteStudent);

router.get('/classrooms', authenticate, authorize('school_admin'), SchoolAdminController.getAllClassrooms);
router.post('/classrooms', authenticate, authorize('school_admin'), SchoolAdminController.createClassroom);
router.put('/classrooms/:id', authenticate, authorize('school_admin'), SchoolAdminController.updateClassroom);
router.delete('/classrooms/:id', authenticate, authorize('school_admin'), SchoolAdminController.deleteClassroom);

router.get('/courses', authenticate, authorize('school_admin'), SchoolAdminController.getAllCourses);
router.post('/courses', authenticate, authorize('school_admin'), SchoolAdminController.createCourse);
router.put('/courses/:id', authenticate, authorize('school_admin'), SchoolAdminController.updateCourse);
router.delete('/courses/:id', authenticate, authorize('school_admin'), SchoolAdminController.deleteCourse);

router.get('/payments', authenticate, authorize('school_admin'), SchoolAdminController.getAllPayments);
router.post('/payments', authenticate, authorize('school_admin'), SchoolAdminController.createPayment);

router.get('/attendance', authenticate, authorize('school_admin'), SchoolAdminController.getAttendanceByDate);
router.patch('/attendance/:id/justify', authenticate, authorize('school_admin'), SchoolAdminController.justifyAbsence);

router.post('/messages', authenticate, authorize('school_admin'), SchoolAdminController.sendMessage);

router.put('/settings', authenticate, authorize('school_admin'), SchoolAdminController.updateSchool);

export default router;