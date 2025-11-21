import bcrypt from 'bcrypt';
import DatabaseService from '../services/databaseService';

class PasswordMigration {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  async migratePasswordsToHash(): Promise<void> {
    try {
      console.log('Starting password migration...');
      const users = await this.db.getAllUsers();
      
      for (const user of users) {
        // Check if password is already hashed (bcrypt hashes start with $2b$ and are 60 chars long)
        const isAlreadyHashed = user.password.startsWith('$2b$') && user.password.length === 60;
        
        if (!isAlreadyHashed) {
          console.log(`Migrating password for user: ${user.email}`);
          const hashedPassword = await bcrypt.hash(user.password, 10);
          
          // Update the user's password in the database
          await this.db.updateUserPassword(user.id, hashedPassword);
          console.log(`Successfully migrated password for user: ${user.email}`);
        } else {
          console.log(`Password for user ${user.email} is already hashed, skipping.`);
        }
      }
      
      console.log('Password migration completed successfully!');
    } catch (error) {
      console.error('Error during password migration:', error);
      throw error;
    }
  }
}

export default PasswordMigration;