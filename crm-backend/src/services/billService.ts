import { Bill } from '../models/Bill';
import { createAuditEntry } from '../utils/audit';
import { User } from '../models/User';
import { BillStatus } from '../types';

export const createBill = async (billData: any, userId: string) => {
  const bill = new Bill({
    ...billData,
    submittedBy: userId,
    submittedAt: new Date(),
    status: BillStatus.SUBMITTED,
    auditTrail: [
      createAuditEntry('Bill Created', userId, `Bill created with title: ${billData.title}`)
    ]
  });

  await bill.save();
  return bill;
};

export const getBillById = async (billId: string) => {
  return await Bill.findById(billId);
};

export const updateBill = async (billId: string, updateData: any) => {
  return await Bill.findByIdAndUpdate(billId, updateData, { new: true });
};

export const deleteBill = async (billId: string) => {
  return await Bill.findByIdAndDelete(billId);
};

export const getAllBills = async () => {
  return await Bill.find({});
};