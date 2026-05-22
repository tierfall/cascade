export default function () {
  // Global test setup for cascade-api-e2e.
  // Task 16 will configure Testcontainers and set the API base URL here.
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? '3000';
  process.env.API_BASE_URL = `http://${host}:${port}`;
}
