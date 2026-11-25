export class ResourceNotFoundError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
    public readonly resourceId: string,
  ) {
    super(message);
    this.name = 'ResourceNotFoundError';
  }
}
