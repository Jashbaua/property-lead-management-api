import { Router } from 'express';
import { createLead, getLeadById, getLeads, transitionLeadStatus, updateLead } from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/', createLead);
router.post('/:id/transition', transitionLeadStatus);

router.get('/', getLeads);
router.get('/:id', getLeadById);

router.patch('/:id', updateLead);

export default router;