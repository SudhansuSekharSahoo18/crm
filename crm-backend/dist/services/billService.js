"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBills = exports.deleteBill = exports.updateBill = exports.getBillById = exports.createBill = void 0;
const Bill_1 = require("../models/Bill");
const audit_1 = require("../utils/audit");
const types_1 = require("../types");
const createBill = async (billData, userId) => {
    const bill = new Bill_1.Bill({
        ...billData,
        submittedBy: userId,
        submittedAt: new Date(),
        status: types_1.BillStatus.SUBMITTED,
        auditTrail: [
            (0, audit_1.createAuditEntry)('Bill Created', userId, `Bill created with title: ${billData.title}`)
        ]
    });
    await bill.save();
    return bill;
};
exports.createBill = createBill;
const getBillById = async (billId) => {
    return await Bill_1.Bill.findById(billId);
};
exports.getBillById = getBillById;
const updateBill = async (billId, updateData) => {
    return await Bill_1.Bill.findByIdAndUpdate(billId, updateData, { new: true });
};
exports.updateBill = updateBill;
const deleteBill = async (billId) => {
    return await Bill_1.Bill.findByIdAndDelete(billId);
};
exports.deleteBill = deleteBill;
const getAllBills = async () => {
    return await Bill_1.Bill.find({});
};
exports.getAllBills = getAllBills;
