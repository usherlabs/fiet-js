export class FietError extends Error {
  errorCode?: string;

  constructor(message: string, errorCode?: string) {
    super(message);
    this.errorCode = errorCode;
  }
}
