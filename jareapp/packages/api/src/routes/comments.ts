import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { commentLimiter } from '../middleware/rateLimiter';
import {
  createComment,
  updateComment,
  deleteComment,
  reactToComment,
} from '../controllers/comments.controller';

const router = Router();

router.use(authenticate);

router.post('/', commentLimiter, createComment);
router.patch('/:id', updateComment);
router.delete('/:id', deleteComment);
router.post('/:id/react', reactToComment);

export default router;
