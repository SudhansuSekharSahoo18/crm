import { Router } from 'express';
import { createFirm, getFirms, updateFirm, deleteFirm } from '../controllers/firmController';
// import { authenticate } from '../middleware/auth';
// import { checkRole } from '../middleware/roleCheck';

const router = Router();

// Route to create a new firm (temporarily disabled auth for testing)
router.post('/', createFirm);

// Route to get all firms (temporarily disabled auth for testing)
router.get('/', getFirms);

// Route to update a firm
router.put('/:id', updateFirm);

// Route to delete a firm
router.delete('/:id', deleteFirm);

export default router;