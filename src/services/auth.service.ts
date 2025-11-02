import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { User } from '../types/user';

const saltRounds = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, saltRounds);
};

export const generateTokens = (user: {id: number}) => {
  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '10m' });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET!);

  return { accessToken, refreshToken };
};

export const createUser = async (login: string, password_hash: string): Promise<User> => {
  const [result] = await pool.execute(
    'INSERT INTO users (login, password) VALUES (?, ?)',
    [login, password_hash]
  );
  const insertId = (result as any).insertId;
  return { id: insertId, login, password_hash };
};

export const getUserByLogin = async (login: string): Promise<User | null> => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE login = ?', [login]);
  const users = rows as any[];
  if (users.length === 0) {
    return null;
  }
  const user = users[0];
  return {
    id: user.id,
    login: user.login,
    password_hash: user.password
  };
};

export const comparePassword = async (password: string, password_hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, password_hash);
};

export const verifyRefreshToken = async (token: string): Promise<{ id: number; login: string; } | null> => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { id: number };
    const [rows] = await pool.execute('SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?', [token, decoded.id]);
    const tokens = rows as any[];
    if (tokens.length === 0) {
      return null;
    }
    const [userRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
    const users = userRows as any[];
    if (users.length === 0) {
      return null;
    }
    return users[0];
  } catch (error) {
    return null;
  }
};
