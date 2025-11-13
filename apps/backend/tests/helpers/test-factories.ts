import { ApiTestClient } from './api-client';

/**
 * Test data factories for creating common test objects
 */

export interface CreateUserOptions {
  email?: string;
  password?: string;
  role?: 'user' | 'admin';
  firstName?: string;
  lastName?: string;
  bio?: string;
}

export interface CreateCourseOptions {
  name?: string;
  price?: number;
  dateStart?: string;
  dateFinish?: string;
}

/**
 * Factory for creating test users
 */
export class UserFactory {
  constructor(private client: ApiTestClient) {}

  async create(options: CreateUserOptions = {}) {
    const userData = {
      email: options.email || `test_${Date.now()}@example.com`,
      password: options.password || 'Test123456',
      first_name: options.firstName || 'Test',
      last_name: options.lastName || 'User',
    };

    const response = await this.client.post('/api/auth/register', userData);

    if (response.status !== 201) {
      throw new Error(`Failed to create user: ${response.status} ${JSON.stringify(response.data)}`);
    }

    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/api/auth/login', { email, password });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to login: ${response.status} ${JSON.stringify(response.data)}`);
    }

    return response.data;
  }
}

/**
 * Factory for creating test courses
 */
export class CourseFactory {
  constructor(private client: ApiTestClient) {}

  async create(options: CreateCourseOptions = {}) {
    const now = new Date();
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const courseData = {
      name: options.name || `Test Course ${Date.now()}`,
      price: options.price !== undefined ? options.price : 100,
      date_start: options.dateStart || now.toISOString(),
      date_finish: options.dateFinish || oneMonthLater.toISOString(),
    };

    const response = await this.client.post('/api/courses', courseData);

    if (response.status !== 201) {
      throw new Error(`Failed to create course: ${response.status} ${JSON.stringify(response.data)}`);
    }

    return response.data;
  }
}

/**
 * Factory manager that provides all factories
 */
export class TestFactories {
  public users: UserFactory;
  public courses: CourseFactory;

  constructor(client: ApiTestClient) {
    this.users = new UserFactory(client);
    this.courses = new CourseFactory(client);
  }
}

/**
 * Create test factories instance
 */
export function createTestFactories(client: ApiTestClient): TestFactories {
  return new TestFactories(client);
}
