import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ResultSetHeader } from 'mysql2/promise';
import pool from '../db';
import { RefreshToken } from '../types/refreshToken';
import { User } from '../types/user';
import { config } from '../config';

const saltRounds = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, saltRounds);
};

export const generateTokens = (id: number) => {
  const accessToken = jwt.sign({ id }, config.JWT_SECRET, { expiresIn: '10m' });
  const refreshToken = jwt.sign({ id }, config.JWT_REFRESH_SECRET);

  return { accessToken, refreshToken };
};

export const createUser = async (login: string, password_hash: string): Promise<User> => {
  const [result] = await pool.execute('INSERT INTO users (login, password) VALUES (?, ?)', [login, password_hash]);
  const insertId = (result as ResultSetHeader).insertId;
  return { id: insertId, login, password: password_hash };
};

export const getUserByLogin = async (login: string): Promise<User | null> => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE login = ?', [login]);
  const users = rows as User[];
  if (users.length === 0) {
    return null;
  }
  const user = users[0];
  return {
    id: user.id,
    login: user.login,
    password: user.password,
  };
};

export const getUserById = async (id: number): Promise<User | null> => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
  const users = rows as User[];
  if (users.length === 0) {
    return null;
  }
  const user = users[0];
  return {
    id: user.id,
    login: user.login,
    password: user.password,
  };
};

export const comparePassword = async (password: string, password_hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, password_hash);
};

export const verifyRefreshToken = async (token: string): Promise<{ id: number; login: string } | null> => {
  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as { id: number };
    const [rows] = await pool.execute('SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?', [
      token,
      decoded.id,
    ]);
    const tokens = rows as RefreshToken[];
    if (tokens.length === 0) {
      return null;
    }
    const [userRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
    const users = userRows as User[];
    if (users.length === 0) {
      return null;
    }
    return users[0];
  } catch (error) {
    return null;
  }
};

export const replaceRefreshToken = async (oldToken: string, newToken: string): Promise<void> => {
  await pool.execute('UPDATE refresh_tokens SET token = ? WHERE token = ?', [newToken, oldToken]);
};

export const deleteRefreshToken = async (token: string): Promise<void> => {
  await pool.execute('DELETE FROM refresh_tokens WHERE token = ?', [token]);
};

export const isTokenBlocked = async (token: string): Promise<boolean> => {
  const [rows] = await pool.execute('SELECT * FROM blocked_tokens WHERE token = ?', [token]);
  const tokens = rows as { id: number; token: string }[];
  return tokens.length > 0;
};

export const blockAccessToken = async (token: string): Promise<void> => {
  await pool.execute('INSERT INTO blocked_tokens (token) VALUES (?)', [token]);
};
