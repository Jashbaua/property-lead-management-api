import { Router } from 'express';
import { createLead, getLeadById, getLeads, updateLead } from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/', createLead);

router.get('/', getLeads);
router.get('/:id', getLeadById);

router.patch('/:id', updateLead);

export default router;