export enum RegistryErrorCode {
  INIT_FAILED = 'INIT_FAILED',
  INVALID_MANIFEST = 'INVALID_MANIFEST',
  CHECKSUM_MISMATCH = 'CHECKSUM_MISMATCH',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_STATE = 'INVALID_STATE',
  CAPABILITY_DENIED = 'CAPABILITY_DENIED',
  DEPENDENCY_CYCLE = 'DEPENDENCY_CYCLE',
  VERSION_CONFLICT = 'VERSION_CONFLICT'
}

export class RegistryError extends Error {
  readonly code: RegistryErrorCode;
  readonly details?: any;

  constructor(code: RegistryErrorCode, message: string, details?: any) {
    super(message);
    this.name = 'RegistryError';
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details
    };
  }
}
