import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createEvent,
  listEvents,
  getEventById,
  rsvpEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/events.controller';

const router = Router();

router.use(authenticate);

router.post('/', createEvent);
router.get('/', listEvents);
router.get('/:id', getEventById);
router.post('/:id/rsvp', rsvpEvent);
router.patch('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
