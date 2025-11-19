"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.validateBillSubmission = void 0;
const express_validator_1 = require("express-validator");
exports.validateBillSubmission = [
    (0, express_validator_1.body)('firm').notEmpty().withMessage('Firm is required'),
    (0, express_validator_1.body)('description').notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('file').custom((value, { req }) => {
        if (!req.file) {
            throw new Error('Bill document is required');
        }
        return true;
    }),
    (0, express_validator_1.body)('transportFile').custom((value, { req }) => {
        if (!req.transportFile) {
            throw new Error('Transport bill document is required');
        }
        return true;
    }),
    (0, express_validator_1.body)('items').isArray().withMessage('Items must be an array'),
    (0, express_validator_1.body)('items.*.itemName').notEmpty().withMessage('Item name is required'),
    (0, express_validator_1.body)('items.*.formula').notEmpty().withMessage('Formula is required'),
    (0, express_validator_1.body)('items.*.mrp').isFloat({ gt: 0 }).withMessage('Valid MRP is required'),
];
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
exports.validateRequest = validateRequest;
