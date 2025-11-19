"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToken = exports.loginUser = exports.registerUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const registerUser = async (userData) => {
    const { email, password, username, role } = userData;
    try {
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = new User_1.default({
            email,
            username,
            password: hashedPassword,
            role,
        });
        await newUser.save();
        return { id: newUser._id, email: newUser.email, username: newUser.username, role: newUser.role };
    }
    catch (error) {
        throw new Error('Error registering user');
    }
};
exports.registerUser = registerUser;
const loginUser = async (credentials) => {
    const { email, password } = credentials;
    try {
        const user = await User_1.default.findOne({ email });
        if (!user || !(await bcrypt_1.default.compare(password, user.password))) {
            throw new Error('Invalid credentials');
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        return {
            token,
            user: { id: user._id, email: user.email, username: user.username, role: user.role }
        };
    }
    catch (error) {
        throw new Error('Error logging in');
    }
};
exports.loginUser = loginUser;
const validateToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
};
exports.validateToken = validateToken;
