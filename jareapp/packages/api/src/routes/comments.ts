import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { commentLimiter } from '../middleware/rateLimiter';
import {
  createComment,
  updateComment,
  deleteComment,
  reactToComment,
  reportComment,
} from '../controllers/comments.controller';

const router = Router();

router.use(authenticate);

router.post('/', commentLimiter, createComment);
router.patch('/:id', updateComment);
router.delete('/:id', deleteComment);
router.post('/:id/react', reactToComment);
router.post('/:id/report', reportComment);

export default router;
