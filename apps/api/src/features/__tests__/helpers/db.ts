import { db, queryClient } from "@patty/api/db/client";

export { db };

/**
 * Runs a function inside a database transaction that automatically rolls back.
 * This is the preferred way to ensure test isolation - any changes made
 * within the callback are automatically reverted after the test completes.
 *
 * @example
 * it('creates a user', async () => {
 *   await withTransaction(async () => {
 *     const user = await createTestUser();
 *     expect(user.id).toBeDefined();
 *   });
 *   // Database is now clean - changes rolled back
 * });
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const reserved = await queryClient.reserve();
  try {
    await reserved`BEGIN`;
    const result = await fn();
    await reserved`ROLLBACK`;
    return result;
  } catch (error) {
    await reserved`ROLLBACK`;
    throw error;
  } finally {
    reserved.release();
  }
}
