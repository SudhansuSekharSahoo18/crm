"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(400).json({ message: 'Invalid token.' });
        }
        try {
            const user = await User_1.default.findById(decoded.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }
            req.user = user;
            next();
        }
        catch (error) {
            return res.status(500).json({ message: 'Internal server error.' });
        }
    });
};
exports.authenticate = authMiddleware;
exports.default = authMiddleware;
