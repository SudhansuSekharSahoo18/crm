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
    
    // Check if any users exist
    const users = await userService.findAll();
    if (users.length > 0) {
      return res.status(200).json({ message: 'Password migration completed. Users already exist.' });
    }

    // Create initial admin user
    const adminUser = await registerUser({
      email: 'admin@test.com',
      password: 'password123',
      name: 'Admin User',
      roles: ['ADMIN']
    });

    res.status(201).json({ 
      message: 'Admin user created successfully', 
      user: adminUser,
      loginInfo: {
        email: 'admin@test.com',
        password: 'password123'
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Bootstrap failed: ' + error.message });
  }
};