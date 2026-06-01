import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import neighborhoodRoutes from './neighborhoods';
import feedRoutes from './feed';
import postRoutes from './posts';
import commentRoutes from './comments';
import alertRoutes from './alerts';
import eventRoutes from './events';
import businessRoutes from './businesses';
import messageRoutes from './messages';
import adminRoutes from './admin';
import uploadRoutes from './uploads';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/neighborhoods', neighborhoodRoutes);
router.use('/feed', feedRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/alerts', alertRoutes);
router.use('/events', eventRoutes);
router.use('/businesses', businessRoutes);
router.use('/messages', messageRoutes);
router.use('/admin', adminRoutes);
router.use('/uploads', uploadRoutes);

export default router;
