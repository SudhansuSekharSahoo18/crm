import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET as string, async (err: any, decoded: any) => {
    if (err) {
      return res.status(400).json({ message: 'Invalid token.' });
    }

    try {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      (req as any).user = user;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error.' });
    }
  });
};

export const authenticate = authMiddleware;
export default authMiddleware;