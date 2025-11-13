import { ApiTestClient, setupTestClient, teardownTestClient } from '../../../../../tests/helpers/api-client';
import { AuthObjectMother } from 'src/common/tests/object-mothers/auth-object-mother';

/**
 * Course Lifecycle E2E Tests
 * Tests complete course workflow from creation to deletion
 */
describe('Course Lifecycle E2E', () => {
  let client: ApiTestClient;

  beforeAll(async () => {
    // Skip e2e tests in offline mode
    if (process.env.IS_OFFLINE === 'true') {
      throw new Error('Cannot run e2e tests in offline mode');
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

  describe('Complete Course Workflow', () => {
    it('should complete full course lifecycle: register -> create -> view -> update -> delete', async () => {
      // Step 1: Register user
      const registerDto = AuthObjectMother.buildRegisterDto({ password: 'strongpassword' });
      const registerResponse = await client.post('/api/auth/register', registerDto);
      expect(registerResponse.status).toBe(201);
      expect(registerResponse.data).toHaveProperty('access_token');

      const token = registerResponse.data.access_token;
      client.setAuthToken(token);

      // Step 2: Create course
      const courseData = {
        name: 'Complete E2E Test Course',
        price: 150,
        date_start: new Date().toISOString(),
        date_finish: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const createResponse = await client.post('/api/courses', courseData);
      expect(createResponse.status).toBe(201);
      expect(createResponse.data).toMatchObject({
        name: courseData.name,
        price: courseData.price,
      });

      const courseId = createResponse.data.id;

      // Step 3: View course in list
      const listResponse = await client.get('/api/courses');
      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.data)).toBe(true);
      expect(listResponse.data.length).toBe(1);
      expect(listResponse.data[0].id).toBe(courseId);

      // Step 4: Get single course
      const getResponse = await client.get(`/api/courses/${courseId}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.data.id).toBe(courseId);
      expect(getResponse.data.name).toBe(courseData.name);

      // Step 5: Update course
      const updateData = {
        name: 'Updated Course Name',
        price: 200,
      };

      const updateResponse = await client.patch(`/api/courses/${courseId}`, updateData);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.name).toBe(updateData.name);
      expect(updateResponse.data.price).toBe(updateData.price);

      // Step 6: Verify update persisted
      const verifyUpdateResponse = await client.get(`/api/courses/${courseId}`);
      expect(verifyUpdateResponse.status).toBe(200);
      expect(verifyUpdateResponse.data.name).toBe(updateData.name);
      expect(verifyUpdateResponse.data.price).toBe(updateData.price);

      // Step 7: Delete course
      const deleteResponse = await client.delete(`/api/courses/${courseId}`);
      expect(deleteResponse.status).toBe(200);

      // Step 8: Verify course is deleted
      const verifyDeleteResponse = await client.get(`/api/courses/${courseId}`);
      expect(verifyDeleteResponse.status).toBe(404);

      // Step 9: Verify course not in list
      const finalListResponse = await client.get('/api/courses');
      expect(finalListResponse.status).toBe(200);
      expect(finalListResponse.data.length).toBe(0);
    });

    it('should handle multiple courses workflow', async () => {
      // Register user
      const registerDto = AuthObjectMother.buildRegisterDto({ password: 'strongpassword' });
      const registerResponse = await client.post('/api/auth/register', registerDto);
      expect(registerResponse.status).toBe(201);

      const token = registerResponse.data.access_token;
      client.setAuthToken(token);

      // Create multiple courses
      const courses: any[] = [];
      for (let i = 0; i < 3; i++) {
        const courseData = {
          name: `Course ${i + 1}`,
          price: 100 + i * 50,
          date_start: new Date().toISOString(),
          date_finish: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

        const createResponse = await client.post('/api/courses', courseData);
        expect(createResponse.status).toBe(201);
        courses.push(createResponse.data);
      }

      // Verify all courses exist
      const listResponse = await client.get('/api/courses');
      expect(listResponse.status).toBe(200);
      expect(listResponse.data.length).toBe(3);

      // Update each course
      for (const course of courses) {
        const updateData = { name: `${course.name} - Updated` };
        const updateResponse = await client.patch(`/api/courses/${course.id}`, updateData);
        expect(updateResponse.status).toBe(200);
      }

      // Delete first course
      const deleteResponse = await client.delete(`/api/courses/${courses[0].id}`);
      expect(deleteResponse.status).toBe(200);

      // Verify only 2 courses remain
      const finalListResponse = await client.get('/api/courses');
      expect(finalListResponse.status).toBe(200);
      expect(finalListResponse.data.length).toBe(2);
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should handle login and course operations', async () => {
      // Register user
      const registerDto = AuthObjectMother.buildRegisterDto({ password: 'strongpassword' });
      const registerResponse = await client.post('/api/auth/register', registerDto);
      expect(registerResponse.status).toBe(201);

      // Clear auth token to simulate logout
      client.clearAuthToken();

      // Login again
      const loginDto = AuthObjectMother.buildLoginDto({
        email: registerDto.email,
        password: registerDto.password,
      });
      const loginResponse = await client.post('/api/auth/login', loginDto);
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data).toHaveProperty('access_token');

      // Use new token
      const newToken = loginResponse.data.access_token;
      client.setAuthToken(newToken);

      // Create course with new token
      const courseData = {
        name: 'Course after login',
        price: 100,
        date_start: new Date().toISOString(),
        date_finish: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const createResponse = await client.post('/api/courses', courseData);
      expect(createResponse.status).toBe(201);

      // Logout
      const logoutResponse = await client.post('/api/auth/logout');
      expect(logoutResponse.status).toBe(200);

      // Clear token
      client.clearAuthToken();

      // Try to create course without auth - should fail
      const unauthCreateResponse = await client.post('/api/courses', courseData);
      expect(unauthCreateResponse.status).toBe(403);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid course data throughout workflow', async () => {
      // Register user
      const registerDto = AuthObjectMother.buildRegisterDto({ password: 'strongpassword' });
      const registerResponse = await client.post('/api/auth/register', registerDto);
      expect(registerResponse.status).toBe(201);

      client.setAuthToken(registerResponse.data.access_token);

      // Try to create course with empty name - should fail
      const invalidCourseData = {
        name: '',
        price: 100,
        date_start: new Date().toISOString(),
        date_finish: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const createResponse = await client.post('/api/courses', invalidCourseData);
      expect(createResponse.status).toBe(400);

      // Create valid course
      const validCourseData = {
        name: 'Valid Course',
        price: 100,
        date_start: new Date().toISOString(),
        date_finish: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const validCreateResponse = await client.post('/api/courses', validCourseData);
      expect(validCreateResponse.status).toBe(201);
      const courseId = validCreateResponse.data.id;

      // Try to update with invalid data - should fail
      const invalidUpdateData = { name: '' };
      const invalidUpdateResponse = await client.patch(`/api/courses/${courseId}`, invalidUpdateData);
      expect(invalidUpdateResponse.status).toBe(400);

      // Verify course data unchanged
      const getResponse = await client.get(`/api/courses/${courseId}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.data.name).toBe(validCourseData.name);
    });
  });
});
