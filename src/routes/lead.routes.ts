import { Router } from 'express';
import { createLead, getLeadById, getLeads } from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/', createLead);

router.get('/', getLeads);
router.get('/:id', getLeadById);


export default router;