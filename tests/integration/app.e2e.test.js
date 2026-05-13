const request = require('supertest');
const { app } = require('../../dist/app.js');

describe('API integration', () => {
  it('GET /api/health should return 200', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });

  it('GET /api/admin/dashboard without token should return 401', async () => {
    const response = await request(app).get('/api/admin/dashboard');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/admin/login with invalid payload should return 400', async () => {
    const response = await request(app).post('/api/admin/login').send({
      email: 'not-an-email',
      password: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/otp/send with invalid payload should return 400', async () => {
    const response = await request(app).post('/api/otp/send').send({
      matricule: '',
      email: 'not-an-email',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
