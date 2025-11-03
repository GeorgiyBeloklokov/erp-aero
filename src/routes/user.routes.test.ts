import request from 'supertest';
import express from 'express';
import userRouter from './user.routes';

const app = express();
app.use(express.json());
app.use(userRouter);


jest.mock('../middlewares/auth.middleware', () => ({
  verifyToken: jest.fn((req, res, next) => {
    req.user = { id: 1, login: 'testuser' };
    next();
  }),
}));

describe('User Routes', () => {
  describe('GET /info', () => {
    it('should return user info successfully', async () => {
      const res = await request(app)
        .get('/info');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', 1);
    });
  });
});
