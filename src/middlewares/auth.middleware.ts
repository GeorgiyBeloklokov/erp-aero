import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getUserById, isTokenBlocked } from '../services/auth.service';
import { config } from '../config';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    if (await isTokenBlocked(token)) {
      return res.status(403).json({ message: 'Token is blocked' });
    }
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id: number };
    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};
