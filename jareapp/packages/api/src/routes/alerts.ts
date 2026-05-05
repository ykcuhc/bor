import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createAlert,
  getAlerts,
  getAlertById,
  deactivateAlert,
} from '../controllers/alerts.controller';

const router = Router();

router.use(authenticate);

router.post('/', createAlert);
router.get('/', getAlerts);
router.get('/:id', getAlertById);
router.patch('/:id/deactivate', deactivateAlert);

export default router;
