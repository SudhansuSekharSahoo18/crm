'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasRole } from '@/context/AppContext';
import { UserRole } from '@/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Add safety check for user and user.roles
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    console.warn('Navigation: Invalid user object:', user);
    return null;
  }

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      roles: [UserRole.ADMIN, UserRole.SUBMITTER, UserRole.APPROVER, UserRole.DATA_ENTRY, UserRole.DATA_APPROVER, UserRole.VERIFIER]
    },
    {
      label: 'Submit Bills',
      href: '/submit',
      roles: [UserRole.ADMIN, UserRole.SUBMITTER]
    },
    {
      label: 'Approve Bills',
      href: '/approve',
      roles: [UserRole.ADMIN, UserRole.APPROVER]
    },
    {
      label: 'Data Entry',
      href: '/data-entry',
      roles: [UserRole.ADMIN, UserRole.DATA_ENTRY]
    },
    {
      label: 'Data Approval',
      href: '/data-approval',
      roles: [UserRole.ADMIN, UserRole.DATA_APPROVER]
    },
    {
      label: 'Verification',
      href: '/verification',
      roles: [UserRole.ADMIN, UserRole.VERIFIER]
    },
    {
      label: 'User Management',
      href: '/users',
      roles: [UserRole.ADMIN]
    }
  ];

  const availableItems = navItems.filter(item => 
    item.roles.some(role => hasRole(user, role))
  );

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold">CRM System</h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {availableItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">{user.username}</span>
              <span className="text-xs text-blue-200">
                {user.roles.map(role => role.replace('_', ' ')).join(', ')}
              </span>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}