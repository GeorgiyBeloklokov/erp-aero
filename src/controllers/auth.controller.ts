import { Request, Response } from 'express';
import { hashPassword, createUser, generateTokens, getUserByLogin, comparePassword, verifyRefreshToken } from '../services/auth.service';
import pool from '../db';

export const signup = async (req: Request, res: Response) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ message: 'Login and password are required' });
  }

  try {
    const existingUser = await getUserByLogin(login);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const password_hash = await hashPassword(password);
    const user = await createUser(login, password_hash);

    const { accessToken, refreshToken } = generateTokens(user.id);

    await pool.execute(
      'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)',
      [user.id, refreshToken]
    );

    res.status(201).json({ accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const signin = async (req: Request, res: Response) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ message: 'Login and password are required' });
  }

  try {
    const user = await getUserByLogin(login);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id );

    await pool.execute(
      'UPDATE refresh_tokens SET token = ? WHERE user_id = ?',
      [refreshToken, user.id]
    );

    res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const user = await verifyRefreshToken(token);

    if (!user) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    await pool.execute(
      'UPDATE refresh_tokens SET token = ? WHERE user_id = ?',
      [refreshToken, user.id]
    );

    res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
