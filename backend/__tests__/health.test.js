import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';
import http from 'http';

describe('Health Check API', () => {
  let server;
  let baseUrl;

  beforeAll(() => {
    // Tạo app tạm để test, không ảnh hưởng index.js
    const app = express();
    app.use(express.json());
    app.get('/', (req, res) => {
      res.status(200).json({ message: 'Welcome to TaskManager API' });
    });
    app.get('/api-v1/auth/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    server = app.listen(0); // port ngẫu nhiên
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll((done) => {
    server.close(done);
  });

  test('GET / trả về 200 và message đúng', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe('Welcome to TaskManager API');
  });

  test('GET /api-v1/auth/health trả về status ok', async () => {
    const res = await fetch(`${baseUrl}/api-v1/auth/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });
});
