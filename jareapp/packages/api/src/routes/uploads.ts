import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getPresignedUrl } from '../controllers/uploads.controller';

const router = Router();

router.use(authenticate);
router.post('/presigned-url', getPresignedUrl);

export default router;
