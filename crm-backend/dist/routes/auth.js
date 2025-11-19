"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// User registration route
router.post('/register', validation_1.validateRegistration, authController_1.register);
// User login route
router.post('/login', validation_1.validateLogin, authController_1.login);
exports.default = router;
