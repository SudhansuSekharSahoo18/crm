import { Request, Response } from 'express';
import userService from '../services/userService';

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.findAll();
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
};

// Register a new user
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, name, email, password, roles, role } = req.body;
    const newUser = await userService.create({ 
      username, 
      name: name || username, // Support both fields
      email, 
      password, 
      roles: roles || (role ? [role] : undefined) // Support both roles array and single role
    });
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error: any) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Get user details by ID
export const getUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await userService.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving user', error: error.message });
  }
};

// Update user details
export const updateUser = async (req: Request, res: Response) => {
  try {
    console.log('Update user request body:', req.body);
    console.log('Update user params:', req.params);
    
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const updatedUser = await userService.findByIdAndUpdate(userId, req.body, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Delete a user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const deletedUser = await userService.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};