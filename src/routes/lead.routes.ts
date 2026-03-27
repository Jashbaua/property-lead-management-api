import { Router } from 'express';
import { createLead } from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createLead);

export default router;