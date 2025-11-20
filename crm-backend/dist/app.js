"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = require("dotenv");
const auth_1 = __importDefault(require("./routes/auth"));
const bills_1 = __importDefault(require("./routes/bills"));
const upload_1 = __importDefault(require("./routes/upload"));
// import userRoutes from './routes/users';
const firms_1 = __importDefault(require("./routes/firms"));
// Import database service to initialize it
require("./services/databaseService");
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const PORT = 5000; // Force port 5000
// Middleware
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// Comprehensive API request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const contentType = req.get('Content-Type') || 'None';
    const contentLength = req.get('Content-Length') || '0';
    console.log('\n' + '='.repeat(80));
    console.log(`📡 API REQUEST [${timestamp}]`);
    console.log('='.repeat(80));
    console.log(`Method: ${method}`);
    console.log(`URL: ${url}`);
    console.log(`User-Agent: ${userAgent}`);
    console.log(`Content-Type: ${contentType}`);
    console.log(`Content-Length: ${contentLength} bytes`);
    // Log query parameters if they exist
    if (Object.keys(req.query).length > 0) {
        console.log(`Query Params:`, req.query);
    }
    // Log request headers (excluding sensitive ones)
    console.log('Headers:');
    const filteredHeaders = { ...req.headers };
    delete filteredHeaders.authorization;
    delete filteredHeaders.cookie;
    console.log(JSON.stringify(filteredHeaders, null, 2));
    // Log request body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
        console.log('Request Body:');
        if (typeof req.body === 'object') {
            // Pretty print JSON but limit depth to avoid huge logs
            const bodyString = JSON.stringify(req.body, null, 2);
            if (bodyString.length > 2000) {
                console.log(bodyString.substring(0, 2000) + '\n... (truncated)');
            }
            else {
                console.log(bodyString);
            }
        }
        else {
            console.log(req.body);
        }
    }
    // Log response when it's finished
    const originalSend = res.send;
    res.send = function (data) {
        const responseTime = Date.now() - startTime;
        console.log('\n' + '-'.repeat(40));
        console.log(`📤 RESPONSE [${method} ${url}]`);
        console.log(`Status: ${res.statusCode} ${res.statusMessage || ''}`);
        console.log(`Response Time: ${responseTime}ms`);
        if (data) {
            const responseString = typeof data === 'string' ? data : JSON.stringify(data);
            if (responseString.length > 1000) {
                console.log('Response Body (truncated):');
                console.log(responseString.substring(0, 1000) + '\n... (truncated)');
            }
            else {
                console.log('Response Body:');
                console.log(responseString);
            }
        }
        console.log('='.repeat(80) + '\n');
        return originalSend.call(this, data);
    };
    const startTime = Date.now();
    next();
});
// Serve static files (uploaded documents)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
console.log('🚀 Starting CRM Backend Server...');
console.log('📁 Database: SQLite (local file-based database)');
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/bills', bills_1.default);
app.use('/api/upload', upload_1.default);
// app.use('/api/users', userRoutes);
app.use('/api/firms', firms_1.default);
// Error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log('\n' + '❌'.repeat(40));
    console.log(`🚨 ERROR [${timestamp}]`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.originalUrl || req.url}`);
    console.log(`Error Message: ${err.message}`);
    console.log(`Stack Trace:`);
    console.log(err.stack);
    console.log('❌'.repeat(40) + '\n');
    // Send error response
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500,
            timestamp: timestamp
        }
    });
});
// 404 handler for unknown routes
app.use('*', (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`\n🔍 404 NOT FOUND [${timestamp}]`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.originalUrl || req.url}`);
    console.log(`Available routes: /api/auth, /api/bills, /api/upload, /api/firms\n`);
    res.status(404).json({
        error: {
            message: `Route ${req.method} ${req.originalUrl} not found`,
            status: 404,
            timestamp: timestamp,
            availableRoutes: ['/api/auth', '/api/bills', '/api/upload', '/api/firms']
        }
    });
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
