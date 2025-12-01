import DatabaseService from '../services/databaseService';
import bcrypt from 'bcrypt';

async function seedAdminUser() {
  const db = new DatabaseService();
  
  try {
    console.log('🌱 Seeding admin user...');
    
    // Check if admin already exists
    const existingAdmin = await db.getUserByEmail('admin@crm.com');
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('📧 Email: admin@crm.com');
      console.log('📱 Phone: +919876543210');
      console.log('🔑 Password: Admin@123');
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    // Create admin user
    const adminUser = await db.createUser(
      'Admin User',
      'admin@crm.com',
      hashedPassword,
      ['ADMIN'],
      '+919876543210'
    );
    
    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('   Email: admin@crm.com');
    console.log('   Phone: +919876543210');
    console.log('   Password: Admin@123');
    console.log('\n🔥 Firebase Setup Required:');
    console.log('   1. Go to Firebase Console > Authentication > Users');
    console.log('   2. Add user with email: admin@crm.com and password: Admin@123');
    console.log('   3. Go to Authentication > Sign-in method > Phone');
    console.log('   4. Under "Phone numbers for testing", add:');
    console.log('      Phone: +919876543210');
    console.log('      Code: 123456');
    console.log('\n✨ You can now login with either email or phone!\n');
    
  } catch (error: any) {
    console.error('❌ Error seeding admin user:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

seedAdminUser();
