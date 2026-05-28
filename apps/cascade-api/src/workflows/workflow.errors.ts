export class WorkflowNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Workflow '${id}' not found.`);
    this.name = 'WorkflowNotFoundError';
  }
}

export class WorkflowAlreadyExistsError extends Error {
  constructor(public readonly id: string) {
    super(`Workflow '${id}' already exists.`);
    this.name = 'WorkflowAlreadyExistsError';
  }
}
