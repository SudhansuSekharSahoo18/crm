'use client';

import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/LoginForm';
import Navigation from '@/components/Navigation';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      redirect('/dashboard');
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <p className="text-gray-500">Redirecting to dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <LoginForm />;
}
