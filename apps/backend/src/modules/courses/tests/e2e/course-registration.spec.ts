import { ApiTestClient, setupTestClient, teardownTestClient } from '../../../../../tests/helpers/api-client';
import { AuthObjectMother } from 'src/common/tests/object-mothers/auth-object-mother';
import { v4 as uuidv4 } from 'uuid';

/**
 * Course Registration E2E Tests (HTTP-based)
 * Tests complete course registration and purchase workflow via HTTP
 * Makes real HTTP requests to external backend container
 */
describe('Сценарий регистрации и покупки курса (E2E)', () => {
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

  // Helper function to register user and get token
  async function registerUserAndGetToken() {
    const registerDto = AuthObjectMother.buildRegisterDto({ password: 'SecurePassword123!' });
    const registerResponse = await client.post('/api/auth/register', registerDto);
    expect(registerResponse.status).toBe(201);
    const token = registerResponse.data.access_token;
    client.setAuthToken(token);
    return { token, email: registerDto.email };
  }

  // Helper function to create a course with lessons
  async function createCourseWithLessons() {
    const courseData = {
      name: 'Introduction to TypeScript',
      price: 100,
      date_start: new Date().toISOString(),
      date_finish: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const courseResponse = await client.post('/api/courses', courseData);
    expect(courseResponse.status).toBe(201);

    return courseResponse.data;
  }

  it('должен завершить полный сценарий регистрации пользователя и покупки курса', async () => {
    // Step 1: Register user and get authentication token
    const { token } = await registerUserAndGetToken();

    // Step 2: Create a course (as authenticated user)
    const course = await createCourseWithLessons();
    const courseId = course.id;

    // Step 3: Register for course (enroll)
    const enrollResponse = await client.post(`/api/courses/${courseId}/register`);
    expect(enrollResponse.status).toBe(201);
    expect(enrollResponse.data).toHaveProperty('id');
    expect(enrollResponse.data.course_id).toBe(courseId);
    expect(enrollResponse.data).toHaveProperty('status');

    // Step 4: Purchase the course
    const payResponse = await client.post(`/api/courses/${courseId}/pay`);
    expect(payResponse.status).toBe(201);
    expect(payResponse.data).toHaveProperty('success');
    expect(payResponse.data.success).toBe(true);

    // Step 5: Get the course's lessons
    const lessonsResponse = await client.get(`/api/courses/${courseId}/lessons`);
    expect(lessonsResponse.status).toBe(200);
    expect(Array.isArray(lessonsResponse.data)).toBe(true);

    // Verify lesson structure (at least we can access lessons after purchase)
    if (lessonsResponse.data.length > 0) {
      lessonsResponse.data.forEach((lesson: any) => {
        expect(lesson).toHaveProperty('id');
        expect(lesson).toHaveProperty('title');
        expect(lesson.course_id).toBe(courseId);
      });
    }
  });

  it('должен вернуть ошибку при регистрации на несуществующий курс', async () => {
    // Register a user first
    await registerUserAndGetToken();

    // Try to register for a non-existent course
    const nonExistentCourseId = uuidv4();
    const enrollResponse = await client.post(`/api/courses/${nonExistentCourseId}/register`);
    expect(enrollResponse.status).toBe(404);
  });

  it('должен запретить доступ к урокам без аутентификации', async () => {
    // Create a course first
    await registerUserAndGetToken();
    const course = await createCourseWithLessons();

    // Clear auth token
    client.clearAuthToken();

    // Try to access lessons without authentication
    const lessonsResponse = await client.get(`/api/courses/${course.id}/lessons`);
    expect(lessonsResponse.status).toBe(403);
  });

  it('должен запретить покупку курса без предварительной регистрации на него', async () => {
    // Register a user
    await registerUserAndGetToken();

    // Create a course
    const course = await createCourseWithLessons();

    // Try to purchase without enrolling first
    const payResponse = await client.post(`/api/courses/${course.id}/pay`);
    expect(payResponse.status).toBe(404);
  });

  it('должен разрешить просмотр деталей курса до регистрации', async () => {
    // Create a course as authenticated user
    await registerUserAndGetToken();
    const course = await createCourseWithLessons();

    // Clear authentication
    client.clearAuthToken();

    // Courses can be viewed without authentication (OptionalAuthGuard)
    const courseResponse = await client.get(`/api/courses/${course.id}`);
    expect(courseResponse.status).toBe(200);
    expect(courseResponse.data.id).toBe(course.id);
    expect(courseResponse.data.name).toBe('Introduction to TypeScript');
  });

  it('должен обрабатывать полный workflow: регистрация → создание курса → запись → оплата → доступ к урокам', async () => {
    // Step 1: Register new user
    const registerDto = AuthObjectMother.buildRegisterDto({
      email: 'student@example.com',
      password: 'SecurePassword123!'
    });
    const registerResponse = await client.post('/api/auth/register', registerDto);
    expect(registerResponse.status).toBe(201);
    expect(registerResponse.data).toHaveProperty('access_token');

    const accessToken = registerResponse.data.access_token;
    client.setAuthToken(accessToken);

    // Step 2: Create a course
    const courseData = {
      name: 'Full E2E Course',
      price: 150,
      date_start: new Date().toISOString(),
      date_finish: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const createCourseResponse = await client.post('/api/courses', courseData);
    expect(createCourseResponse.status).toBe(201);
    const courseId = createCourseResponse.data.id;

    // Step 3: View course details (public access)
    client.clearAuthToken();
    const viewCourseResponse = await client.get(`/api/courses/${courseId}`);
    expect(viewCourseResponse.status).toBe(200);
    expect(viewCourseResponse.data.name).toBe(courseData.name);

    // Step 4: Login and enroll
    const loginDto = AuthObjectMother.buildLoginDto({
      email: registerDto.email,
      password: registerDto.password,
    });
    const loginResponse = await client.post('/api/auth/login', loginDto);
    expect(loginResponse.status).toBe(200);
    client.setAuthToken(loginResponse.data.access_token);

    const enrollResponse = await client.post(`/api/courses/${courseId}/register`);
    expect(enrollResponse.status).toBe(201);

    // Step 5: Make payment
    const paymentResponse = await client.post(`/api/courses/${courseId}/pay`);
    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.data.success).toBe(true);

    // Step 6: Verify enrollment and payment
    const enrollmentsResponse = await client.get(`/api/courses/${courseId}/enrollments`);
    expect(enrollmentsResponse.status).toBe(200);
    expect(Array.isArray(enrollmentsResponse.data)).toBe(true);

    const paymentsResponse = await client.get(`/api/courses/${courseId}/payments`);
    expect(paymentsResponse.status).toBe(200);
    expect(Array.isArray(paymentsResponse.data)).toBe(true);
  });

  it('должен обрабатывать несколько пользователей, регистрирующихся на один курс', async () => {
    // User 1: Create course
    const user1Dto = AuthObjectMother.buildRegisterDto({ email: 'user1@test.com', password: 'SecurePassword123!' });
    const user1Response = await client.post('/api/auth/register', user1Dto);
    expect(user1Response.status).toBe(201);
    client.setAuthToken(user1Response.data.access_token);

    const course = await createCourseWithLessons();
    const courseId = course.id;

    // User 1: Enroll and pay
    const enroll1Response = await client.post(`/api/courses/${courseId}/register`);
    expect(enroll1Response.status).toBe(201);

    const pay1Response = await client.post(`/api/courses/${courseId}/pay`);
    expect(pay1Response.status).toBe(201);

    // User 2: Register, login, enroll and pay
    client.clearAuthToken();
    const user2Dto = AuthObjectMother.buildRegisterDto({ email: 'user2@test.com', password: 'SecurePassword123!' });
    const user2Response = await client.post('/api/auth/register', user2Dto);
    expect(user2Response.status).toBe(201);
    client.setAuthToken(user2Response.data.access_token);

    const enroll2Response = await client.post(`/api/courses/${courseId}/register`);
    expect(enroll2Response.status).toBe(201);

    const pay2Response = await client.post(`/api/courses/${courseId}/pay`);
    expect(pay2Response.status).toBe(201);

    // Verify both users are enrolled (creator can check enrollments)
    const enrollmentsResponse = await client.get(`/api/courses/${courseId}/enrollments`);
    expect(enrollmentsResponse.status).toBe(200);
    expect(enrollmentsResponse.data.length).toBeGreaterThanOrEqual(2);
  });

  it('должен запретить двойную оплату одного курса', async () => {
    // Register and create course
    await registerUserAndGetToken();
    const course = await createCourseWithLessons();
    const courseId = course.id;

    // Enroll
    const enrollResponse = await client.post(`/api/courses/${courseId}/register`);
    expect(enrollResponse.status).toBe(201);

    // First payment - should succeed
    const pay1Response = await client.post(`/api/courses/${courseId}/pay`);
    expect(pay1Response.status).toBe(201);

    // Second payment - should fail
    const pay2Response = await client.post(`/api/courses/${courseId}/pay`);
    expect(pay2Response.status).toBeGreaterThanOrEqual(400);
  });
});
