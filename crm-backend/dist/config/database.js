"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.disconnectFromDatabase = exports.connectToDatabase = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
const connectToDatabase = async () => {
    try {
        await prisma.$connect();
        console.log('Database connected successfully (SQLite)');
    }
    catch (error) {
        console.error('Database connection failed:', error);
        console.log('⚠️  Continuing without database connection...');
        // Don't throw error to prevent app crash
    }
};
exports.connectToDatabase = connectToDatabase;
const disconnectFromDatabase = async () => {
    await prisma.$disconnect();
};
exports.disconnectFromDatabase = disconnectFromDatabase;
