"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const authService_1 = require("../services/authService");
const register = async (req, res) => {
    try {
        const user = await (0, authService_1.registerUser)(req.body);
        res.status(201).json({ message: 'User registered successfully', user });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { token, user } = await (0, authService_1.loginUser)(req.body);
        res.status(200).json({ message: 'Login successful', token, user });
    }
    catch (error) {
        res.status(401).json({ message: error.message });
    }
};
exports.login = login;
