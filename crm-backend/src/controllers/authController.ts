import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/authService';
import userService from '../services/userService';
import PasswordMigration from '../utils/passwordMigration';

export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Migrate plain text passwords to hashed passwords
export const migratePasswords = async (req: Request, res: Response) => {
  try {
    const migration = new PasswordMigration();
    await migration.migratePasswordsToHash();
    res.status(200).json({ message: 'Password migration completed successfully' });
  } catch (error: any) {
    console.error('Migration error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { token, user } = await loginUser(req.body);
    res.status(200).json({ message: 'Login successful', token, user });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

// Bootstrap endpoint to create initial admin user
export const bootstrap = async (req: Request, res: Response) => {
  try {
    // First, run password migration to fix existing passwords
    const migration = new PasswordMigration();
    await migration.migratePasswordsToHash();
    
    // Check if admin user already exists
    const existingAdmin = await userService.findByEmail('admin@crm.com');
    if (existingAdmin) {
      return res.status(200).json({ 
        message: 'Admin user already exists.',
        loginInfo: {
          email: 'admin@crm.com',
          password: 'Admin@123',
          phone: '+919876543210'
        }
      });
    }

    // Create admin user with both email and phone
    const adminUser = await registerUser({
      email: 'admin@crm.com',
      password: 'Admin@123',
      name: 'Admin User',
      roles: ['ADMIN']
    });

    // Update user to add phone number
    await userService.findByIdAndUpdate(adminUser.id, { phone: '+919876543210' });

    res.status(201).json({ 
      message: 'Admin user created successfully', 
      user: adminUser,
      loginInfo: {
        email: 'admin@crm.com',
        password: 'Admin@123',
        phone: '+919876543210',
        note: 'You need to manually create this user in Firebase Console with the same email and password. For phone auth, add +919876543210 as a test phone number in Firebase Console.'
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Bootstrap failed: ' + error.message });
  }
};