"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bill = void 0;
const mongoose_1 = require("mongoose");
const ItemSchema = new mongoose_1.Schema({
    itemName: { type: String, required: true },
    formula: { type: String, required: true },
    mrp: { type: Number, required: true },
});
const BillSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    status: { type: String, required: true },
    submittedBy: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    firm: { type: String, required: true },
    transportFileName: { type: String },
    transportFileUrl: { type: String },
    items: { type: [ItemSchema], required: true },
    auditTrail: { type: Array, default: [] },
});
exports.Bill = (0, mongoose_1.model)('Bill', BillSchema);
