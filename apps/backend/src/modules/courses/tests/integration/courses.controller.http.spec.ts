import { ApiTestClient, setupTestClient, teardownTestClient } from '../../../../../tests/helpers/api-client';
import { AuthObjectMother } from 'src/common/tests/object-mothers/auth-object-mother';
import { v4 as uuidv4 } from 'uuid';

/**
 * CoursesController Integration Tests (HTTP-based)
 * Tests the courses API via HTTP requests to external backend
 */
describe('CoursesController (HTTP integration)', () => {
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

  // Helper function to create authenticated user
  async function createAuthenticatedUser() {
    const dto = AuthObjectMother.buildRegisterDto({ password: 'strongpassword' });
    const registerResponse = await client.post('/api/auth/register', dto);
    const token = registerResponse.data.access_token;
    client.setAuthToken(token);
    return { token, userId: registerResponse.data.user?.id };
  }

  // Helper function to create a course
  async function createCourse(overrides: any = {}) {
    const courseData = {
      name: overrides.name || 'Test Course',
      price: overrides.price !== undefined ? overrides.price : 100,
      date_start: overrides.date_start || new Date().toISOString(),
      date_finish: overrides.date_finish || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const response = await client.post('/api/courses', courseData);
    return response;
  }

  // ---------- CREATE ----------
  describe('POST /api/courses', () => {
    it('should create a course', async () => {
      await createAuthenticatedUser();

      const dto = {
        name: 'New Test Course',
        price: 150,
        date_start: new Date().toISOString(),
        date_finish: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await client.post('/api/courses', dto);

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        name: dto.name,
        price: dto.price,
      });
      expect(response.data.id).toBeDefined();
    });

    it('should fail to create course with empty name', async () => {
      await createAuthenticatedUser();

      const dto = {
        name: '',
        price: 100,
        date_start: new Date().toISOString(),
        date_finish: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await client.post('/api/courses', dto);

      expect(response.status).toBe(400);
    });

    it('should fail to create course without authentication', async () => {
      const dto = {
        name: 'New Course',
        price: 100,
        date_start: new Date().toISOString(),
        date_finish: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await client.post('/api/courses', dto);

      expect(response.status).toBe(403);
    });
  });

  // ---------- FIND ALL ----------
  describe('GET /api/courses', () => {
    it('should return all courses', async () => {
      await createAuthenticatedUser();
      const createResponse = await createCourse();
      expect(createResponse.status).toBe(201);

      const response = await client.get('/api/courses');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(1);
      expect(response.data[0].id).toBe(createResponse.data.id);
    });

    it('should return empty array if no courses exist', async () => {
      const response = await client.get('/api/courses');

      expect(response.status).toBe(200);
      expect(response.data).toEqual([]);
    });

    it('should return courses without authentication', async () => {
      await createAuthenticatedUser();
      await createCourse();

      client.clearAuthToken();

      const response = await client.get('/api/courses');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  // ---------- FIND BY ID ----------
  describe('GET /api/courses/:id', () => {
    it('should return one course', async () => {
      await createAuthenticatedUser();
      const createResponse = await createCourse({ name: 'Test Course' });
      expect(createResponse.status).toBe(201);
      const courseId = createResponse.data.id;

      const response = await client.get(`/api/courses/${courseId}`);

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(courseId);
      expect(response.data.name).toBe('Test Course');
    });

    it('should return 404 for non-existing course', async () => {
      const nonExistingId = uuidv4();
      const response = await client.get(`/api/courses/${nonExistingId}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await client.get('/api/courses/invalid-uuid');

      expect(response.status).toBe(500);
    });
  });

  // ---------- UPDATE ----------
  describe('PATCH /api/courses/:id', () => {
    it('should update course', async () => {
      await createAuthenticatedUser();
      const createResponse = await createCourse();
      expect(createResponse.status).toBe(201);
      const courseId = createResponse.data.id;

      const dto = {
        name: 'Updated Course Name',
        price: 200,
      };

      const response = await client.patch(`/api/courses/${courseId}`, dto);

      expect(response.status).toBe(200);
      expect(response.data.name).toBe(dto.name);
      expect(response.data.price).toBe(dto.price);
    });

    it('should return 404 when updating non-existing course', async () => {
      await createAuthenticatedUser();

      const nonExistingId = uuidv4();
      const dto = {
        name: 'Updated Name',
      };

      const response = await client.patch(`/api/courses/${nonExistingId}`, dto);

      expect(response.status).toBe(404);
    });

    it('should fail to update without authentication', async () => {
      await createAuthenticatedUser();
      const createResponse = await createCourse();
      expect(createResponse.status).toBe(201);
      const courseId = createResponse.data.id;

      client.clearAuthToken();

      const dto = {
        name: 'Updated Name',
      };

      const response = await client.patch(`/api/courses/${courseId}`, dto);

      expect(response.status).toBe(403);
    });

    it('should partially update course', async () => {
      await createAuthenticatedUser();
      const createResponse = await createCourse({ price: 100 });
      expect(createResponse.status).toBe(201);
      const courseId = createResponse.data.id;

      const dto = {
        name: 'Only Name Updated',
      };

      const response = await client.patch(`/api/courses/${courseId}`, dto);

      expect(response.status).toBe(200);
      expect(response.data.name).toBe(dto.name);
      expect(response.data.price).toBe(100); // Original price unchanged
    });
  });

  // ---------- DELETE ----------
  describe('DELETE /api/courses/:id', () => {
    it('should delete course', async () => {
      await createAuthenticatedUser();
      const createResponse = await createCourse();
      expect(createResponse.status).toBe(201);
      const courseId = createResponse.data.id;

      const response = await client.delete(`/api/courses/${courseId}`);

      expect(response.status).toBe(200);

      // Verify course is deleted
      const getResponse = await client.get(`/api/courses/${courseId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existing course', async () => {
      await createAuthenticatedUser();

      const nonExistingId = uuidv4();
      const response = await client.delete(`/api/courses/${nonExistingId}`);

      expect(response.status).toBe(404);
    });

    it('should fail to delete without authentication', async () => {
      await createAuthenticatedUser();
      const createResponse = await createCourse();
      expect(createResponse.status).toBe(201);
      const courseId = createResponse.data.id;

      client.clearAuthToken();

      const response = await client.delete(`/api/courses/${courseId}`);

      expect(response.status).toBe(403);
    });
  });

  // ---------- SCHEMA ISOLATION ----------
  describe('Schema Isolation', () => {
    it('should isolate data between different schemas', async () => {
      // Create course in schema 1
      await createAuthenticatedUser();
      const createResponse1 = await createCourse({ name: 'Course in Schema 1' });
      expect(createResponse1.status).toBe(201);
      const courseId1 = createResponse1.data.id;

      // Verify course exists in schema 1
      const checkResponse1 = await client.get('/api/courses');
      expect(checkResponse1.status).toBe(200);
      expect(checkResponse1.data.length).toBe(1);
      expect(checkResponse1.data[0].id).toBe(courseId1);

      // Create a second client with different schema
      const client2 = await setupTestClient();

      try {
        // Client 2 should see empty list (different schema)
        const response2 = await client2.get('/api/courses');
        expect(response2.status).toBe(200);
        expect(response2.data.length).toBe(0);

        // Client 2 can create a course with same name (different schema)
        // First register user in client 2
        const dto2 = AuthObjectMother.buildRegisterDto({ password: 'strongpassword' });
        const registerResponse2 = await client2.post('/api/auth/register', dto2);
        expect(registerResponse2.status).toBe(201);
        client2.setAuthToken(registerResponse2.data.access_token);

        const createResponse2 = await client2.post('/api/courses', {
          name: 'Course in Schema 1', // Same name as in schema 1
          price: 100,
          date_start: new Date().toISOString(),
          date_finish: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        expect(createResponse2.status).toBe(201);

        // Both clients should see their own course (confirming isolation)
        const finalCheck2 = await client2.get('/api/courses');
        expect(finalCheck2.data.length).toBe(1);
        expect(finalCheck2.data[0].id).toBe(createResponse2.data.id);
      } finally {
        await teardownTestClient(client2);
      }
    });
  });
});
