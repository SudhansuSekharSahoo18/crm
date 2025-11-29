import { Router } from 'express';
import { createBill, getAllBills, updateBill, deleteBill, getBillById, extractGSTFromImage } from '../controllers/billController';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/bills/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Route to extract GST from image (with file upload)
router.post('/extract-gst', upload.single('file'), extractGSTFromImage);

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