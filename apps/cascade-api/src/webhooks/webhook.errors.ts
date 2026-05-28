export class WebhookNotFoundError extends Error {
  constructor(public readonly path: string) {
    super(`No workflow has a webhook trigger at path '${path}'.`);
    this.name = 'WebhookNotFoundError';
  }
}
