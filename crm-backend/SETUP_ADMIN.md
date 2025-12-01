# Firebase + Database Admin User Setup

## Step 1: Seed Admin User to Database

Run the seed script to create the admin user in your local database:

```powershell
cd C:\Sudhansu\repos\crm\crm-backend
npm run seed:admin
```

This creates an admin user with:
- **Email**: `admin@crm.com`
- **Phone**: `+919876543210`
- **Password**: `Admin@123`
- **Role**: ADMIN

## Step 2: Create User in Firebase (Email/Password)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **"Add user"**
5. Enter:
   - **Email**: `admin@crm.com`
   - **Password**: `Admin@123`
6. Click **"Add user"**

## Step 3: Add Test Phone Number in Firebase

Since we're using a test phone number, add it to Firebase test numbers:

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Phone** (make sure it's enabled)
3. Scroll down to **"Phone numbers for testing"**
4. Click **"Add phone number"**
5. Enter:
   - **Phone number**: `+919876543210`
   - **Verification code**: `123456`
6. Click **"Add"**

## Step 4: Test Login

### Email Login:
- Email: `admin@crm.com`
- Password: `Admin@123`

### Phone Login:
- Phone: `+919876543210`
- OTP: `123456` (test code)

## Alternative: Use Bootstrap Endpoint

You can also hit the bootstrap endpoint:

```bash
curl -X POST http://localhost:5000/api/auth/bootstrap
```

Or open in browser:
```
http://localhost:5000/api/auth/bootstrap
```

## Creating Additional Test Users

To create more test users with phone numbers:

1. **Add to Database** (via backend API or seed script)
2. **Add to Firebase**:
   - For email: Add user in Firebase Console → Authentication → Users
   - For phone: Add test phone number in Firebase Console → Authentication → Sign-in method → Phone → Phone numbers for testing

## Production Note

⚠️ **Test phone numbers only work in development!**

For production:
- Users must use real phone numbers
- Firebase will send actual SMS messages
- You'll need to set up billing in Firebase (though free tier includes SMS)
- Consider implementing rate limiting to prevent SMS abuse

## Troubleshooting

### "User not found" error
- Make sure the user exists in both Firebase AND your database
- Check that email/phone matches exactly (including country code for phone)

### "Invalid credentials" error
- Verify password is correct in both Firebase and database
- Check that Firebase authentication succeeded (check browser console)

### "Failed to create session" error
- Backend couldn't find the user in the database
- Seed the user using `npm run seed:admin`
- Or the firebaseToken wasn't passed correctly
