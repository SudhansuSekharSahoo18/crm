import { Schema, model, Document } from 'mongoose';

interface IAuditTrail extends Document {
  action: string;
  userId: string;
  description: string;
  timestamp: Date;
  status: string;
}

const auditTrailSchema = new Schema<IAuditTrail>({
  action: { type: String, required: true },
  userId: { type: String, required: true },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, required: true },
});

const AuditTrail = model<IAuditTrail>('AuditTrail', auditTrailSchema);

export default AuditTrail;