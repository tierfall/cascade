export class CredentialNotFoundError extends Error {
  constructor(public readonly credentialName: string) {
    super(`Credential '${credentialName}' not found.`);
    this.name = 'CredentialNotFoundError';
  }
}

export class CredentialAlreadyExistsError extends Error {
  constructor(public readonly credentialName: string) {
    super(`Credential '${credentialName}' already exists.`);
    this.name = 'CredentialAlreadyExistsError';
  }
}
