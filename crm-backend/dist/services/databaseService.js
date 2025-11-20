"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbService = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, '../../database.sqlite');
// Enable verbose mode for debugging
const sqlite = sqlite3_1.default.verbose();
class DatabaseService {
    constructor() {
        this.db = new sqlite.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            }
            else {
                console.log('Connected to SQLite database at:', dbPath);
                this.initializeTables();
            }
        });
    }
    initializeTables() {
        // Create firms table
        const createFirmsTable = `
      CREATE TABLE IF NOT EXISTS firms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        gstNumber TEXT NOT NULL UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
        this.db.run(createFirmsTable, (err) => {
            if (err) {
                console.error('Error creating firms table:', err.message);
            }
            else {
                console.log('Firms table ready');
            }
        });
        // Create users table
        const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
        this.db.run(createUsersTable, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            }
            else {
                console.log('Users table ready');
            }
        });
        // Create bills table
        const createBillsTable = `
      CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        fileName TEXT,
        fileUrl TEXT,
        transportFileName TEXT,
        transportFileUrl TEXT,
        status TEXT NOT NULL DEFAULT 'SUBMITTED',
        submittedBy TEXT NOT NULL,
        submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        items TEXT,
        auditTrail TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
        this.db.run(createBillsTable, (err) => {
            if (err) {
                console.error('Error creating bills table:', err.message);
            }
            else {
                console.log('Bills table ready');
                // Add items column if it doesn't exist (for existing databases)
                this.db.run('ALTER TABLE bills ADD COLUMN items TEXT', (alterErr) => {
                    if (alterErr && !alterErr.message.includes('duplicate column')) {
                        console.error('Error adding items column:', alterErr.message);
                    }
                    else {
                        console.log('Items column ready');
                    }
                });
                // Add auditTrail column if it doesn't exist (for existing databases)
                this.db.run('ALTER TABLE bills ADD COLUMN auditTrail TEXT', (alterErr) => {
                    if (alterErr && !alterErr.message.includes('duplicate column')) {
                        console.error('Error adding auditTrail column:', alterErr.message);
                    }
                    else {
                        console.log('AuditTrail column ready');
                    }
                });
            }
        });
    }
    // Firm operations
    createFirm(name, gstNumber) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO firms (name, gstNumber) VALUES (?, ?)`;
            this.db.run(sql, [name, gstNumber], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({
                        id: this.lastID,
                        name,
                        gstNumber,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            });
        });
    }
    getFirms() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM firms ORDER BY createdAt DESC`;
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    getFirmById(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM firms WHERE id = ?`;
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row);
                }
            });
        });
    }
    updateFirm(id, name, gstNumber) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE firms SET name = ?, gstNumber = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
            this.db.run(sql, [name, gstNumber, id], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({ id, name, gstNumber, updatedAt: new Date() });
                }
            });
        });
    }
    deleteFirm(id) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM firms WHERE id = ?`;
            this.db.run(sql, [id], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    // User operations
    createUser(name, email, password, role) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
            this.db.run(sql, [name, email, password, role], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({
                        id: this.lastID,
                        name,
                        email,
                        role,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            });
        });
    }
    getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE email = ?`;
            this.db.get(sql, [email], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row);
                }
            });
        });
    }
    // Bill operations
    createBill(billData) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO bills (id, title, description, amount, fileName, fileUrl, transportFileName, transportFileUrl, status, submittedBy, submittedAt, items, auditTrail) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            // Initialize auditTrail with the submission entry
            const initialAuditTrail = [{
                    id: Date.now().toString(),
                    action: 'Bill submitted',
                    performedBy: billData.submittedBy,
                    performedAt: new Date().toISOString(),
                    details: `Bill submitted by ${billData.submittedBy}`,
                    previousStatus: null,
                    newStatus: billData.status || 'SUBMITTED'
                }];
            const params = [
                billData.id,
                billData.title,
                billData.description,
                billData.amount,
                billData.fileName,
                billData.fileUrl,
                billData.transportFileName || null,
                billData.transportFileUrl || null,
                billData.status,
                billData.submittedBy,
                billData.submittedAt,
                billData.items ? JSON.stringify(billData.items) : null,
                JSON.stringify(billData.auditTrail || initialAuditTrail)
            ];
            this.db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({
                        ...billData,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            });
        });
    }
    getBills() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM bills ORDER BY submittedAt DESC`;
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    // Parse items JSON for each bill
                    const parsedRows = rows.map((row) => ({
                        ...row,
                        items: row.items ? JSON.parse(row.items) : [],
                        auditTrail: row.auditTrail ? JSON.parse(row.auditTrail) : []
                    }));
                    resolve(parsedRows);
                }
            });
        });
    }
    getBillById(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM bills WHERE id = ?`;
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    if (row) {
                        // Parse items and auditTrail JSON
                        row.items = row.items ? JSON.parse(row.items) : [];
                        row.auditTrail = row.auditTrail ? JSON.parse(row.auditTrail) : [];
                    }
                    resolve(row);
                }
            });
        });
    }
    updateBill(id, updates) {
        return new Promise((resolve, reject) => {
            // Build dynamic SQL for updating only provided fields
            const fields = [];
            const values = [];
            if (updates.title !== undefined) {
                fields.push('title = ?');
                values.push(updates.title);
            }
            if (updates.description !== undefined) {
                fields.push('description = ?');
                values.push(updates.description);
            }
            if (updates.amount !== undefined) {
                fields.push('amount = ?');
                values.push(updates.amount);
            }
            if (updates.fileName !== undefined) {
                fields.push('fileName = ?');
                values.push(updates.fileName);
            }
            if (updates.fileUrl !== undefined) {
                fields.push('fileUrl = ?');
                values.push(updates.fileUrl);
            }
            if (updates.transportFileName !== undefined) {
                fields.push('transportFileName = ?');
                values.push(updates.transportFileName);
            }
            if (updates.transportFileUrl !== undefined) {
                fields.push('transportFileUrl = ?');
                values.push(updates.transportFileUrl);
            }
            if (updates.status !== undefined) {
                fields.push('status = ?');
                values.push(updates.status);
            }
            if (updates.items !== undefined) {
                fields.push('items = ?');
                values.push(JSON.stringify(updates.items));
            }
            if (updates.auditTrail !== undefined) {
                fields.push('auditTrail = ?');
                values.push(JSON.stringify(updates.auditTrail));
            }
            // Always update the updatedAt field
            fields.push('updatedAt = CURRENT_TIMESTAMP');
            values.push(id); // Add ID as the last parameter for WHERE clause
            if (fields.length === 1) { // Only updatedAt field
                reject(new Error('No fields to update'));
                return;
            }
            const sql = `UPDATE bills SET ${fields.join(', ')} WHERE id = ?`;
            this.db.run(sql, values, function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    // Return the updated bill data
                    resolve({
                        id,
                        ...updates,
                        updatedAt: new Date()
                    });
                }
            });
        });
    }
    deleteBill(id) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM bills WHERE id = ?`;
            this.db.run(sql, [id], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            }
            else {
                console.log('Database connection closed');
            }
        });
    }
}
// Create singleton instance
exports.dbService = new DatabaseService();
exports.default = DatabaseService;
