export class WorkflowValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: readonly string[] = [],
  ) {
    super(message);
    this.name = 'WorkflowValidationError';
  }
}

export class CycleDetectedError extends Error {
  constructor(public readonly cycle: readonly string[]) {
    super(`cycle detected: ${cycle.join(' -> ')}`);
    this.name = 'CycleDetectedError';
  }
}
