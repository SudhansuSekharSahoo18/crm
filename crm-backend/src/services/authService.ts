import userService from './userService';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const registerUser = async (userData: { email: string; password: string; username?: string; name?: string; roles?: string[] }) => {
  const { email, password, username, name, roles } = userData;

  try {
    console.log('Registering user:', email);
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');
    
    const newUser = await userService.create({
      email,
      name: name || username || email,
      password: hashedPassword,
      roles: roles || ['SUBMITTER'],
    });
    
    console.log('User created successfully:', newUser.id);
    return { id: newUser.id, email: newUser.email, name: newUser.name, roles: newUser.roles };
  } catch (error: any) {
    console.error('Registration error for', email, ':', error.message);
    throw new Error('Error registering user: ' + error.message);
  }
};

export const loginUser = async (credentials: { email: string; password: string }) => {
  const { email, password } = credentials;

  try {
    console.log('Login attempt for email:', email);
    const user = await userService.findByEmail(email);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('No user found with email:', email);
      throw new Error('Invalid credentials');
    }
    
    console.log('Comparing password...');
    console.log('Plain text password length:', password.length);
    console.log('Hashed password from DB:', user.password);
    console.log('Plain text password:', password);
    console.log('Hashed password length:', user.password ? user.password.length : 'null');
    
    let passwordMatch = false;
    
    // Check if password is hashed (bcrypt hashes start with $2b$ and are 60 chars long)
    const isHashed = user.password.startsWith('$2b$') && user.password.length === 60;
    
    if (isHashed) {
      // Password is hashed, use bcrypt compare
      passwordMatch = await bcrypt.compare(password, user.password);
      console.log('Using bcrypt compare - Password match:', passwordMatch);
    } else {
      // Password is plain text, do direct comparison (temporary fix)
      passwordMatch = password === user.password;
      console.log('Using plain text compare - Password match:', passwordMatch);
      
      // Hash the password for future use
      if (passwordMatch) {
        console.log('Updating password to hashed version...');
        const hashedPassword = await bcrypt.hash(password, 10);
        // Update password in database (fire and forget)
        userService.findByIdAndUpdate(user.id, { password: hashedPassword }).catch(err => {
          console.error('Error updating password hash:', err);
        });
      }
    }
    
    if (!passwordMatch) {
      console.log('Password does not match for user:', email);
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ id: user.id, roles: user.roles }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Login successful for user:', email);
    return { 
      token, 
      user: { id: user.id, email: user.email, name: user.name, roles: user.roles }
    };
  } catch (error: any) {
    console.error('Login error for', email, ':', error.message);
    throw new Error('Error logging in: ' + error.message);
  }
};

export const validateToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};