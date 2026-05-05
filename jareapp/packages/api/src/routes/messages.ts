import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { messageLimiter } from '../middleware/rateLimiter';
import {
  getConversations,
  getThread,
  sendMessage,
  markThreadRead,
} from '../controllers/messages.controller';

const router = Router();

router.use(authenticate);

router.get('/conversations', getConversations);
router.get('/conversations/:userId', getThread);
router.post('/conversations/:userId', messageLimiter, sendMessage);
router.patch('/conversations/:userId/read', markThreadRead);

export default router;
