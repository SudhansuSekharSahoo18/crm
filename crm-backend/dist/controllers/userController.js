"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.registerUser = void 0;
const User_1 = __importDefault(require("../models/User"));
// Register a new user
const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = await User_1.default.create({ username, email, password });
        res.status(201).json({ message: 'User registered successfully', user: newUser });
    }
    catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};
exports.registerUser = registerUser;
// Get user details by ID
const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving user', error: error.message });
    }
};
exports.getUserById = getUserById;
// Update user details
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const updatedUser = await User_1.default.findByIdAndUpdate(userId, req.body, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};
exports.updateUser = updateUser;
// Delete a user
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const deletedUser = await User_1.default.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};
exports.deleteUser = deleteUser;
