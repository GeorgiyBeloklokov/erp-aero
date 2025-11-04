import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    login: z.string().min(3, 'Login must be at least 3 characters long'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

export const signinSchema = z.object({
  body: z.object({
    login: z.string().min(1, 'Login is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});
