import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateRegistration = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').notEmpty().withMessage('Username is required'),
  body('role').isIn(['data_entry', 'data_approval', 'verification', 'approve']).withMessage('Valid role is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateBillSubmission = [
  body('firm').notEmpty().withMessage('Firm is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('file').custom((value, { req }) => {
    if (!req.file) {
      throw new Error('Bill document is required');
    }
    return true;
  }),
  body('transportFile').custom((value, { req }) => {
    if (!req.transportFile) {
      throw new Error('Transport bill document is required');
    }
    return true;
  }),
  body('items.*.itemName').notEmpty().withMessage('Item name is required'),
  body('items.*.formula').notEmpty().withMessage('Formula is required'),
  body('items.*.mrp').isFloat({ gt: 0 }).withMessage('Valid MRP is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateBill = validateBillSubmission;