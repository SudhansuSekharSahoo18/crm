import { Router } from 'express';
import { registerUser, getUser, updateUser, deleteUser } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validateUser } from '../middleware/validation';

const router = Router();

// Route for user registration
router.post('/register', validateUser, registerUser);

// Route for getting a user by ID
router.get('/:id', authenticate, getUser);

// Route for updating user information
router.put('/:id', authenticate, validateUser, updateUser);

// Route for deleting a user
router.delete('/:id', authenticate, deleteUser);

export default router;