import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const uploadDir = path.join(__dirname, '../../uploads/bills');

export const uploadBillFile = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileExtension = path.extname(req.file.originalname);
  const newFileName = `${uuidv4()}${fileExtension}`;
  const filePath = path.join(uploadDir, newFileName);

  fs.rename(req.file.path, filePath, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error saving file' });
    }

    res.status(200).json({ message: 'File uploaded successfully', fileName: newFileName });
  });
};

export const uploadTransportBillFile = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileExtension = path.extname(req.file.originalname);
  const newFileName = `${uuidv4()}${fileExtension}`;
  const filePath = path.join(__dirname, '../../uploads/transport-bills', newFileName);

  fs.rename(req.file.path, filePath, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error saving file' });
    }

    res.status(200).json({ message: 'Transport bill file uploaded successfully', fileName: newFileName });
  });
};