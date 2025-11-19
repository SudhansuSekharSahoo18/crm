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
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
