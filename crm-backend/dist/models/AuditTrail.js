"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const auditTrailSchema = new mongoose_1.Schema({
    action: { type: String, required: true },
    userId: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, required: true },
});
const AuditTrail = (0, mongoose_1.model)('AuditTrail', auditTrailSchema);
exports.default = AuditTrail;
