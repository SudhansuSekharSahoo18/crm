# Azure SQL Server Migration Guide

## 📋 Overview
This guide will help you migrate from SQLite to Azure SQL Server.

## 🚀 Quick Start

### Step 1: Install Dependencies
```powershell
cd C:\Sudhansu\repos\crm\crm-backend
npm install mssql
```

### Step 2: Create Azure SQL Database

#### Option A: Using Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new **SQL Database**
3. Fill in the details:
   - **Server**: Create new or select existing
   - **Database name**: `crm_db`
   - **Compute + Storage**: Basic or Standard tier
4. Note your connection details:
   - Server name (e.g., `your-server.database.windows.net`)
   - Admin username
   - Admin password

#### Option B: Using Azure CLI
```bash
# Login to Azure
az login

# Create resource group
az group create --name crm-rg --location eastus

# Create SQL Server
az sql server create \
  --name your-crm-server \
  --resource-group crm-rg \
  --location eastus \
  --admin-user sqladmin \
  --admin-password YourStrongPassword123!

# Create SQL Database
az sql db create \
  --resource-group crm-rg \
  --server your-crm-server \
  --name crm_db \
  --service-objective S0
```

### Step 3: Configure Firewall
1. In Azure Portal, go to your SQL Server
2. Navigate to **Networking** under **Security**
3. Add your client IP address:
   - Click "Add your client IPv4 address"
4. Enable "Allow Azure services and resources to access this server"
5. Click **Save**

### Step 4: Run Database Creation Script

#### Using Azure Data Studio (Recommended):
1. Download and install [Azure Data Studio](https://docs.microsoft.com/en-us/sql/azure-data-studio/download)
2. Connect to your Azure SQL Database:
   - Server: `your-server.database.windows.net`
   - Authentication: SQL Login
   - Username: `sqladmin`
   - Password: Your password
   - Database: `crm_db`
3. Open the file: `src/scripts/createScriptDB.sql`
4. Click **Run** or press `F5`

#### Using SSMS (SQL Server Management Studio):
1. Download and install [SSMS](https://aka.ms/ssmsfullsetup)
2. Connect to your Azure SQL Server
3. Open `createScriptDB.sql`
4. Execute the script

### Step 5: Update Environment Variables

Edit `crm-backend/.env`:

```env
# Azure SQL Server Configuration
DB_SERVER=your-server.database.windows.net
DB_PORT=1433
DB_NAME=crm_db
DB_USER=sqladmin
DB_PASSWORD=YourStrongPassword123!
DB_ENCRYPT=true
DB_TRUST_CERT=false
```

### Step 6: Seed Admin User
```powershell
npm run seed:admin
```

Expected output:
```
🌱 Seeding admin user to Azure SQL Server...
🔌 Connecting to Azure SQL Server...
✅ Connected to Azure SQL Server
✅ Admin user created successfully in Azure SQL Server!

📋 Admin Credentials:
   Email: admin@crm.com
   Phone: +919876543210
   Password: Admin@123
```

### Step 7: Start Application
```powershell
npm run dev
```

## 🔧 Local SQL Server Development

If you prefer local SQL Server for development:

### Install SQL Server
1. Download [SQL Server Developer Edition](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (Free)
2. Install with default settings
3. Enable SQL Server Authentication

### Update .env for Local SQL Server
```env
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=crm_db
DB_USER=sa
DB_PASSWORD=YourLocalPassword123!
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

### Create Database
```sql
CREATE DATABASE crm_db;
GO
USE crm_db;
GO
-- Then run the createScriptDB.sql script
```

## 📊 Verify Database Setup

### Check Tables
```sql
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;
```

Expected tables:
- `bills`
- `firms`
- `user_roles`
- `users`

### Check Admin User
```sql
SELECT u.*, STRING_AGG(ur.role, ',') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.userId
WHERE u.email = 'admin@crm.com'
GROUP BY u.id, u.name, u.email, u.phone, u.password, u.createdAt, u.updatedAt;
```

## 🐛 Troubleshooting

### Connection Errors

**Error: "Login failed for user"**
- Verify credentials in `.env` file
- Check SQL Server authentication is enabled
- Verify user has access to the database

**Error: "Cannot connect to server"**
- Check server name is correct
- Verify port 1433 is open
- Check firewall rules in Azure Portal

**Error: "Client IP address not allowed"**
- Add your IP to Azure SQL Server firewall rules
- Enable "Allow Azure services" if deploying to Azure

### SSL/TLS Errors

**Error: "Self-signed certificate"**
- For local dev: Set `DB_TRUST_CERT=true`
- For Azure: Set `DB_ENCRYPT=true` and `DB_TRUST_CERT=false`

### Database Errors

**Error: "Invalid object name 'users'"**
- Run the `createScriptDB.sql` script
- Verify you're connected to the correct database

**Error: "Cannot insert duplicate key"**
- Admin user already exists
- Run seed script with check: It will skip if exists

## 📈 Performance Optimization

### Connection Pooling
Already configured in `sqlConfig`:
```typescript
pool: {
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000
}
```

### Indexes
All necessary indexes are created by `createScriptDB.sql`:
- Email and phone lookups
- Foreign key relationships
- Status and date queries

### Query Performance
Monitor slow queries:
```sql
SELECT TOP 10
    qs.execution_count,
    qs.total_elapsed_time / qs.execution_count AS avg_elapsed_time,
    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(qt.text)
            ELSE qs.statement_end_offset
        END - qs.statement_start_offset)/2) + 1) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY qs.total_elapsed_time / qs.execution_count DESC;
```

## 🔐 Security Best Practices

1. **Never commit .env file** - Add to `.gitignore`
2. **Use strong passwords** - At least 12 characters with mixed case, numbers, symbols
3. **Rotate credentials regularly** - Change passwords every 90 days
4. **Use Azure Key Vault** - Store secrets in Key Vault for production
5. **Limit firewall rules** - Only allow specific IP addresses
6. **Enable auditing** - Track database access in Azure
7. **Use managed identities** - For Azure deployments

## 🚢 Deployment Checklist

- [ ] Azure SQL Database created
- [ ] Firewall rules configured
- [ ] Database schema deployed (`createScriptDB.sql`)
- [ ] Admin user seeded
- [ ] Environment variables set
- [ ] Connection pooling configured
- [ ] SSL/TLS enabled
- [ ] Backup configured in Azure
- [ ] Monitoring enabled

## 📚 Additional Resources

- [Azure SQL Database Documentation](https://docs.microsoft.com/en-us/azure/azure-sql/)
- [Node.js mssql Package](https://www.npmjs.com/package/mssql)
- [Azure Data Studio](https://docs.microsoft.com/en-us/sql/azure-data-studio/)
- [SQL Server Management Studio](https://aka.ms/ssmsfullsetup)
