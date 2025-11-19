"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Route for user registration
router.post('/register', validation_1.validateUser, userController_1.registerUser);
// Route for getting a user by ID
router.get('/:id', auth_1.authenticate, userController_1.getUser);
// Route for updating user information
router.put('/:id', auth_1.authenticate, validation_1.validateUser, userController_1.updateUser);
// Route for deleting a user
router.delete('/:id', auth_1.authenticate, userController_1.deleteUser);
exports.default = router;
