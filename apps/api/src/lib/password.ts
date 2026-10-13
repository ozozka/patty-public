/**
 * Hashes a plaintext password using Argon2id via Bun's built-in password API.
 * Uses a weaker configuration in test environment to speed up execution.
 */
export async function hashPassword(password: string): Promise<string> {
  const isTest = process.env.NODE_ENV === "test";

  return Bun.password.hash(password, {
    algorithm: "argon2id",
    // Minimum memory (8KB) and time cost (1 iteration) for tests
    memoryCost: isTest ? 8 : 65536,
    timeCost: isTest ? 1 : 3,
  });
}

/**
 * Verifies a plaintext password against its stored Argon2id hash.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  return Bun.password.verify(password, storedHash);
}
