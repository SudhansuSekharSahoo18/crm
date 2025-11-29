import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ocrService } from '../services/ocrService';
import { getUploadUrl, UPLOAD_CONFIG } from '../config/constants';

const router = Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/bills');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // Accept common document formats
    const allowedTypes = UPLOAD_CONFIG.ALLOWED_FILE_TYPES;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Upload single file
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = getUploadUrl(req.file.filename);
    
    res.status(200).json({
      success: true,
      fileName: req.file.originalname,
      fileUrl: fileUrl,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'File upload failed', error });
  }
});

// Upload multiple files (bill and transport)
router.post('/upload-multiple', upload.fields([
  { name: 'billFile', maxCount: 1 },
  { name: 'transportFile', maxCount: 1 }
]), async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const result: any = {};
    
    if (files.billFile && files.billFile[0]) {
      const billFile = files.billFile[0];
      const fileUrl = getUploadUrl(billFile.filename);
      const filePath = billFile.path;
      
      result.billFile = {
        fileName: billFile.originalname,
        fileUrl: fileUrl
      };
      
      // Extract GST number from bill image if it's an image file
      if (ocrService.isImageFile(billFile.originalname)) {
        try {
          console.log(`🔍 Extracting GST number from bill document: ${billFile.originalname}`);
          const gstNumber = await ocrService.extractGSTFromImage(filePath);
          result.billFile.gstNumber = gstNumber;
          
          if (gstNumber) {
            console.log(`✅ GST number extraction successful for ${billFile.originalname}: ${gstNumber}`);
          } else {
            console.log(`⚠️ No GST number found in ${billFile.originalname}`);
          }
        } catch (ocrError) {
          console.error(`⚠️ GST extraction failed for ${billFile.originalname}:`, ocrError);
          result.billFile.gstNumber = null;
          result.billFile.gstExtractionError = 'GST number extraction failed';
        }
      } else {
        console.log(`📄 File ${billFile.originalname} is not an image, skipping GST extraction`);
        result.billFile.gstNumber = null;
      }
    }
    
    if (files.transportFile && files.transportFile[0]) {
      const transportFile = files.transportFile[0];
      result.transportFile = {
        fileName: transportFile.originalname,
        fileUrl: getUploadUrl(transportFile.filename)
      };
    }
    
    res.status(200).json({
      success: true,
      files: result,
      gstNumber: result.billFile?.gstNumber || null, // Include GST number at root level for easy access
      message: 'Files uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'File upload failed', error });
  }
});

export default router;