export class ControlledError extends Error {
  public readonly safeMessage: string;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(safeMessage: string, opts?: { code?: string; details?: unknown }) {
    super(safeMessage);
    this.name = this.constructor.name;
    this.safeMessage = safeMessage;
    this.code = opts?.code;
    this.details = opts?.details;
    // Do not include the details in the error message to avoid leaking
  }
}

export class ValidationError extends ControlledError {
  public readonly errors: string[];
  constructor(errors: string[]) {
    super("Invalid input.");
    this.errors = errors;
  }
}

export class NotFoundError extends ControlledError {
  constructor(message = "Resource not found") {
    super(message, { code: "not_found" });
  }
}

export class DatabaseError extends ControlledError {
  constructor(message = "A database error occurred") {
    super(message, { code: "db_error" });
  }
}

export class ServiceError extends ControlledError {
  constructor(message = "An unexpected error occurred") {
    super(message, { code: "service_error" });
  }
}

export class AuthError extends ControlledError {
  constructor(message = "Unauthorized") {
    super(message, { code: "unauthorized" });
  }
}

/**
 * Map any unknown error to a safe ServiceError while preserving original details server-side.
 */
export function mapToSafeError(err: unknown, fallbackMessage = "An unexpected error occurred") {
  // Log full error server-side for diagnostics
  // eslint-disable-next-line no-console
  console.error(err);

  if (err instanceof ControlledError) return err;
  return new ServiceError(fallbackMessage);
}
