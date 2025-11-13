import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration for API test client
 */
export interface ApiClientConfig {
  baseURL?: string;
  schemaName?: string;
  headers?: Record<string, string>;
}

/**
 * HTTP client for integration and e2e tests
 * Automatically handles schema isolation via X-Test-Schema header
 */
export class ApiTestClient {
  private client: AxiosInstance;
  private schemaName: string;
  private baseURL: string;

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || process.env.TEST_API_URL || 'http://localhost:3000';
    this.schemaName = config.schemaName || generateSchemaName();

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Schema': this.schemaName,
        ...config.headers,
      },
      validateStatus: () => true, // Don't throw on any status code
    });
  }

  /**
   * Get the schema name used by this client
   */
  getSchemaName(): string {
    return this.schemaName;
  }

  /**
   * Get the base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Creates a new isolated test schema
   */
  async createSchema(): Promise<void> {
    const response = await this.client.post('/api/test/create-schema');

    if (response.status !== 201) {
      throw new Error(
        `Failed to create schema ${this.schemaName}: ${response.status} ${response.data}`,
      );
    }
  }

  /**
   * Drops the test schema
   */
  async dropSchema(): Promise<void> {
    try {
      const response = await this.client.post('/api/test/drop-schema');

      if (response.status !== 200) {
        console.warn(
          `Warning: Failed to drop schema ${this.schemaName}: ${response.status}`,
        );
      }
    } catch (error) {
      console.warn(`Warning: Error dropping schema ${this.schemaName}:`, error);
    }
  }

  /**
   * Resets all tables in the schema (TRUNCATE)
   */
  async resetSchema(): Promise<void> {
    const response = await this.client.post('/api/test/reset-schema');

    if (response.status !== 200) {
      throw new Error(
        `Failed to reset schema ${this.schemaName}: ${response.status} ${response.data}`,
      );
    }
  }

  /**
   * Make a GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  /**
   * Set authorization header (JWT token)
   */
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authorization header
   */
  clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Get the underlying axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

/**
 * Generates a unique schema name for test isolation
 */
export function generateSchemaName(): string {
  const uuid = uuidv4().replace(/-/g, '');
  return `test_schema_${uuid}`;
}

/**
 * Creates a test client with a unique schema
 */
export async function createTestClient(config?: ApiClientConfig): Promise<ApiTestClient> {
  const client = new ApiTestClient(config);
  await client.createSchema();
  return client;
}

/**
 * Helper function for test setup
 * Creates client and schema in one call
 */
export async function setupTestClient(config?: ApiClientConfig): Promise<ApiTestClient> {
  return createTestClient(config);
}

/**
 * Helper function for test teardown
 * Drops the schema and cleans up
 */
export async function teardownTestClient(client: ApiTestClient): Promise<void> {
  await client.dropSchema();
}
