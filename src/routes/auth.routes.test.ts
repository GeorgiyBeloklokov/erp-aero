import request from 'supertest';
import express from 'express';
import authRouter from './auth.routes';
import * as authService from '../services/auth.service';
import * as _authMiddleware from '../middlewares/auth.middleware';
import pool from '../db';

const app = express();
app.use(express.json());
app.use(authRouter);

jest.mock('../middlewares/auth.middleware', () => ({
  verifyToken: jest.fn((req, res, next) => {
    req.user = { id: 1, login: 'testuser' };
    next();
  }),
}));

jest.mock('../db', () => ({
  __esModule: true,
  default: {
    execute: jest.fn(),
  },
}));

describe('Auth Routes', () => {
  let getUserByLoginSpy: jest.SpyInstance;
  let createUserSpy: jest.SpyInstance;
  let comparePasswordSpy: jest.SpyInstance;
  let generateTokensSpy: jest.SpyInstance;
  let verifyRefreshTokenSpy: jest.SpyInstance;
  let deleteRefreshTokenSpy: jest.SpyInstance;

  beforeEach(() => {
    getUserByLoginSpy = jest.spyOn(authService, 'getUserByLogin');
    createUserSpy = jest.spyOn(authService, 'createUser');
    comparePasswordSpy = jest.spyOn(authService, 'comparePassword');
    generateTokensSpy = jest.spyOn(authService, 'generateTokens');
    verifyRefreshTokenSpy = jest.spyOn(authService, 'verifyRefreshToken');
    deleteRefreshTokenSpy = jest.spyOn(authService, 'deleteRefreshToken');

    (pool.execute as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /signup', () => {
    it('should register a new user successfully', async () => {
      getUserByLoginSpy.mockResolvedValue(null);
      createUserSpy.mockResolvedValue({ id: 1, login: 'testuser', password: 'hashedpassword' });
      generateTokensSpy.mockReturnValue({ accessToken: 'mockAccessToken', refreshToken: 'mockRefreshToken' });
      (pool.execute as jest.Mock)
        .mockResolvedValueOnce([[], undefined])
        .mockResolvedValueOnce([{ insertId: 1 }, undefined])
        .mockResolvedValueOnce([{}, undefined]);

      const res = await request(app).post('/signup').send({ login: 'testuser', password: 'password123' });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('accessToken', 'mockAccessToken');
      expect(res.body).toHaveProperty('refreshToken', 'mockRefreshToken');
      expect(getUserByLoginSpy).toHaveBeenCalledWith('testuser');
      expect(createUserSpy).toHaveBeenCalled();
      expect(generateTokensSpy).toHaveBeenCalledWith(1);
    });

    it('should return 409 if user already exists', async () => {
      getUserByLoginSpy.mockResolvedValue({ id: 1, login: 'testuser', password: 'hashedpassword' });
      (pool.execute as jest.Mock).mockResolvedValueOnce([
        [{ id: 1, login: 'testuser', password: 'hashedpassword' }],
        undefined,
      ]);

      const res = await request(app).post('/signup').send({ login: 'testuser', password: 'password123' });

      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty('message', 'User already exists');
      expect(getUserByLoginSpy).toHaveBeenCalledWith('testuser');
      expect(createUserSpy).not.toHaveBeenCalled();
    });

    it('should return 400 if login or password are not provided', async () => {
      const res = await request(app).post('/signup').send({ login: 'testuser' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Validation error');
      expect(res.body.errors[0].message).toBe('Invalid input: expected string, received undefined');
    });

    it('should return 400 if password is too short', async () => {
      const res = await request(app).post('/signup').send({ login: 'testuser', password: '123' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Validation error');
      expect(res.body.errors[0].message).toBe('Password must be at least 6 characters long');
    });
  });

  describe('POST /signin', () => {
    it('should log in a user successfully', async () => {
      getUserByLoginSpy.mockResolvedValue({ id: 1, login: 'testuser', password: 'hashedpassword' });
      comparePasswordSpy.mockResolvedValue(true);
      generateTokensSpy.mockReturnValue({ accessToken: 'mockAccessToken', refreshToken: 'mockRefreshToken' });
      (pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ id: 1, login: 'testuser', password: 'hashedpassword' }], undefined])
        .mockResolvedValueOnce([{}, undefined]);

      const res = await request(app).post('/signin').send({ login: 'testuser', password: 'password123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('accessToken', 'mockAccessToken');
      expect(res.body).toHaveProperty('refreshToken', 'mockRefreshToken');
      expect(getUserByLoginSpy).toHaveBeenCalledWith('testuser');
      expect(comparePasswordSpy).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(generateTokensSpy).toHaveBeenCalledWith(1);
    });

    it('should return 401 for invalid credentials (user not found)', async () => {
      getUserByLoginSpy.mockResolvedValue(null);
      (pool.execute as jest.Mock).mockResolvedValueOnce([[], undefined]);

      const res = await request(app).post('/signin').send({ login: 'testuser', password: 'password123' });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
      expect(getUserByLoginSpy).toHaveBeenCalledWith('testuser');
      expect(comparePasswordSpy).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid credentials (incorrect password)', async () => {
      getUserByLoginSpy.mockResolvedValue({ id: 1, login: 'testuser', password: 'hashedpassword' });
      comparePasswordSpy.mockResolvedValue(false);
      (pool.execute as jest.Mock).mockResolvedValueOnce([
        [{ id: 1, login: 'testuser', password: 'hashedpassword' }],
        undefined,
      ]);

      const res = await request(app).post('/signin').send({ login: 'testuser', password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
      expect(getUserByLoginSpy).toHaveBeenCalledWith('testuser');
      expect(comparePasswordSpy).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
    });

    it('should return 400 if login or password are not provided', async () => {
      const res = await request(app).post('/signin').send({ login: 'testuser' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Validation error');
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('POST /signin/new_token', () => {
    it('should refresh token successfully', async () => {
      verifyRefreshTokenSpy.mockResolvedValue({ id: 1, login: 'testuser' });
      generateTokensSpy.mockReturnValue({ accessToken: 'newMockAccessToken', refreshToken: 'newMockRefreshToken' });
      (pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ id: 1, token: 'oldRefreshToken' }], undefined])
        .mockResolvedValueOnce([{}, undefined]);

      const res = await request(app).post('/signin/new_token').send({ refreshToken: 'oldRefreshToken' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('accessToken', 'newMockAccessToken');
      expect(res.body).toHaveProperty('refreshToken', 'newMockRefreshToken');
      expect(verifyRefreshTokenSpy).toHaveBeenCalledWith('oldRefreshToken');
      expect(generateTokensSpy).toHaveBeenCalledWith(1);
    });

    it('should return 403 if refresh token is invalid', async () => {
      verifyRefreshTokenSpy.mockResolvedValue(null);
      (pool.execute as jest.Mock).mockResolvedValueOnce([[], undefined]);

      const res = await request(app).post('/signin/new_token').send({ refreshToken: 'invalidRefreshToken' });

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message', 'Invalid refresh token');
      expect(verifyRefreshTokenSpy).toHaveBeenCalledWith('invalidRefreshToken');
      expect(generateTokensSpy).not.toHaveBeenCalled();
    });

    it('should return 400 if refresh token is not provided', async () => {
      const res = await request(app).post('/signin/new_token').send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Validation error');
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('POST /logout', () => {
    it('should logout successfully', async () => {
      deleteRefreshTokenSpy.mockResolvedValueOnce(undefined);

      const res = await request(app).post('/logout').send({ refreshToken: 'mockRefreshToken' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Logged out successfully');
      expect(deleteRefreshTokenSpy).toHaveBeenCalledWith('mockRefreshToken');
    });

    it('should return 400 if refresh token is not provided', async () => {
      const res = await request(app).post('/logout').send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Validation error');
      expect(res.body).toHaveProperty('errors');
    });
  });
});
