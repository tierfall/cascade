export class RunNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Run '${id}' not found.`);
    this.name = 'RunNotFoundError';
  }
}
