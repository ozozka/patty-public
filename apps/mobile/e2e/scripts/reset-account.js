/* global MAESTRO_SECRET, E2E_API_URL */
// Maestro uses GraalVM JS, not Node.js - env vars passed via -e are globals
const apiUrl =
  typeof E2E_API_URL !== 'undefined' ? E2E_API_URL : 'http://localhost:8080';
const maestroSecret =
  typeof MAESTRO_SECRET !== 'undefined' ? MAESTRO_SECRET : null;

if (!maestroSecret) {
  throw new Error(
    'MAESTRO_SECRET environment variable is required for E2E tests',
  );
}

try {
  const response = http.post(`${apiUrl}/api/v1/internal/e2e-reset`, {
    headers: {
      'X-Maestro-Secret': maestroSecret,
    },
    body: JSON.stringify({}),
  });

  if (response.status !== 200) {
    throw new Error(
      `Reset failed with status ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }

  console.log('E2E reset completed successfully');
} catch (error) {
  throw new Error(`E2E reset failed: ${error.message}`);
}
