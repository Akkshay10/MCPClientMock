/**
 * Error types for MockServer MCP client
 */

/**
 * Error code constants for categorizing errors
 */
export const ErrorCodes = {
  // Connection errors
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  
  // Validation errors
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Server errors
  MOCKSERVER_ERROR: 'MOCKSERVER_ERROR',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  EXPECTATION_NOT_FOUND: 'EXPECTATION_NOT_FOUND',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Custom error class for tool operations
 */
export class ToolError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ToolError);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}
