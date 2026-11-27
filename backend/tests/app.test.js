const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const {
  sanitizeTaskInput,
  registerSchema,
  loginSchema,
  createTaskSchema,
  updateTaskSchema,
} = require('../validators/schemas');

describe('Validation des entrées', () => {
  test('valide les inscriptions et bloque les injections ou champs trop courts', () => {
    assert.ok(registerSchema.validate({ username: { $ne: '' }, password: 'password123' }).error);
    assert.ok(registerSchema.validate({ username: 'ab', password: 'password123' }).error);
    assert.ok(registerSchema.validate({ username: 'alice', password: '1234' }).error);
    assert.equal(
      registerSchema.validate({ username: 'alice1', password: 'password123' }).error,
      undefined
    );
  });

  test('rejette un login vide ou avec opérateur Mongo', () => {
    assert.ok(loginSchema.validate({}).error);
    assert.ok(loginSchema.validate({ username: { $gt: '' }, password: 'abc' }).error);
  });

  test('supprime les balises HTML et rejette un titre vide après nettoyage', () => {
    const scriptOnly = sanitizeTaskInput({ title: '<script>alert("xss")</script>' });
    assert.ok(createTaskSchema.validate(scriptOnly).error);

    const htmlInput = sanitizeTaskInput({
      title: '<b>Faire les courses</b>',
      description: '<img src="x" onerror="alert(1)">Lait et pain',
    });
    const result = createTaskSchema.validate(htmlInput);
    assert.equal(result.error, undefined);
    assert.equal(result.value.title, 'Faire les courses');
    assert.equal(result.value.description, 'Lait et pain');
  });

  test('rejette une mise à jour vide et accepte isCompleted seul', () => {
    assert.ok(updateTaskSchema.validate({}).error);
    assert.equal(updateTaskSchema.validate({ isCompleted: true }).error, undefined);
  });
});

describe('Routes API et sécurité', () => {
  test('GET /api/health répond sans rate limiting', async () => {
    const res = await request(app).get('/api/health');
    assert.ok([200, 503].includes(res.status));
    assert.equal(res.headers['ratelimit-limit'], undefined);
    assert.ok(res.body.status);
    assert.ok(res.body.database);
    assert.equal(typeof res.body.uptime, 'number');
    assert.ok(res.body.timestamp);
  });

  test('retourne 404 en JSON sur une route inconnue', async () => {
    const res = await request(app).get('/api/route-inconnue');
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { msg: 'Route introuvable.' });
  });

  test('retourne 401 sans cookie ou avec un mauvais jeton', async () => {
    const noTokenRes = await request(app).get('/api/tasks');
    assert.equal(noTokenRes.status, 401);

    const badTokenRes = await request(app)
      .get('/api/tasks')
      .set('Cookie', ['token=faux.jeton.invalide']);
    assert.equal(badTokenRes.status, 401);
  });

  test('efface le cookie HttpOnly au logout', async () => {
    const res = await request(app).post('/api/auth/logout');
    assert.equal(res.status, 200);
    const setCookieHeader = res.headers['set-cookie'] ? res.headers['set-cookie'].join(';') : '';
    assert.ok(setCookieHeader.includes('token='));
    assert.ok(setCookieHeader.toLowerCase().includes('httponly'));
  });

  test('accepte le cookie JWT et retourne 400 sur un ObjectId invalide', async () => {
    const token = jwt.sign({ user: { id: '507f1f77bcf86cd799439011' } }, process.env.JWT_SECRET, {
      expiresIn: '1h',
      algorithm: 'HS256',
    });

    const res = await request(app)
      .put('/api/tasks/id-invalide')
      .set('Cookie', [`token=${token}`])
      .send({ title: 'Nouveau titre' });

    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { msg: 'Identifiant de tâche invalide.' });
  });

  test('applique les en-têtes Helmet et le CORS configuré', async () => {
    const allowedRes = await request(app).get('/api/health').set('Origin', 'http://localhost:3000');
    assert.equal(allowedRes.headers['x-content-type-options'], 'nosniff');
    assert.equal(allowedRes.headers['x-powered-by'], undefined);
    assert.equal(allowedRes.headers['access-control-allow-origin'], 'http://localhost:3000');

    const blockedRes = await request(app)
      .get('/api/health')
      .set('Origin', 'https://malicious.example');
    assert.equal(blockedRes.headers['access-control-allow-origin'], undefined);
  });
});
