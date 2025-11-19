import { body, validationResult } from 'express-validator';

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
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.itemName').notEmpty().withMessage('Item name is required'),
  body('items.*.formula').notEmpty().withMessage('Formula is required'),
  body('items.*.mrp').isFloat({ gt: 0 }).withMessage('Valid MRP is required'),
];

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};