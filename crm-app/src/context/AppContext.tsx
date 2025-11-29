'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { User, Bill, Firm, UserRole, BillStatus, AuditEntry, BillDataEntry, AppState } from '@/types';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

type AppAction =
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_BILL'; payload: Bill }
  | { type: 'UPDATE_BILL'; payload: Bill }
  | { type: 'DELETE_BILL'; payload: string }
  | { type: 'ADD_FIRM'; payload: Firm }
  | { type: 'UPDATE_FIRM'; payload: Firm }
  | { type: 'DELETE_FIRM'; payload: string }
  | { type: 'LOAD_FIRMS'; payload: Firm[] }
  | { type: 'LOAD_INITIAL_DATA'; payload: { users: User[]; bills: Bill[]; firms: Firm[] } };

const initialState: AppState = {
  users: [],
  bills: [],
  firms: [],
  currentUser: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id ? action.payload : user
        ),
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
      };
    case 'ADD_BILL':
      return { ...state, bills: [...state.bills, action.payload] };
    case 'UPDATE_BILL':
      return {
        ...state,
        bills: state.bills.map(bill =>
          bill.id === action.payload.id ? action.payload : bill
        ),
      };
    case 'DELETE_BILL':
      return {
        ...state,
        bills: state.bills.filter(bill => bill.id !== action.payload),
      };
    case 'ADD_FIRM':
      return { ...state, firms: [...state.firms, action.payload] };
    case 'UPDATE_FIRM':
      return {
        ...state,
        firms: state.firms.map(firm =>
          firm.id === action.payload.id ? action.payload : firm
        ),
      };
    case 'DELETE_FIRM':
      return {
        ...state,
        firms: state.firms.filter(firm => firm.id !== action.payload),
      };
    case 'LOAD_FIRMS':
      return {
        ...state,
        firms: action.payload,
      };
    case 'LOAD_INITIAL_DATA':
      return {
        ...state,
        users: action.payload.users,
        bills: action.payload.bills,
        firms: action.payload.firms,
      };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize with sample data and load real bills from backend
  React.useEffect(() => {
    const sampleUsers: User[] = [
      {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@company.com',
        roles: [UserRole.ADMIN],
        createdAt: new Date(),
        createdBy: 'system',
      },
      {
        id: 'submitter-1',
        username: 'submitter',
        email: 'submitter@company.com',
        roles: [UserRole.SUBMITTER],
        createdAt: new Date(),
        createdBy: 'admin-1',
      },
      {
        id: 'approver-1',
        username: 'approver',
        email: 'approver@company.com',
        roles: [UserRole.APPROVER],
        createdAt: new Date(),
        createdBy: 'admin-1',
      },
      {
        id: 'dataentry-1',
        username: 'dataentry',
        email: 'dataentry@company.com',
        roles: [UserRole.DATA_ENTRY],
        createdAt: new Date(),
        createdBy: 'admin-1',
      },
      {
        id: 'dataapprover-1',
        username: 'dataapprover',
        email: 'dataapprover@company.com',
        roles: [UserRole.DATA_APPROVER],
        createdAt: new Date(),
        createdBy: 'admin-1',
      },
      {
        id: 'verifier-1',
        username: 'verifier',
        email: 'verifier@company.com',
        roles: [UserRole.VERIFIER],
        createdAt: new Date(),
        createdBy: 'admin-1',
      },
    ];

    // Load real bills from backend instead of using sample data
    const loadBillsFromBackend = async () => {
      try {
        console.log('🔄 Loading bills from backend API...');
        const response = await fetch(API_ENDPOINTS.BILLS);
        if (response.ok) {
          const bills = await response.json();
          console.log('✅ Loaded bills from backend:', bills.length, 'bills');
          console.log('📋 Bills status breakdown:', bills.map((b: any) => ({ id: b.id, title: b.title, status: b.status })));
          
          // Initialize with users and real bills from backend
          dispatch({ 
            type: 'LOAD_INITIAL_DATA', 
            payload: { 
              users: sampleUsers, 
              bills: bills, 
              firms: [] 
            } 
          });
        } else {
          console.error('❌ Failed to load bills from backend:', response.status);
          // Fallback to empty bills if backend fails
          dispatch({ 
            type: 'LOAD_INITIAL_DATA', 
            payload: { 
              users: sampleUsers, 
              bills: [], 
              firms: [] 
            } 
          });
        }
      } catch (error) {
        console.error('❌ Error loading bills from backend:', error);
        // Fallback to empty bills if backend fails
        dispatch({ 
          type: 'LOAD_INITIAL_DATA', 
          payload: { 
            users: sampleUsers, 
            bills: [], 
            firms: [] 
          } 
        });
      }
    };

    loadBillsFromBackend();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Helper functions
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    console.warn('User object missing roles property:', user);
    return false;
  }
  return user.roles.includes(role);
}

export function hasAnyRole(user: User | null, roles: UserRole[]): boolean {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    console.warn('User object missing roles property:', user);
    return false;
  }
  return user.roles.some(userRole => roles.includes(userRole));
}

export function canAccessBill(user: User | null, bill: Bill): boolean {
  if (!user) return false;
  
  // Admin can access everything
  if (hasRole(user, UserRole.ADMIN)) return true;
  
  // Users can access bills they submitted
  if (bill.submittedBy === user.id) return true;
  
  // Role-based access based on bill status
  switch (bill.status) {
    case BillStatus.SUBMITTED:
      return hasRole(user, UserRole.APPROVER);
    case BillStatus.APPROVED:
    case BillStatus.DATA_ENTRY_PENDING:
      return hasRole(user, UserRole.DATA_ENTRY);
    case BillStatus.DATA_ENTRY_COMPLETED:
      return hasRole(user, UserRole.DATA_APPROVER);
    case BillStatus.DATA_APPROVED:
      return hasRole(user, UserRole.VERIFIER);
    default:
      return false;
  }
}

export function getNextStatus(currentStatus: BillStatus, action: 'approve' | 'reject'): BillStatus {
  if (action === 'reject') {
    switch (currentStatus) {
      case BillStatus.SUBMITTED:
        return BillStatus.REJECTED;
      case BillStatus.DATA_ENTRY_COMPLETED:
        return BillStatus.DATA_REJECTED;
      case BillStatus.DATA_APPROVED:
        return BillStatus.FINAL_REJECTED;
      default:
        return currentStatus;
    }
  }
  
  switch (currentStatus) {
    case BillStatus.SUBMITTED:
      return BillStatus.APPROVED;
    case BillStatus.APPROVED:
      return BillStatus.DATA_ENTRY_PENDING;
    case BillStatus.DATA_ENTRY_COMPLETED:
      return BillStatus.DATA_APPROVED;
    case BillStatus.DATA_APPROVED:
      return BillStatus.VERIFIED;
    case BillStatus.VERIFIED:
      return BillStatus.FINAL_APPROVED;
    default:
      return currentStatus;
  }
}

export function createAuditEntry(
  action: string,
  performedBy: string,
  details: string,
  previousStatus?: BillStatus,
  newStatus?: BillStatus
): AuditEntry {
  return {
    id: Math.random().toString(36).substr(2, 9),
    action,
    performedBy,
    performedAt: new Date(),
    details,
    previousStatus,
    newStatus,
  };
}