import User from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const registerUser = async (userData: { email: string; password: string; username: string; role: string }) => {
  const { email, password, username, role } = userData;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      username,
      password: hashedPassword,
      role,
    });
    
    await newUser.save();

    return { id: newUser._id, email: newUser.email, username: newUser.username, role: newUser.role };
  } catch (error) {
    throw new Error('Error registering user');
  }
};

export const loginUser = async (credentials: { email: string; password: string }) => {
  const { email, password } = credentials;

  try {
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    return { 
      token, 
      user: { id: user._id, email: user.email, username: user.username, role: user.role }
    };
  } catch (error) {
    throw new Error('Error logging in');
  }
};

export const validateToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};