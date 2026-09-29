const request = require('supertest');
const app = require('../app');
const { setupTestDB } = require('./setup');

setupTestDB();

describe('Auth Endpoints', () => {
  const testUser = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('should register a new user successfully and return user without passwordHash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('jane@example.com');
    expect(res.body.user.fullName).toBe('Jane Doe');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject registration if email is duplicate', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const duplicateRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(duplicateRes.statusCode).toBe(400);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.message).toMatch(/already exists/i);
  });

  it('should reject registration if passwords do not match', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, confirmPassword: 'differentPassword' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/do not match/i);
  });

  it('should login an existing user with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject login with incorrect password', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongPassword!' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('should get current user with valid cookie or token', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(testUser);
    const cookies = registerRes.headers['set-cookie'];

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.user.email).toBe(testUser.email);
  });

  it('should reject access to protected endpoint without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should logout and clear token cookie', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(testUser);
    const cookies = registerRes.headers['set-cookie'];

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookies);

    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });
});
