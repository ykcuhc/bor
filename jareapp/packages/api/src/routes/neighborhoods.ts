import { Router } from 'express';
import {
  listNeighborhoods,
  getNeighborhoodById,
  listGovernorates,
} from '../controllers/neighborhoods.controller';

const router = Router();

router.get('/', listNeighborhoods);
router.get('/governorates', listGovernorates);
router.get('/:id', getNeighborhoodById);

export default router;
