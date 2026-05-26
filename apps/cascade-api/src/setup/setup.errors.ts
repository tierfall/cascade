export class AlreadyInitializedError extends Error {
  constructor() {
    super('Cascade is already initialized.');
    this.name = 'AlreadyInitializedError';
  }
}

export class ConcurrentSetupError extends Error {
  constructor() {
    super('Another setup request is in flight.');
    this.name = 'ConcurrentSetupError';
  }
}
