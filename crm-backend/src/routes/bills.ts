import { Router } from 'express';
import { createBill, getAllBills, updateBill, deleteBill, getBillById } from '../controllers/billController';

const router = Router();

// Route to create a new bill
router.post('/', createBill);

// Route to get all bills
router.get('/', getAllBills);

// Route to get a bill by ID
router.get('/:id', getBillById);

// Route to update a bill
router.put('/:id', updateBill);

// Route to delete a bill
router.delete('/:id', deleteBill);

export default router;