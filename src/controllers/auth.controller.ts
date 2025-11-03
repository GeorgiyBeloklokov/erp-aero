import { Request, Response } from 'express';
import { hashPassword, createUser, generateTokens, getUserByLogin, comparePassword, verifyRefreshToken, replaceRefreshToken, deleteRefreshToken } from '../services/auth.service';
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

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id );

    await pool.execute(
      'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)',
      [user.id, refreshToken]
    );

    res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: oldToken } = req.body;

  if (!oldToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const user = await verifyRefreshToken(oldToken);

    if (!user) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newToken } = generateTokens(user.id);

    await replaceRefreshToken(oldToken, newToken);

    res.status(200).json({ accessToken, refreshToken: newToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    await deleteRefreshToken(refreshToken);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
