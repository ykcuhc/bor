import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { postLimiter } from '../middleware/rateLimiter';
import {
  createPost,
  getPostById,
  updatePost,
  deletePost,
  reactToPost,
  reportPost,
  getPostsByCategory,
} from '../controllers/posts.controller';

const router = Router();

router.use(authenticate);

router.post('/', postLimiter, createPost);
router.get('/category/:category', getPostsByCategory);
router.get('/:id', getPostById);
router.patch('/:id', updatePost);
router.delete('/:id', deletePost);
router.post('/:id/react', reactToPost);
router.post('/:id/report', reportPost);

export default router;
