import request from 'supertest';
import app from './index';
import pool from './db';

describe('GET /', () => {
  it('should return 200 OK', () => {
    return request(app)
      .get('/')
      .expect(200);
  });

  it('should return the correct message', () => {
    return request(app)
      .get('/')
      .then(response => {
        expect(response.text).toBe('Express + TypeScript Server');
      });
  });
});

afterAll(async () => {
  await pool.end();
});
