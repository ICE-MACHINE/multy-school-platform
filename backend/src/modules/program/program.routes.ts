import { Router } from 'express';
import { ProgramController } from './program.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router({ mergeParams: true });

router.get('/', authenticate, authorize('school_admin', 'teacher'), ProgramController.getAll);
router.get('/:id', authenticate, authorize('school_admin', 'teacher'), ProgramController.getById);
router.post('/', authenticate, authorize('school_admin', 'teacher'), ProgramController.create);
router.put('/:id', authenticate, authorize('school_admin', 'teacher'), ProgramController.update);
router.delete('/:id', authenticate, authorize('school_admin', 'teacher'), ProgramController.delete);

router.post('/modules', authenticate, authorize('school_admin', 'teacher'), ProgramController.createModule);
router.put('/modules/:moduleId', authenticate, authorize('school_admin', 'teacher'), ProgramController.updateModule);
router.delete('/modules/:moduleId', authenticate, authorize('school_admin', 'teacher'), ProgramController.deleteModule);
router.get('/course/:courseId', authenticate, authorize('school_admin', 'teacher'), ProgramController.getByCourse);

export default router;