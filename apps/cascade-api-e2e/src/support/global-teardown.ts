export default function () {
  // Put clean up logic here (e.g. stopping services, docker-compose, etc.).
  // Task 16 will wire up Testcontainers teardown here.
  console.log((globalThis as unknown as { __TEARDOWN_MESSAGE__: string }).__TEARDOWN_MESSAGE__);
}
