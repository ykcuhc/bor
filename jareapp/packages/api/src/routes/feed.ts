import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getFeed, getNearbyFeed } from '../controllers/feed.controller';

const router = Router();

router.use(authenticate);

router.get('/', getFeed);
router.get('/nearby', getNearbyFeed);

export default router;
