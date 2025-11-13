import { AsyncLocalStorage } from 'async_hooks';

/**
 * AsyncLocalStorage for managing schema context across async operations
 */
export const schemaContext = new AsyncLocalStorage<{ schema: string }>();

/**
 * Get the current schema from the context
 * Returns 'public' if no schema is set
 */
export function getCurrentSchema(): string {
  const store = schemaContext.getStore();
  return store?.schema || 'public';
}

/**
 * Set the current schema in the context
 */
export function setCurrentSchema(schema: string): void {
  const store = schemaContext.getStore();
  if (store) {
    store.schema = schema;
  }
}
