import { Request, Response, NextFunction } from 'express';

const roleCheck = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role; // Assuming req.user is populated by authentication middleware

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

export const checkRole = roleCheck;
export default roleCheck;