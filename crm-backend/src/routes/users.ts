import { Router } from 'express';
import { getAllUsers, registerUser, getUser, updateUser, deleteUser } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validateUser } from '../middleware/validation';

const router = Router();

// Route to get all users (temporarily without auth for testing)
router.get('/', getAllUsers);

// Route for user registration
router.post('/register', validateUser, registerUser);

// Route for getting a user by ID
router.get('/:id', authenticate, getUser);

// Route for updating user information (temporarily without auth for testing)
router.put('/:id', validateUser, updateUser);

// Route for deleting a user
router.delete('/:id', authenticate, deleteUser);

export default router;