import request from 'supertest';
import app from '../index';
import { generateTokens } from '../services/auth.service';
import fs from 'fs';
import path from 'path';
import pool from '../db';

describe('File Routes', () => {
  let token: string;
  let testFilePath: string;
  const tempDir = path.join(__dirname, '../../uploads');
  const testUserId = 1;
  const testUserEmail = 'test@example.com';

  beforeAll(async () => {
    await pool.execute('INSERT IGNORE INTO users (id, login, password) VALUES (?, ?, ?)', [
      testUserId,
      testUserEmail,
      'hashedpassword',
    ]);

    const user = { id: testUserId, email: testUserEmail };
    const tokens = generateTokens(user.id);
    token = tokens.accessToken;

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    testFilePath = path.join(tempDir, 'test_upload.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for upload.');
  });

  afterAll(async () => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
      fs.rmdirSync(tempDir);
    }

    await pool.execute('DELETE FROM files WHERE user_id = ?', [testUserId]);
    await pool.execute('DELETE FROM users WHERE id = ?', [testUserId]);

    await pool.end();
  });

  it('should upload a file', async () => {
    const res = await request(app)
      .post('/file/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testFilePath);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('filename');
    expect(res.body).toHaveProperty('mime_type');
    expect(res.body).toHaveProperty('size');
    expect(res.body).toHaveProperty('upload_date');
    expect(res.body).toHaveProperty('user_id');
  });

  it('should download a file', async () => {
    const uploadRes = await request(app)
      .post('/file/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testFilePath);

    expect(uploadRes.statusCode).toEqual(201);
    const fileId = uploadRes.body.id;

    const downloadRes = await request(app).get(`/file/download/${fileId}`).set('Authorization', `Bearer ${token}`);

    expect(downloadRes.statusCode).toEqual(200);
    expect(downloadRes.headers['content-type']).toEqual('text/plain; charset=utf-8');
    expect(downloadRes.text).toEqual('This is a test file for upload.');
  });

  it('should return 404 if file not found during download', async () => {
    const res = await request(app).get('/file/download/nonexistentfileid').set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message', 'File not found');
  });

  it('should return 400 if no file is provided for upload', async () => {
    const res = await request(app).post('/file/upload').set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'No file provided');
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app).post('/file/upload');

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'No token provided');
  });

  it('should return 403 if invalid token is provided', async () => {
    const res = await request(app).post('/file/upload').set('Authorization', 'Bearer invalidtoken');

    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('message', 'Invalid token');
  });
});
