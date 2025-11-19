"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBill = exports.validateBillSubmission = exports.validateLogin = exports.validateRegistration = void 0;
const express_validator_1 = require("express-validator");
exports.validateRegistration = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('username').notEmpty().withMessage('Username is required'),
    (0, express_validator_1.body)('role').isIn(['data_entry', 'data_approval', 'verification', 'approve']).withMessage('Valid role is required'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateLogin = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
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
    (0, express_validator_1.body)('items.*.itemName').notEmpty().withMessage('Item name is required'),
    (0, express_validator_1.body)('items.*.formula').notEmpty().withMessage('Formula is required'),
    (0, express_validator_1.body)('items.*.mrp').isFloat({ gt: 0 }).withMessage('Valid MRP is required'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
exports.validateBill = exports.validateBillSubmission;
