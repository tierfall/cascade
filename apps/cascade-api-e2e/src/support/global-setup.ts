export default function () {
  // Start services that the app needs to run (e.g. database, docker-compose, etc.).
  // Task 16 will wire up Testcontainers here.
  console.log('\nSetting up...\n');

  // Hint: Use `globalThis` to pass variables to global teardown.
  (globalThis as unknown as { __TEARDOWN_MESSAGE__: string }).__TEARDOWN_MESSAGE__ =
    '\nTearing down...\n';
}
