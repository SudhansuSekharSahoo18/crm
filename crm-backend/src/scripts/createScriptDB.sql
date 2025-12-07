-- =============================================
-- CRM Database Creation Script for Azure SQL Server
-- =============================================

-- Create Database (Run this separately in master database if needed)
-- CREATE DATABASE crm_db;
-- GO
-- USE crm_db;
-- GO

-- =============================================
-- Drop existing tables if they exist (for clean setup)
-- =============================================
IF OBJECT_ID('dbo.user_roles', 'U') IS NOT NULL
    DROP TABLE dbo.user_roles;
GO

IF OBJECT_ID('dbo.bills', 'U') IS NOT NULL
    DROP TABLE dbo.bills;
GO

IF OBJECT_ID('dbo.firms', 'U') IS NOT NULL
    DROP TABLE dbo.firms;
GO

IF OBJECT_ID('dbo.users', 'U') IS NOT NULL
    DROP TABLE dbo.users;
GO

-- =============================================
-- Create Users Table
-- =============================================
CREATE TABLE dbo.users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NULL,
    password NVARCHAR(255) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT UQ_users_phone UNIQUE (phone)
);
GO

-- Create index on email for faster lookups
CREATE NONCLUSTERED INDEX IX_users_email ON dbo.users(email);
GO

-- Create index on phone for faster lookups
CREATE NONCLUSTERED INDEX IX_users_phone ON dbo.users(phone) WHERE phone IS NOT NULL;
GO

-- =============================================
-- Create User Roles Table
-- =============================================
CREATE TABLE dbo.user_roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    role NVARCHAR(50) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_user_roles_userId FOREIGN KEY (userId) 
        REFERENCES dbo.users(id) ON DELETE CASCADE,
    CONSTRAINT UQ_user_role UNIQUE(userId, role),
    CONSTRAINT CK_user_roles_role CHECK (
        role IN ('ADMIN', 'SUBMITTER', 'APPROVER', 'DATA_ENTRY', 'DATA_APPROVER', 'VERIFIER')
    )
);
GO

-- Create index on userId for faster joins
CREATE NONCLUSTERED INDEX IX_user_roles_userId ON dbo.user_roles(userId);
GO

-- =============================================
-- Create Firms Table
-- =============================================
CREATE TABLE dbo.firms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    gstNumber NVARCHAR(15) NOT NULL,
    address NVARCHAR(MAX) NULL,
    contactPerson NVARCHAR(255) NULL,
    contactNumber NVARCHAR(20) NULL,
    email NVARCHAR(255) NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_firms_gstNumber UNIQUE (gstNumber)
);
GO

-- Create index on gstNumber for faster lookups
CREATE NONCLUSTERED INDEX IX_firms_gstNumber ON dbo.firms(gstNumber);
GO

-- =============================================
-- Create Bills Table
-- =============================================
CREATE TABLE dbo.bills (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    firmId INT NULL,
    amount DECIMAL(18,2) NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    submittedBy INT NOT NULL,
    submittedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    fileUrl NVARCHAR(MAX) NULL,
    transportFileUrl NVARCHAR(MAX) NULL,
    dataEntry NVARCHAR(MAX) NULL,
    auditTrail NVARCHAR(MAX) NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_bills_submittedBy FOREIGN KEY (submittedBy) 
        REFERENCES dbo.users(id),
    CONSTRAINT FK_bills_firmId FOREIGN KEY (firmId) 
        REFERENCES dbo.firms(id),
    CONSTRAINT CK_bills_status CHECK (
        status IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'DATA_ENTERED', 'DATA_APPROVED', 'VERIFIED', 'COMPLETED')
    )
);
GO

-- Create indexes for better query performance
CREATE NONCLUSTERED INDEX IX_bills_status ON dbo.bills(status);
GO

CREATE NONCLUSTERED INDEX IX_bills_submittedBy ON dbo.bills(submittedBy);
GO

CREATE NONCLUSTERED INDEX IX_bills_firmId ON dbo.bills(firmId) WHERE firmId IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_bills_submittedAt ON dbo.bills(submittedAt DESC);
GO

-- =============================================
-- Create Triggers for automatic updatedAt
-- =============================================

-- Trigger for users table
CREATE TRIGGER TR_users_UpdatedAt
ON dbo.users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.users
    SET updatedAt = GETDATE()
    FROM dbo.users u
    INNER JOIN inserted i ON u.id = i.id;
END;
GO

-- Trigger for firms table
CREATE TRIGGER TR_firms_UpdatedAt
ON dbo.firms
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.firms
    SET updatedAt = GETDATE()
    FROM dbo.firms f
    INNER JOIN inserted i ON f.id = i.id;
END;
GO

-- Trigger for bills table
CREATE TRIGGER TR_bills_UpdatedAt
ON dbo.bills
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.bills
    SET updatedAt = GETDATE()
    FROM dbo.bills b
    INNER JOIN inserted i ON b.id = i.id;
END;
GO

-- =============================================
-- Insert Sample Data (Optional - for development)
-- =============================================

-- Insert admin user (password: Admin@123 - bcrypt hashed)
-- Note: You should run the seed script instead for proper password hashing
-- This is just an example structure

-- INSERT INTO dbo.users (name, email, phone, password)
-- VALUES ('Admin User', 'admin@crm.com', '+919876543210', '$2b$10$...');
-- GO

-- INSERT INTO dbo.user_roles (userId, role)
-- VALUES (1, 'ADMIN');
-- GO

-- =============================================
-- Create Views for easier querying
-- =============================================

-- View to get users with their roles
CREATE VIEW vw_users_with_roles AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.phone,
    u.createdAt,
    u.updatedAt,
    STRING_AGG(ur.role, ',') WITHIN GROUP (ORDER BY ur.role) as roles
FROM dbo.users u
LEFT JOIN dbo.user_roles ur ON u.id = ur.userId
GROUP BY u.id, u.name, u.email, u.phone, u.createdAt, u.updatedAt;
GO

-- View to get bills with firm and user details
CREATE VIEW vw_bills_detailed AS
SELECT 
    b.id,
    b.title,
    b.amount,
    b.status,
    b.submittedAt,
    b.fileUrl,
    b.transportFileUrl,
    b.createdAt,
    b.updatedAt,
    f.name AS firmName,
    f.gstNumber AS firmGstNumber,
    u.name AS submittedByName,
    u.email AS submittedByEmail
FROM dbo.bills b
LEFT JOIN dbo.firms f ON b.firmId = f.id
INNER JOIN dbo.users u ON b.submittedBy = u.id;
GO

-- =============================================
-- Create Stored Procedures
-- =============================================

-- Procedure to get user with roles by email
CREATE PROCEDURE sp_GetUserByEmail
    @email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.password,
        u.createdAt,
        u.updatedAt,
        STRING_AGG(ur.role, ',') WITHIN GROUP (ORDER BY ur.role) as roles
    FROM dbo.users u
    LEFT JOIN dbo.user_roles ur ON u.id = ur.userId
    WHERE u.email = @email
    GROUP BY u.id, u.name, u.email, u.phone, u.password, u.createdAt, u.updatedAt;
END;
GO

-- Procedure to get user with roles by phone
CREATE PROCEDURE sp_GetUserByPhone
    @phone NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.password,
        u.createdAt,
        u.updatedAt,
        STRING_AGG(ur.role, ',') WITHIN GROUP (ORDER BY ur.role) as roles
    FROM dbo.users u
    LEFT JOIN dbo.user_roles ur ON u.id = ur.userId
    WHERE u.phone = @phone
    GROUP BY u.id, u.name, u.email, u.phone, u.password, u.createdAt, u.updatedAt;
END;
GO

-- Procedure to get bills by status
CREATE PROCEDURE sp_GetBillsByStatus
    @status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT * FROM vw_bills_detailed
    WHERE status = @status
    ORDER BY submittedAt DESC;
END;
GO

-- =============================================
-- Grant Permissions (adjust as needed)
-- =============================================

-- Example: Grant permissions to application user
-- CREATE USER crm_app_user WITH PASSWORD = 'YourStrongPassword123!';
-- GO

-- GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO crm_app_user;
-- GO

-- GRANT EXECUTE ON SCHEMA::dbo TO crm_app_user;
-- GO

-- =============================================
-- Verification Queries
-- =============================================

-- Verify tables created
SELECT 
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;
GO

-- Verify indexes created
SELECT 
    t.name AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.schema_id = SCHEMA_ID('dbo')
ORDER BY t.name, i.name;
GO

-- Verify foreign keys
SELECT 
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE fk.schema_id = SCHEMA_ID('dbo')
ORDER BY TableName;
GO

PRINT '✅ Database schema created successfully!';
PRINT '📋 Next steps:';
PRINT '   1. Run: npm run seed:admin (to create admin user)';
PRINT '   2. Update .env file with your SQL Server connection details';
PRINT '   3. Start the application: npm run dev';
GO
