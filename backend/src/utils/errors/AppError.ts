export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly data?: any;

  constructor(
    message: string,
    statusCode: number,
    data?: any,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.data = data;

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: any[]) {
    super(message, 400, { errors });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class FaceRecognitionError extends AppError {
  constructor(message = 'Face recognition failed') {
    super(message, 400);
    this.name = 'FaceRecognitionError';
  }
}