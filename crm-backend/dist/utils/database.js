"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectFromDatabase = exports.connectToDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectToDatabase = async () => {
    try {
        const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/crm';
        await mongoose_1.default.connect(mongoUrl);
        console.log('Database connected successfully');
    }
    catch (error) {
        console.error('Database connection failed:', error);
        console.log('⚠️  Continuing without database connection...');
        // Don't throw error to prevent app crash
    }
};
exports.connectToDatabase = connectToDatabase;
const disconnectFromDatabase = async () => {
    try {
        await mongoose_1.default.disconnect();
        console.log('Database disconnected successfully');
    }
    catch (error) {
        console.error('Error disconnecting from the database:', error);
        throw error;
    }
};
exports.disconnectFromDatabase = disconnectFromDatabase;
exports.default = { connectToDatabase: exports.connectToDatabase, disconnectFromDatabase: exports.disconnectFromDatabase };
