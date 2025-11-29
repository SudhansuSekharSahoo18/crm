'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/config/api';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        user: action.payload,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
      };
    default:
      return state;
  }
}

// Mock users for demonstration
const MOCK_USERS: User[] = [
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Call backend login API
      const response = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Transform backend user to frontend User type
        const user: User = {
          id: data.user.id.toString(),
          username: data.user.name || data.user.email,
          email: data.user.email,
          roles: Array.isArray(data.user.roles) ? data.user.roles.map((r: string) => r as UserRole) : [UserRole.SUBMITTER],
          createdAt: new Date(data.user.createdAt || new Date()),
          createdBy: 'system',
        };
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        localStorage.setItem('user', JSON.stringify(user));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    localStorage.removeItem('user');
    router.push('/');
  };

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // Ensure user has a valid roles array
        if (user && (!user.roles || !Array.isArray(user.roles))) {
          console.warn('User from localStorage missing roles, fixing...');
          user.roles = []; // Default to empty roles array
        }
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user: state.user, 
      isAuthenticated: state.isAuthenticated, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}