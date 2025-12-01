'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  signInWithEmailAndPassword, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '@/config/firebase';

export default function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [showVerification, setShowVerification] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const { login } = useAuth();

  const handleEmailLogin = async () => {
    try {
      // Firebase email/password authentication
      const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
      const firebaseUser = userCredential.user;
      
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      // Call your backend with Firebase token for session creation
      const success = await login(identifier, password, idToken);
      if (!success) {
        setError('Failed to create session');
      }
    } catch (err: any) {
      console.error('Firebase email login error:', err);
      setError(err.message || 'Email login failed');
    }
  };

  const handlePhoneLogin = async () => {
    try {
      // Setup reCAPTCHA verifier
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          }
        });
      }

      const appVerifier = (window as any).recaptchaVerifier;
      
      // Format phone number (ensure it has country code)
      const phoneNumber = identifier.startsWith('+') ? identifier : `+91${identifier}`;
      
      // Send OTP
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setShowVerification(true);
      setError('');
    } catch (err: any) {
      console.error('Firebase phone login error:', err);
      setError(err.message || 'Phone login failed');
      
      // Reset reCAPTCHA on error
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    }
  };

  const handleVerifyOTP = async () => {
    if (!confirmationResult) return;
    
    try {
      const userCredential = await confirmationResult.confirm(verificationCode);
      const firebaseUser = userCredential.user;
      
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      // Call your backend with Firebase token
      const success = await login(identifier, '', idToken);
      if (!success) {
        setError('Failed to create session');
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError('Invalid verification code');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (loginMethod === 'email') {
        await handleEmailLogin();
      } else {
        await handlePhoneLogin();
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await handleVerifyOTP();
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification Screen
  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Verify OTP
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter the verification code sent to {identifier}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleOTPSubmit}>
            <div>
              <label htmlFor="verification-code" className="sr-only">
                Verification Code
              </label>
              <input
                id="verification-code"
                name="verificationCode"
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter OTP"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVerification(false);
                  setVerificationCode('');
                  setConfirmationResult(null);
                }}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Login Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to CRM System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use the following demo accounts:
          </p>
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p><strong>Demo Credentials:</strong></p>
            <p>Use any registered user's email/phone and password</p>
            <p>You can create users from the Users Management page</p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="identifier" className="sr-only">
                {loginMethod === 'email' ? 'Email' : 'Phone Number'}
              </label>
              <input
                id="identifier"
                name="identifier"
                type={loginMethod === 'email' ? 'email' : 'tel'}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={loginMethod === 'email' ? 'Email address' : 'Phone number (+91XXXXXXXXXX)'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            {loginMethod === 'email' && (
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setLoginMethod(loginMethod === 'email' ? 'phone' : 'email');
                setIdentifier('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {loginMethod === 'email' ? 'Login using Phone Number' : 'Login using Email'}
            </button>
          </div>
        </form>
        
        {/* reCAPTCHA container for phone authentication */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}