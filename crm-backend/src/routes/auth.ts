import { Router } from 'express';
import { login, register, bootstrap, migratePasswords } from '../controllers/authController';
import { validateRegistration, validateLogin } from '../middleware/validation';

const router = Router();

// Bootstrap endpoint to create initial admin user
router.post('/bootstrap', bootstrap);

// Password migration endpoint
router.post('/migrate-passwords', migratePasswords);

// User registration route
router.post('/register', validateRegistration, register);

// User login route
router.post('/login', validateLogin, login);

export default router;