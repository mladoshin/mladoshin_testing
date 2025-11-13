import { ApiTestClient, setupTestClient, teardownTestClient } from '../../../../../tests/helpers/api-client';
import { AuthObjectMother } from 'src/common/tests/object-mothers/auth-object-mother';

/**
 * AuthController Integration Tests (HTTP-based)
 * Tests the auth API via HTTP requests to external backend
 * Lightweight runner without NestJS TestingModule
 */
describe('AuthController (HTTP integration)', () => {
  let client: ApiTestClient;

  beforeAll(async () => {
    // Skip integration tests in offline mode
    if (process.env.IS_OFFLINE === 'true') {
      throw new Error('Cannot run integration tests in offline mode');
    }

    // Create HTTP client with isolated schema
    client = await setupTestClient();
  });

  afterAll(async () => {
    // Cleanup: drop the test schema
    await teardownTestClient(client);
  });

  afterEach(async () => {
    // Reset schema (truncate all tables)
    await client.resetSchema();
    client.clearAuthToken();
  });

  // ---------- REGISTER ----------
  describe('POST /api/auth/register', () => {
    it('register_success', async () => {
      const dto = AuthObjectMother.buildRegisterDto({ password: 'strongpassword' });

      const response = await client.post('/api/auth/register', dto);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('access_token');
      expect(response.headers['set-cookie']).toBeDefined();
      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(setCookie![0]).toContain('refresh_token');
    });

    it('register_failure_validation', async () => {
      const dto = AuthObjectMother.buildRegisterDto({ password: '123' });

      const response = await client.post('/api/auth/register', dto);

      expect(response.status).toBe(400);
    });

    it('register_failure_conflict', async () => {
      const dto = AuthObjectMother.buildRegisterDto({ password: 'strongpassword' });

      // Create user first time
      const firstResponse = await client.post('/api/auth/register', dto);
      expect(firstResponse.status).toBe(201);

      // Try to register again with same email → Conflict
      const secondResponse = await client.post('/api/auth/register', dto);
      expect(secondResponse.status).toBe(409);
    });
  });

  // ---------- LOGIN ----------
  describe('POST /api/auth/login', () => {
    it('login_success', async () => {
      const registerDto = AuthObjectMother.buildRegisterDto({ password: 'strongpassword' });
      const loginDto = AuthObjectMother.buildLoginDto({
        email: registerDto.email,
        password: registerDto.password,
      });

      // Register user first
      await client.post('/api/auth/register', registerDto);

      // Login
      const response = await client.post('/api/auth/login', loginDto);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('access_token');
      expect(response.headers['set-cookie']).toBeDefined();
      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(setCookie![0]).toContain('refresh_token');
    });

    it('login_failure_unauthorized', async () => {
      const loginDto = AuthObjectMother.buildLoginDto({
        email: 'notfound@user.com',
        password: 'wrong',
      });

      const response = await client.post('/api/auth/login', loginDto);

      expect(response.status).toBe(401);
    });
  });

  // ---------- GET ME ----------
  describe('GET /api/auth/me', () => {
    it('get_me_success', async () => {
      const dto = AuthObjectMother.buildRegisterDto({ password: 'strongpassword' });

      // Register user
      const registerResponse = await client.post('/api/auth/register', dto);
      expect(registerResponse.status).toBe(201);

      const token = registerResponse.data.access_token;

      // Get user info
      const meResponse = await client.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(meResponse.status).toBe(200);
      expect(meResponse.data).toHaveProperty('id');
      expect(meResponse.data.email).toBe(dto.email);
    });

    it('get_me_failure_unauthorized', async () => {
      const response = await client.get('/api/auth/me');

      expect(response.status).toBe(403);
    });
  });

  // ---------- LOGOUT ----------
  describe('POST /api/auth/logout', () => {
    it('logout', async () => {
      const response = await client.post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ access_token: '' });
      expect(response.headers['set-cookie']).toBeDefined();
      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(setCookie![0]).toContain('refresh_token=;');
    });
  });

  // ---------- CHECK USER ----------
  describe('GET /api/auth/check', () => {
    it('check_user_exists', async () => {
      const dto = AuthObjectMother.buildRegisterDto({ password: 'strongpassword' });

      // Register user
      await client.post('/api/auth/register', dto);

      // Check if user exists
      const existsResponse = await client.get('/api/auth/check', {
        params: {
          email: dto.email,
        },
      });

      expect(existsResponse.status).toBe(200);
      expect(existsResponse.data.result).toBe(true);
    });

    it('check_user_not_exists', async () => {
      const response = await client.get('/api/auth/check', {
        params: {
          email: 'notexist@user.com',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.result).toBe(false);
    });
  });

  // ---------- SCHEMA ISOLATION ----------
  describe('Schema Isolation', () => {
    it('should isolate users between different schemas', async () => {
      const dto = AuthObjectMother.buildRegisterDto({ password: 'strongpassword' });

      // Register user in client 1
      const register1 = await client.post('/api/auth/register', dto);
      expect(register1.status).toBe(201);

      // Create a second client with different schema
      const client2 = await setupTestClient();

      try {
        // In client2 (different schema), same user should NOT exist
        // So we should be able to register the same email again
        const register2 = await client2.post('/api/auth/register', dto);
        expect(register2.status).toBe(201);

        // Now login with client1 - should work (user exists in schema 1)
        const loginDto = AuthObjectMother.buildLoginDto({
          email: dto.email,
          password: dto.password,
        });
        const login1 = await client.post('/api/auth/login', loginDto);
        expect(login1.status).toBe(200);

        // Login with client2 - should also work (user exists in schema 2)
        const login2 = await client2.post('/api/auth/login', loginDto);
        expect(login2.status).toBe(200);
      } finally {
        await teardownTestClient(client2);
      }
    });
  });
});
