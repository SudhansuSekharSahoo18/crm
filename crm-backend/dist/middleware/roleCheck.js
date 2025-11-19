"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = void 0;
const roleCheck = (roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role; // Assuming req.user is populated by authentication middleware
        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};
exports.checkRole = roleCheck;
exports.default = roleCheck;
