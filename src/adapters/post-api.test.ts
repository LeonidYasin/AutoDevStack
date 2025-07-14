import request from 'supertest';
import express from 'express';
import postRouter from '../src/adapters/postRouter';

describe('Post API', () => {
  const app = express();
  app.use(express.json());
  app.use(postRouter);

  it('GET /posts возвращает массив', async () => {
    const res = await request(app).get('/posts');
    expect(Array.isArray(res.body)).toBe(true);
  });
}); 