import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getMyProfile,
  updateMyProfile,
  getUserById,
  sendConnectionRequest,
  respondToConnection,
  getMyConnections,
  getMyNotifications,
  markAllNotificationsRead,
  getNeighborhoodChampions,
} from '../controllers/users.controller';

const router = Router();

router.use(authenticate);

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);
router.get('/me/connections', getMyConnections);
router.get('/me/notifications', getMyNotifications);
router.patch('/me/notifications/read-all', markAllNotificationsRead);
router.get('/neighborhood-champions', getNeighborhoodChampions);
router.get('/:id', getUserById);
router.post('/:id/connect', sendConnectionRequest);
router.patch('/connections/:id', respondToConnection);

export default router;
