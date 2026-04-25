export class AppError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InvalidInputError extends AppError {
  constructor(message) { super(message, 'INVALID_INPUT', 400); }
}

export class AuthError extends AppError {
  constructor(message = 'Invalid credentials') { super(message, 'AUTH_FAILED', 401); }
}

export class SessionExpiredError extends AppError {
  constructor() { super('Session expired. Please login again.', 'SESSION_EXPIRED', 401); }
}

export class InsufficientFundsError extends AppError {
  constructor() { super('Insufficient funds', 'INSUFFICIENT_FUNDS', 400); }
}

export class NotFoundError extends AppError {
  constructor(what) { super(`${what} not found`, 'NOT_FOUND', 404); }
}

export class OutOfScopeError extends AppError {
  constructor() {
    super(
      "I can only help with: Check Balance, Fund Transfer, Pay Bill, or Last 10 Transactions.",
      'OUT_OF_SCOPE',
      400
    );
  }
}
