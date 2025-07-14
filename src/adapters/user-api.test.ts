import request from 'supertest';
import express from 'express';
import userRouter from '../src/adapters/userRouter';

describe('User API', () => {
  const app = express();
  app.use(express.json());
  app.use(userRouter);

  it('GET /users возвращает массив', async () => {
    const res = await request(app).get('/users');
    expect(Array.isArray(res.body)).toBe(true);
  });
}); 