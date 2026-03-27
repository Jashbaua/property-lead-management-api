import { Router } from 'express';
import { getProperties, getPropertyById } from '../controllers/property.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getProperties);
router.get('/:id', getPropertyById);

export default router;