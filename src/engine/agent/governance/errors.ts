export class GovernanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GovernanceError';
    Object.setPrototypeOf(this, GovernanceError.prototype);
  }
}
