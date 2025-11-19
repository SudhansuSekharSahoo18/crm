"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
// Configure multer for file upload
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/bills');
        // Create directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept common document formats
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only images and documents are allowed'));
        }
    }
});
// Upload single file
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const fileUrl = `http://localhost:5000/uploads/bills/${req.file.filename}`;
        res.status(200).json({
            success: true,
            fileName: req.file.originalname,
            fileUrl: fileUrl,
            message: 'File uploaded successfully'
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'File upload failed', error });
    }
});
// Upload multiple files (bill and transport)
router.post('/upload-multiple', upload.fields([
    { name: 'billFile', maxCount: 1 },
    { name: 'transportFile', maxCount: 1 }
]), (req, res) => {
    try {
        const files = req.files;
        const result = {};
        if (files.billFile && files.billFile[0]) {
            const billFile = files.billFile[0];
            result.billFile = {
                fileName: billFile.originalname,
                fileUrl: `http://localhost:5000/uploads/bills/${billFile.filename}`
            };
        }
        if (files.transportFile && files.transportFile[0]) {
            const transportFile = files.transportFile[0];
            result.transportFile = {
                fileName: transportFile.originalname,
                fileUrl: `http://localhost:5000/uploads/bills/${transportFile.filename}`
            };
        }
        res.status(200).json({
            success: true,
            files: result,
            message: 'Files uploaded successfully'
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'File upload failed', error });
    }
});
exports.default = router;
