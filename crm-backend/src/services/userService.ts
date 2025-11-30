import DatabaseService from './databaseService';

class UserService {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  async findAll() {
    return await this.db.getAllUsers();
  }

  async create(userData: { username?: string; name?: string; email: string; password: string; roles?: string[]; role?: string }) {
    // Handle both username and name fields for compatibility
    const name = userData.name || userData.username;
    // Handle both roles array and single role for compatibility
    const roles = userData.roles || (userData.role ? [userData.role] : ['SUBMITTER']);
    
    if (!name || !userData.email || !userData.password) {
      throw new Error('Name, email, and password are required');
    }

    return await this.db.createUser(name, userData.email, userData.password, roles);
  }

  async findById(id: number) {
    return await this.db.getUserById(id);
  }

  async findByIdAndUpdate(id: number, userData: any, options?: { new?: boolean }) {
    console.log(`UserService: Updating user ${id} with data:`, userData);
    const updated = await this.db.updateUser(id, userData);
    console.log(`UserService: Update result:`, updated);
    return updated;
  }

  async findByIdAndDelete(id: number) {
    return await this.db.deleteUser(id);
  }

  async findByEmail(email: string) {
    console.log('UserService: Looking for user with email:', email);
    const user = await this.db.getUserByEmail(email);
    console.log('UserService: User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('UserService: User details:', { id: user.id, email: user.email, name: user.name });
      console.log('UserService: Password hash in DB:', user.password);
      console.log('UserService: Password hash length:', user.password ? user.password.length : 'null');
    }
    return user;
  }

  async findByPhone(phone: string) {
    console.log('UserService: Looking for user with phone:', phone);
    const user = await this.db.getUserByPhone(phone);
    console.log('UserService: User found:', user ? 'Yes' : 'No');
    return user;
  }
}

export default new UserService();