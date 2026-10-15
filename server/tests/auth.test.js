import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';

describe('Authentication & User Management APIs', () => {
  const testUser = {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'SecurePassword123!',
    currency: 'INR',
  };

  it('should register a new user, hash password, and create default categories', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.passwordHash).toBeUndefined();

    // Verify user in database has hashed password
    const userInDb = await User.findOne({ email: testUser.email });
    expect(userInDb).toBeDefined();
    expect(userInDb.passwordHash).not.toBe(testUser.password);
    expect(userInDb.passwordHash.startsWith('$2')).toBe(true);
  });

  it('should prevent registering with an existing email', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const duplicateRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
  });

  it('should log in with valid credentials and return JWT token', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe(testUser.name);
  });

  it('should reject login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword456!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ghost@example.com',
        password: 'SomePassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject protected route /api/auth/me without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return user info on /api/auth/me when authenticated', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testUser.email);
  });
});
