import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../database.sqlite');

// Enable verbose mode for debugging
const sqlite = sqlite3.verbose();

class DatabaseService {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database at:', dbPath);
        this.initializeTables();
      }
    });
  }

  private initializeTables(): void {
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
      } else {
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
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create user_roles table for many-to-many relationship
    const createUserRolesTable = `
      CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        role TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(userId, role)
      )
    `;

    // Migration queries to handle existing data
    const migrateExistingRoles = `
      INSERT OR IGNORE INTO user_roles (userId, role)
      SELECT id, 
        CASE 
          WHEN roles IS NOT NULL AND roles != '' THEN
            json_extract(roles, '$[0]')
          WHEN role IS NOT NULL THEN role
          ELSE 'SUBMITTER'
        END
      FROM users
      WHERE id NOT IN (SELECT DISTINCT userId FROM user_roles)
    `;

    // Drop the old role and roles columns after migration
    const dropOldRoleColumns = `
      CREATE TABLE users_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO users_temp (id, name, email, password, createdAt, updatedAt)
      SELECT id, name, email, password, 
             COALESCE(createdAt, CURRENT_TIMESTAMP) as createdAt,
             COALESCE(updatedAt, CURRENT_TIMESTAMP) as updatedAt
      FROM users;
      DROP TABLE users;
      ALTER TABLE users_temp RENAME TO users;
    `;

    this.db.run(createUsersTable, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table ready');
        
        // Add phone column if it doesn't exist (for existing databases)
        this.db.run('ALTER TABLE users ADD COLUMN phone TEXT', (phoneErr) => {
          if (phoneErr && !phoneErr.message.includes('duplicate column')) {
            console.error('Error adding phone column:', phoneErr.message);
          } else {
            console.log('Phone column ready');
          }
        });
        
        // Create user_roles table
        this.db.run(createUserRolesTable, (rolesErr) => {
          if (rolesErr) {
            console.error('Error creating user_roles table:', rolesErr.message);
          } else {
            console.log('User_roles table ready');
            
            // Skip role migration since we've already handled the schema change
            console.log('User roles migration completed (skipped - already done)');
          }
        });
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
      } else {
        console.log('Bills table ready');
        // Add items column if it doesn't exist (for existing databases)
        this.db.run('ALTER TABLE bills ADD COLUMN items TEXT', (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.error('Error adding items column:', alterErr.message);
          } else {
            console.log('Items column ready');
          }
        });
        
        // Add auditTrail column if it doesn't exist (for existing databases)
        this.db.run('ALTER TABLE bills ADD COLUMN auditTrail TEXT', (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.error('Error adding auditTrail column:', alterErr.message);
          } else {
            console.log('AuditTrail column ready');
          }
        });

        // Add firmId column if it doesn't exist (for existing databases)
        this.db.run('ALTER TABLE bills ADD COLUMN firmId TEXT', (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.error('Error adding firmId column:', alterErr.message);
          } else {
            console.log('FirmId column ready');
          }
        });
      }
    });
  }

  // Firm operations
  createFirm(name: string, gstNumber: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO firms (name, gstNumber) VALUES (?, ?)`;
      this.db.run(sql, [name, gstNumber], function(err) {
        if (err) {
          reject(err);
        } else {
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

  getFirms(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM firms ORDER BY createdAt DESC`;
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getFirmById(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM firms WHERE id = ?`;
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  updateFirm(id: number, name: string, gstNumber: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE firms SET name = ?, gstNumber = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
      this.db.run(sql, [name, gstNumber, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, name, gstNumber, updatedAt: new Date() });
        }
      });
    });
  }

  deleteFirm(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM firms WHERE id = ?`;
      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // User operations
  createUser(name: string, email: string, password: string, roles: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const userSql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
      this.db.run(userSql, [name, email, password], (err) => {
        if (err) {
          reject(err);
        } else {
          // Get the last inserted ID
          this.db.get('SELECT last_insert_rowid() as id', [], (idErr: any, row: any) => {
            if (idErr) {
              reject(idErr);
            } else {
              const userId = row.id;
              const rolePromises = roles.map(role => {
                return new Promise((roleResolve, roleReject) => {
                  const roleSql = `INSERT INTO user_roles (userId, role) VALUES (?, ?)`;
                  this.db.run(roleSql, [userId, role], (roleErr: any) => {
                    if (roleErr) {
                      roleReject(roleErr);
                    } else {
                      roleResolve(role);
                    }
                  });
                });
              });
              
              Promise.all(rolePromises)
                .then(() => {
                  resolve({
                    id: userId,
                    name,
                    email,
                    roles: roles,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  });
                })
                .catch(reject);
            }
          });
        }
      });
    });
  }

  getUserByEmail(email: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.*, GROUP_CONCAT(ur.role) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.userId
        WHERE u.email = ?
        GROUP BY u.id
      `;
      this.db.get(sql, [email], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            row.roles = row.roles ? row.roles.split(',') : ['SUBMITTER'];
          }
          resolve(row);
        }
      });
    });
  }

  getUserByPhone(phone: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.*, GROUP_CONCAT(ur.role) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.userId
        WHERE u.phone = ?
        GROUP BY u.id
      `;
      this.db.get(sql, [phone], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            row.roles = row.roles ? row.roles.split(',') : ['SUBMITTER'];
          }
          resolve(row);
        }
      });
    });
  }

  getAllUsers(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.id, u.name, u.email, u.createdAt, u.updatedAt,
               GROUP_CONCAT(ur.role) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.userId
        GROUP BY u.id, u.name, u.email, u.createdAt, u.updatedAt
        ORDER BY u.createdAt DESC
      `;
      this.db.all(sql, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const usersWithParsedRoles = rows.map(row => ({
            ...row,
            roles: row.roles ? row.roles.split(',') : ['SUBMITTER']
          }));
          resolve(usersWithParsedRoles);
        }
      });
    });
  }

  getUserById(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.*, GROUP_CONCAT(ur.role) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.userId
        WHERE u.id = ?
        GROUP BY u.id
      `;
      this.db.get(sql, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            row.roles = row.roles ? row.roles.split(',') : ['SUBMITTER'];
          }
          resolve(row);
        }
      });
    });
  }

  updateUser(id: number, userData: Partial<{ name: string; email: string; password?: string; roles: string[] }>): Promise<any> {
    return new Promise((resolve, reject) => {
      const updates = [];
      const values = [];
      
      if (userData.name) {
        updates.push('name = ?');
        values.push(userData.name);
      }
      if (userData.email) {
        updates.push('email = ?');
        values.push(userData.email);
      }
      if (userData.password) {
        updates.push('password = ?');
        values.push(userData.password);
      }
      
      updates.push('updatedAt = ?');
      values.push(new Date().toISOString());
      values.push(id);

      const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      
      this.db.run(sql, values, (err) => {
        if (err) {
          reject(err);
        } else {
          // Update roles if provided
          if (userData.roles) {
            // Use a transaction to ensure atomicity
            this.db.serialize(() => {
              this.db.run('BEGIN TRANSACTION', (beginErr) => {
                if (beginErr) {
                  reject(beginErr);
                  return;
                }
                
                // Delete existing roles
                this.db.run('DELETE FROM user_roles WHERE userId = ?', [id], (deleteErr) => {
                  if (deleteErr) {
                    this.db.run('ROLLBACK');
                    reject(deleteErr);
                    return;
                  }
                  
                  // Insert new roles one by one to avoid conflicts
                  let insertCount = 0;
                  const totalRoles = userData.roles!.length;
                  
                  if (totalRoles === 0) {
                    this.db.run('COMMIT', (commitErr) => {
                      if (commitErr) {
                        reject(commitErr);
                      } else {
                        resolve({ id, ...userData, updatedAt: new Date() });
                      }
                    });
                    return;
                  }
                  
                  userData.roles!.forEach(role => {
                    const roleSql = `INSERT INTO user_roles (userId, role) VALUES (?, ?)`;
                    this.db.run(roleSql, [id, role], (roleErr) => {
                      if (roleErr) {
                        this.db.run('ROLLBACK');
                        reject(roleErr);
                        return;
                      }
                      
                      insertCount++;
                      if (insertCount === totalRoles) {
                        this.db.run('COMMIT', (commitErr) => {
                          if (commitErr) {
                            reject(commitErr);
                          } else {
                            resolve({ id, ...userData, updatedAt: new Date() });
                          }
                        });
                      }
                    });
                  });
                });
              });
            });
          } else {
            resolve({ id, ...userData, updatedAt: new Date() });
          }
        }
      });
    });
  }

  deleteUser(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      // Delete user roles first (though CASCADE should handle this)
      const deleteRolesSql = `DELETE FROM user_roles WHERE userId = ?`;
      this.db.run(deleteRolesSql, [id], (rolesErr) => {
        if (rolesErr) {
          reject(rolesErr);
        } else {
          // Delete user
          const deleteUserSql = `DELETE FROM users WHERE id = ?`;
          this.db.run(deleteUserSql, [id], function(err) {
            if (err) {
              reject(err);
            } else {
              if (this.changes === 0) {
                reject(new Error('User not found'));
              } else {
                resolve({ id, message: 'User deleted successfully' });
              }
            }
          });
        }
      });
    });
  }

  // Bill operations
  createBill(billData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO bills (id, title, description, firmId, amount, fileName, fileUrl, transportFileName, transportFileUrl, status, submittedBy, submittedAt, items, auditTrail) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
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
        billData.firmId || null,
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

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            ...billData,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      });
    });
  }

  getBills(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM bills ORDER BY submittedAt DESC`;
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse items JSON for each bill
          const parsedRows = (rows as any[]).map((row: any) => ({
            ...row,
            items: row.items ? JSON.parse(row.items) : [],
            auditTrail: row.auditTrail ? JSON.parse(row.auditTrail) : []
          }));
          resolve(parsedRows);
        }
      });
    });
  }

  getBillById(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM bills WHERE id = ?`;
      this.db.get(sql, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
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

  updateBill(id: string, updates: any): Promise<any> {
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
      
      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
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

  deleteBill(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM bills WHERE id = ?`;
      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  close(): void {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }

  // Password migration helper
  updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId],
        (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
}

// Create singleton instance
export const dbService = new DatabaseService();
export default DatabaseService;