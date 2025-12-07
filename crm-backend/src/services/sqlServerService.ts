import sql from 'mssql';
import { sqlConfig } from '../config/database';

class SQLServerService {
  private static instance: SQLServerService;
  private pool: sql.ConnectionPool | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): SQLServerService {
    if (!SQLServerService.instance) {
      SQLServerService.instance = new SQLServerService();
    }
    return SQLServerService.instance;
  }

  async initialize() {
    if (this.isInitialized && this.pool) {
      return;
    }

    try {
      console.log('🔌 Connecting to Azure SQL Server...');
      this.pool = await sql.connect(sqlConfig);
      this.isInitialized = true;
      console.log('✅ Connected to Azure SQL Server');
    } catch (error: any) {
      console.error('❌ SQL Server connection failed:', error.message);
      throw error;
    }
  }

  private async ensureConnection() {
    if (!this.pool || !this.isInitialized) {
      await this.initialize();
    }
  }

  // User Operations
  async createUser(name: string, email: string, password: string, roles: string[], phone?: string) {
    await this.ensureConnection();
    
    try {
      const request = this.pool!.request();
      
      // Insert user
      const result = await request
        .input('name', sql.NVarChar, name)
        .input('email', sql.NVarChar, email)
        .input('phone', sql.NVarChar, phone || null)
        .input('password', sql.NVarChar, password)
        .query(`
          INSERT INTO users (name, email, phone, password)
          OUTPUT INSERTED.id
          VALUES (@name, @email, @phone, @password)
        `);

      const userId = result.recordset[0].id;

      // Insert roles
      for (const role of roles) {
        await this.pool!.request()
          .input('userId', sql.Int, userId)
          .input('role', sql.NVarChar, role)
          .query(`
            INSERT INTO user_roles (userId, role)
            VALUES (@userId, @role)
          `);
      }

      return await this.getUserById(userId);
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(id: number) {
    await this.ensureConnection();
    
    try {
      const request = this.pool!.request();
      const result = await request
        .input('id', sql.Int, id)
        .query(`
          SELECT u.*, 
                 STRING_AGG(ur.role, ',') WITHIN GROUP (ORDER BY ur.role) as roles
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.userId
          WHERE u.id = @id
          GROUP BY u.id, u.name, u.email, u.phone, u.password, u.createdAt, u.updatedAt
        `);

      if (result.recordset.length === 0) return null;

      const user = result.recordset[0];
      return {
        ...user,
        roles: user.roles ? user.roles.split(',') : []
      };
    } catch (error: any) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string) {
    await this.ensureConnection();
    
    try {
      const request = this.pool!.request();
      const result = await request
        .input('email', sql.NVarChar, email)
        .query(`
          SELECT u.*, 
                 STRING_AGG(ur.role, ',') WITHIN GROUP (ORDER BY ur.role) as roles
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.userId
          WHERE u.email = @email
          GROUP BY u.id, u.name, u.email, u.phone, u.password, u.createdAt, u.updatedAt
        `);

      if (result.recordset.length === 0) return null;

      const user = result.recordset[0];
      return {
        ...user,
        roles: user.roles ? user.roles.split(',') : []
      };
    } catch (error: any) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async getUserByPhone(phone: string) {
    await this.ensureConnection();
    
    try {
      const request = this.pool!.request();
      const result = await request
        .input('phone', sql.NVarChar, phone)
        .query(`
          SELECT u.*, 
                 STRING_AGG(ur.role, ',') WITHIN GROUP (ORDER BY ur.role) as roles
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.userId
          WHERE u.phone = @phone
          GROUP BY u.id, u.name, u.email, u.phone, u.password, u.createdAt, u.updatedAt
        `);

      if (result.recordset.length === 0) return null;

      const user = result.recordset[0];
      return {
        ...user,
        roles: user.roles ? user.roles.split(',') : []
      };
    } catch (error: any) {
      console.error('Error getting user by phone:', error);
      throw error;
    }
  }

  async getAllUsers() {
    await this.ensureConnection();
    
    try {
      const result = await this.pool!.request().query(`
        SELECT u.*, 
               STRING_AGG(ur.role, ',') WITHIN GROUP (ORDER BY ur.role) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.userId
        GROUP BY u.id, u.name, u.email, u.phone, u.password, u.createdAt, u.updatedAt
        ORDER BY u.createdAt DESC
      `);

      return result.recordset.map(user => ({
        ...user,
        roles: user.roles ? user.roles.split(',') : []
      }));
    } catch (error: any) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: any) {
    await this.ensureConnection();
    
    try {
      const request = this.pool!.request();
      
      // Build dynamic update query
      const updateFields: string[] = [];
      
      if (updates.name) {
        updateFields.push('name = @name');
        request.input('name', sql.NVarChar, updates.name);
      }
      if (updates.email) {
        updateFields.push('email = @email');
        request.input('email', sql.NVarChar, updates.email);
      }
      if (updates.phone !== undefined) {
        updateFields.push('phone = @phone');
        request.input('phone', sql.NVarChar, updates.phone);
      }
      if (updates.password) {
        updateFields.push('password = @password');
        request.input('password', sql.NVarChar, updates.password);
      }
      
      if (updateFields.length > 0) {
        const query = `UPDATE users SET ${updateFields.join(', ')}, updatedAt = GETDATE() WHERE id = @id`;
        request.input('id', sql.Int, id);
        await request.query(query);
      }

      // Update roles if provided
      if (updates.roles && Array.isArray(updates.roles)) {
        // Delete existing roles
        await this.pool!.request()
          .input('userId', sql.Int, id)
          .query('DELETE FROM user_roles WHERE userId = @userId');

        // Insert new roles
        for (const role of updates.roles) {
          await this.pool!.request()
            .input('userId', sql.Int, id)
            .input('role', sql.NVarChar, role)
            .query('INSERT INTO user_roles (userId, role) VALUES (@userId, @role)');
        }
      }

      return await this.getUserById(id);
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: number) {
    await this.ensureConnection();
    
    try {
      await this.pool!.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM users WHERE id = @id');
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Firm Operations
  async createFirm(firmData: any) {
    await this.ensureConnection();
    
    try {
      const request = this.pool!.request();
      const result = await request
        .input('name', sql.NVarChar, firmData.name)
        .input('gstNumber', sql.NVarChar, firmData.gstNumber)
        .input('address', sql.NVarChar, firmData.address || null)
        .input('contactPerson', sql.NVarChar, firmData.contactPerson || null)
        .input('contactNumber', sql.NVarChar, firmData.contactNumber || null)
        .input('email', sql.NVarChar, firmData.email || null)
        .query(`
          INSERT INTO firms (name, gstNumber, address, contactPerson, contactNumber, email)
          OUTPUT INSERTED.id
          VALUES (@name, @gstNumber, @address, @contactPerson, @contactNumber, @email)
        `);

      return await this.getFirmById(result.recordset[0].id);
    } catch (error: any) {
      console.error('Error creating firm:', error);
      throw error;
    }
  }

  async getFirmById(id: number) {
    await this.ensureConnection();
    
    try {
      const result = await this.pool!.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM firms WHERE id = @id');
      
      return result.recordset[0] || null;
    } catch (error: any) {
      console.error('Error getting firm by ID:', error);
      throw error;
    }
  }

  async getAllFirms() {
    await this.ensureConnection();
    
    try {
      const result = await this.pool!.request()
        .query('SELECT * FROM firms ORDER BY createdAt DESC');
      return result.recordset;
    } catch (error: any) {
      console.error('Error getting all firms:', error);
      throw error;
    }
  }

  async updateFirm(id: number, updates: any) {
    await this.ensureConnection();
    
    try {
      const request = this.pool!.request();
      const updateFields: string[] = [];
      
      if (updates.name) {
        updateFields.push('name = @name');
        request.input('name', sql.NVarChar, updates.name);
      }
      if (updates.gstNumber) {
        updateFields.push('gstNumber = @gstNumber');
        request.input('gstNumber', sql.NVarChar, updates.gstNumber);
      }
      if (updates.address !== undefined) {
        updateFields.push('address = @address');
        request.input('address', sql.NVarChar, updates.address);
      }
      if (updates.contactPerson !== undefined) {
        updateFields.push('contactPerson = @contactPerson');
        request.input('contactPerson', sql.NVarChar, updates.contactPerson);
      }
      if (updates.contactNumber !== undefined) {
        updateFields.push('contactNumber = @contactNumber');
        request.input('contactNumber', sql.NVarChar, updates.contactNumber);
      }
      if (updates.email !== undefined) {
        updateFields.push('email = @email');
        request.input('email', sql.NVarChar, updates.email);
      }
      
      if (updateFields.length > 0) {
        const query = `UPDATE firms SET ${updateFields.join(', ')}, updatedAt = GETDATE() WHERE id = @id`;
        request.input('id', sql.Int, id);
        await request.query(query);
      }

      return await this.getFirmById(id);
    } catch (error: any) {
      console.error('Error updating firm:', error);
      throw error;
    }
  }

  async deleteFirm(id: number) {
    await this.ensureConnection();
    
    try {
      await this.pool!.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM firms WHERE id = @id');
      return true;
    } catch (error: any) {
      console.error('Error deleting firm:', error);
      throw error;
    }
  }

  // Bill Operations
  async createBill(billData: any) {
    await this.ensureConnection();
    
    try {
      const request = this.pool!.request();
      const result = await request
        .input('title', sql.NVarChar, billData.title)
        .input('firmId', sql.Int, billData.firmId || null)
        .input('amount', sql.Decimal(18, 2), billData.amount || null)
        .input('status', sql.NVarChar, billData.status || 'SUBMITTED')
        .input('submittedBy', sql.Int, billData.submittedBy)
        .input('fileUrl', sql.NVarChar, billData.fileUrl || null)
        .input('transportFileUrl', sql.NVarChar, billData.transportFileUrl || null)
        .input('dataEntry', sql.NVarChar, billData.dataEntry ? JSON.stringify(billData.dataEntry) : null)
        .input('auditTrail', sql.NVarChar, billData.auditTrail ? JSON.stringify(billData.auditTrail) : null)
        .query(`
          INSERT INTO bills (title, firmId, amount, status, submittedBy, fileUrl, transportFileUrl, dataEntry, auditTrail)
          OUTPUT INSERTED.id
          VALUES (@title, @firmId, @amount, @status, @submittedBy, @fileUrl, @transportFileUrl, @dataEntry, @auditTrail)
        `);

      return await this.getBillById(result.recordset[0].id);
    } catch (error: any) {
      console.error('Error creating bill:', error);
      throw error;
    }
  }

  async getBillById(id: number) {
    await this.ensureConnection();
    
    try {
      const result = await this.pool!.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM bills WHERE id = @id');
      
      if (result.recordset.length === 0) return null;

      const bill = result.recordset[0];
      return {
        ...bill,
        dataEntry: bill.dataEntry ? JSON.parse(bill.dataEntry) : null,
        auditTrail: bill.auditTrail ? JSON.parse(bill.auditTrail) : null
      };
    } catch (error: any) {
      console.error('Error getting bill by ID:', error);
      throw error;
    }
  }

  async getAllBills() {
    await this.ensureConnection();
    
    try {
      const result = await this.pool!.request()
        .query('SELECT * FROM bills ORDER BY submittedAt DESC');
      
      return result.recordset.map(bill => ({
        ...bill,
        dataEntry: bill.dataEntry ? JSON.parse(bill.dataEntry) : null,
        auditTrail: bill.auditTrail ? JSON.parse(bill.auditTrail) : null
      }));
    } catch (error: any) {
      console.error('Error getting all bills:', error);
      throw error;
    }
  }

  async updateBill(id: number, updates: any) {
    await this.ensureConnection();
    
    try {
      const request = this.pool!.request();
      const updateFields: string[] = [];
      
      if (updates.title) {
        updateFields.push('title = @title');
        request.input('title', sql.NVarChar, updates.title);
      }
      if (updates.firmId !== undefined) {
        updateFields.push('firmId = @firmId');
        request.input('firmId', sql.Int, updates.firmId);
      }
      if (updates.amount !== undefined) {
        updateFields.push('amount = @amount');
        request.input('amount', sql.Decimal(18, 2), updates.amount);
      }
      if (updates.status) {
        updateFields.push('status = @status');
        request.input('status', sql.NVarChar, updates.status);
      }
      if (updates.fileUrl !== undefined) {
        updateFields.push('fileUrl = @fileUrl');
        request.input('fileUrl', sql.NVarChar, updates.fileUrl);
      }
      if (updates.transportFileUrl !== undefined) {
        updateFields.push('transportFileUrl = @transportFileUrl');
        request.input('transportFileUrl', sql.NVarChar, updates.transportFileUrl);
      }
      if (updates.dataEntry !== undefined) {
        updateFields.push('dataEntry = @dataEntry');
        request.input('dataEntry', sql.NVarChar, JSON.stringify(updates.dataEntry));
      }
      if (updates.auditTrail !== undefined) {
        updateFields.push('auditTrail = @auditTrail');
        request.input('auditTrail', sql.NVarChar, JSON.stringify(updates.auditTrail));
      }
      
      if (updateFields.length > 0) {
        const query = `UPDATE bills SET ${updateFields.join(', ')}, updatedAt = GETDATE() WHERE id = @id`;
        request.input('id', sql.Int, id);
        await request.query(query);
      }

      return await this.getBillById(id);
    } catch (error: any) {
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  async deleteBill(id: number) {
    await this.ensureConnection();
    
    try {
      await this.pool!.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM bills WHERE id = @id');
      return true;
    } catch (error: any) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.close();
      this.isInitialized = false;
      console.log('✅ SQL Server connection closed');
    }
  }
}

export default SQLServerService.getInstance();
