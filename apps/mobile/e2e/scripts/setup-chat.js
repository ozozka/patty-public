/* global MAESTRO_SECRET, E2E_API_URL */
// Creates a match between the registered test user and the partner account
// so the chat section always has a conversation to interact with.
const apiUrl =
  typeof E2E_API_URL !== 'undefined' ? E2E_API_URL : 'http://localhost:8080';
const maestroSecret =
  typeof MAESTRO_SECRET !== 'undefined' ? MAESTRO_SECRET : null;

if (!maestroSecret) {
  throw new Error(
    'MAESTRO_SECRET environment variable is required for E2E tests',
  );
}

const response = http.post(`${apiUrl}/api/v1/internal/e2e-match`, {
  headers: {
    'X-Maestro-Secret': maestroSecret,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userOneEmail: 'test-register@patty.app',
    userTwoEmail: 'test-partner@patty.app',
  }),
});

if (response.status !== 200) {
  throw new Error(
    `Chat setup failed with status ${response.status}: ${JSON.stringify(response.body)}`,
  );
}
