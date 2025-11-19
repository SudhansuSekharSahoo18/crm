import { Schema, model, Document } from 'mongoose';

interface IItem {
  itemName: string;
  formula: string;
  mrp: number;
}

export interface IBill extends Document {
  title: string;
  description: string;
  amount: number;
  fileName: string;
  fileUrl: string;
  status: string;
  submittedBy: string;
  submittedAt: Date;
  firm: string;
  transportFileName?: string;
  transportFileUrl?: string;
  items: IItem[];
  auditTrail: any[];
}

const ItemSchema = new Schema<IItem>({
  itemName: { type: String, required: true },
  formula: { type: String, required: true },
  mrp: { type: Number, required: true },
});

const BillSchema = new Schema<IBill>({
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

export const Bill = model<IBill>('Bill', BillSchema);