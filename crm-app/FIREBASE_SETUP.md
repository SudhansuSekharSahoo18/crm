# Firebase Authentication Setup Guide

This application uses Firebase Authentication for secure email and phone number login.

## Prerequisites

1. A Firebase account (free tier is sufficient)
2. Node.js and npm installed

## Setup Instructions

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

### 2. Enable Authentication Methods

1. In the Firebase Console, go to **Build > Authentication**
2. Click "Get Started" if prompted
3. Go to the **Sign-in method** tab
4. Enable the following providers:
   - **Email/Password**: Click on it and toggle "Enable"
   - **Phone**: Click on it, toggle "Enable", and follow the setup instructions

### 3. Configure Phone Authentication

For phone authentication, you need to:

1. Set up reCAPTCHA (Firebase uses invisible reCAPTCHA by default)
2. Add your domain to the authorized domains list:
   - In Firebase Console > Authentication > Settings > Authorized domains
   - Add `localhost` for development
   - Add your production domain when deploying

### 4. Get Your Firebase Configuration

1. In the Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon `</>` to add a web app
4. Register your app with a nickname (e.g., "CRM App")
5. Copy the configuration object

### 5. Update Environment Variables

1. Open the `.env.local` file in the `crm-app` directory
2. Replace the placeholder values with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 6. Create Test Users in Firebase

#### For Email/Password Login:
1. Go to Firebase Console > Authentication > Users
2. Click "Add user"
3. Enter email and password
4. Make sure these users also exist in your backend database

#### For Phone Login:
1. Phone authentication requires actual phone numbers and SMS verification
2. For testing, you can add test phone numbers:
   - Go to Authentication > Sign-in method > Phone
   - Scroll to "Phone numbers for testing"
   - Add test phone numbers with verification codes (e.g., +1 650-555-1234 with code 123456)

### 7. Sync Firebase Users with Backend

Your backend needs to verify Firebase tokens. You have two options:

#### Option A: Firebase Admin SDK (Recommended)
1. Install Firebase Admin SDK in your backend:
   ```bash
   cd crm-backend
   npm install firebase-admin
   ```

2. Download service account key:
   - Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely

3. Update backend to verify Firebase tokens in the auth middleware

#### Option B: Continue with Custom Auth
- Keep using your existing backend authentication
- Firebase provides an additional security layer on the frontend
- Backend validates credentials separately

## How It Works

### Email Login Flow:
1. User enters email and password
2. Firebase authenticates the credentials
3. Firebase returns an ID token
4. Token is sent to backend for session creation
5. Backend validates and creates user session

### Phone Login Flow:
1. User enters phone number
2. Firebase sends OTP via SMS
3. User enters the OTP
4. Firebase verifies OTP
5. Firebase returns an ID token
6. Token is sent to backend for session creation

## Testing

### Test Email Login:
- Create a user in Firebase with email: `test@example.com` and password: `Test123!`
- Ensure this user exists in your backend database
- Login using the email option

### Test Phone Login:
- Use a test phone number configured in Firebase (e.g., `+16505551234`)
- Enter the test verification code when prompted
- Ensure the phone number exists in your backend database

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure all Firebase environment variables are correctly set
- Restart your Next.js development server after updating `.env.local`

### "Firebase: Error (auth/invalid-api-key)"
- Check that your API key is correct
- Ensure the API key hasn't been restricted to exclude your domain

### Phone authentication not working:
- Verify phone number format includes country code (e.g., `+91` for India)
- Check that Phone authentication is enabled in Firebase Console
- Ensure your domain is in the authorized domains list
- For testing, use test phone numbers with predefined verification codes

### reCAPTCHA issues:
- Make sure your domain is authorized in Firebase Console
- Check browser console for reCAPTCHA errors
- Clear browser cache and cookies
- Try in an incognito/private window

## Security Notes

1. **Never commit `.env.local`** to version control
2. Use different Firebase projects for development and production
3. Set up Firebase security rules appropriately
4. Implement rate limiting on your backend
5. Regularly rotate API keys and service account credentials
6. Monitor Firebase Console for suspicious activity

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Phone Authentication](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
