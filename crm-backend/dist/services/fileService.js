"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadTransportBillFile = exports.uploadBillFile = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const uploadDir = path_1.default.join(__dirname, '../../uploads/bills');
const uploadBillFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileExtension = path_1.default.extname(req.file.originalname);
    const newFileName = `${(0, uuid_1.v4)()}${fileExtension}`;
    const filePath = path_1.default.join(uploadDir, newFileName);
    fs_1.default.rename(req.file.path, filePath, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error saving file' });
        }
        res.status(200).json({ message: 'File uploaded successfully', fileName: newFileName });
    });
};
exports.uploadBillFile = uploadBillFile;
const uploadTransportBillFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileExtension = path_1.default.extname(req.file.originalname);
    const newFileName = `${(0, uuid_1.v4)()}${fileExtension}`;
    const filePath = path_1.default.join(__dirname, '../../uploads/transport-bills', newFileName);
    fs_1.default.rename(req.file.path, filePath, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error saving file' });
        }
        res.status(200).json({ message: 'Transport bill file uploaded successfully', fileName: newFileName });
    });
};
exports.uploadTransportBillFile = uploadTransportBillFile;
