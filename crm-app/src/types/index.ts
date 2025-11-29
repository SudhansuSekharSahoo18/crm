export enum UserRole {
  ADMIN = 'ADMIN',
  SUBMITTER = 'SUBMITTER',
  APPROVER = 'APPROVER',
  DATA_ENTRY = 'DATA_ENTRY',
  DATA_APPROVER = 'DATA_APPROVER',
  VERIFIER = 'VERIFIER'
}

export enum BillStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DATA_ENTRY_PENDING = 'data_entry_pending',
  DATA_ENTRY_COMPLETED = 'data_entry_completed',
  DATA_APPROVED = 'data_approved',
  DATA_REJECTED = 'data_rejected',
  VERIFIED = 'verified',
  VERIFICATION_COMPLETED = 'verification_completed',
  FINAL_APPROVED = 'final_approved',
  FINAL_REJECTED = 'final_rejected'
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Optional for security - not always included in responses
  roles: UserRole[];
  createdAt: Date;
  createdBy: string;
}

export interface Firm {
  id: string;
  name: string;
  gstNumber: string;
  createdAt: Date;
  createdBy: string;
}

export interface Bill {
  id: string;
  title: string;
  description: string;
  firmId?: string;
  amount: number;
  fileName: string;
  fileUrl: string;
  transportFileName?: string;
  transportFileUrl?: string;
  status: BillStatus;
  submittedBy: string;
  submittedAt: Date;
  auditTrail: AuditEntry[];
  dataEntry?: BillDataEntry;
  items?: BillItem[];
}

export interface BillItem {
  id: string;
  itemName: string;
  formula: string;
  mrp: string;
}

export interface BillDataEntry {
  id: string;
  billId: string;
  vendor: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  category: string;
  lineItems: LineItem[];
  enteredBy: string;
  enteredAt: Date;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  details: string;
  previousStatus?: BillStatus;
  newStatus?: BillStatus;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface AppState {
  users: User[];
  bills: Bill[];
  firms: Firm[];
  currentUser: User | null;
}