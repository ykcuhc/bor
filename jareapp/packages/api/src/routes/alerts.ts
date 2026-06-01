import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createAlert,
  listAlerts,
  getAlertById,
  deleteAlert,
} from '../controllers/alerts.controller';

const router = Router();

router.use(authenticate);

router.post('/', createAlert);
router.get('/', listAlerts);
router.get('/:id', getAlertById);
router.patch('/:id/deactivate', deleteAlert);

export default router;
