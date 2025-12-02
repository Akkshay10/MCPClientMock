/**
 * MockServer TypeScript type definitions
 * Based on MockServer REST API specifications
 */

/**
 * Body matcher for request matching
 */
export interface BodyMatcher {
  type: 'STRING' | 'JSON' | 'REGEX' | 'XPATH' | 'JSON_PATH';
  value: string;
  matchType?: 'STRICT' | 'ONLY_MATCHING_FIELDS';
}

/**
 * Request matcher criteria for matching incoming requests
 */
export interface RequestMatcher {
  method?: string;
  path?: string;
  pathParameters?: Record<string, string[]>;
  queryStringParameters?: Record<string, string[]>;
  headers?: Record<string, string[]>;
  body?: BodyMatcher;
}

/**
 * Response delay configuration
 */
export interface ResponseDelay {
  timeUnit: 'MILLISECONDS' | 'SECONDS';
  value: number;
}

/**
 * HTTP response configuration for expectations
 */
export interface HttpResponse {
  statusCode?: number;
  headers?: Record<string, string[]>;
  body?: string | object;
  delay?: ResponseDelay;
}


/**
 * Times configuration for expectation matching limits
 */
export interface ExpectationTimes {
  remainingTimes: number;
  unlimited: boolean;
}

/**
 * Time to live configuration for expectations
 */
export interface TimeToLive {
  timeUnit: 'MILLISECONDS' | 'SECONDS' | 'MINUTES';
  timeToLive: number;
}

/**
 * Expectation combining request matcher and response configuration
 */
export interface Expectation {
  id?: string;
  httpRequest: RequestMatcher;
  httpResponse?: HttpResponse;
  times?: ExpectationTimes;
  timeToLive?: TimeToLive;
}

/**
 * Times specification for verification
 */
export interface Times {
  atLeast?: number;
  atMost?: number;
  exactly?: number;
}

/**
 * Result of a verification operation
 */
export interface VerificationResult {
  success: boolean;
  matchedCount: number;
  message?: string;
}

/**
 * Recorded request from MockServer
 */
export interface RecordedRequest {
  method?: string;
  path?: string;
  pathParameters?: Record<string, string[]>;
  queryStringParameters?: Record<string, string[]>;
  headers?: Record<string, string[]>;
  body?: string | object;
  timestamp?: string;
}

/**
 * Server status and connectivity information
 */
export interface ServerStatus {
  host: string;
  port: number;
  reachable: boolean;
  version?: string;
}
