import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createBusiness,
  getBusinesses,
  getBusinessById,
  updateBusiness,
  addReview,
  getFeaturedBusinesses,
} from '../controllers/businesses.controller';

const router = Router();

router.use(authenticate);

router.post('/', createBusiness);
router.get('/featured', getFeaturedBusinesses);
router.get('/', getBusinesses);
router.get('/:id', getBusinessById);
router.patch('/:id', updateBusiness);
router.post('/:id/review', addReview);

export default router;
