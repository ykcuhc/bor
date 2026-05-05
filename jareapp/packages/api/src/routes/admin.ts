import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getReports,
  resolveReport,
  getUsers,
  banUser,
  promoteUser,
  getStats,
  broadcastAlert,
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']));

router.get('/reports', getReports);
router.patch('/reports/:id', resolveReport);
router.get('/users', getUsers);
router.patch('/users/:id/ban', banUser);
router.patch('/users/:id/promote', promoteUser);
router.get('/stats', getStats);
router.post('/alerts/broadcast', broadcastAlert);

export default router;
