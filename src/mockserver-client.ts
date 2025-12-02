/**
 * MockServer HTTP Client
 * Encapsulates all HTTP communication with MockServer REST API
 */

import {
  Expectation,
  RequestMatcher,
  Times,
  VerificationResult,
  RecordedRequest,
  ServerStatus,
} from './types/mockserver.js';
import { ToolError, ErrorCodes } from './types/errors.js';

/**
 * Configuration for MockServer client
 */
export interface MockServerClientConfig {
  host: string;
  port: number;
  timeout?: number;
}

/**
 * Client for interacting with MockServer REST API
 */
export class MockServerClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: MockServerClientConfig) {
    this.baseUrl = `http://${config.host}:${config.port}`;
    this.timeout = config.timeout ?? 5000;
  }

  /**
   * Create an expectation on MockServer
   * @param expectation The expectation to create
   */
  async createExpectation(expectation: Expectation): Promise<void> {
    await this.request('/mockserver/expectation', 'PUT', expectation);
  }

  /**
   * Verify that requests matching criteria were received
   * @param request Request matcher criteria
   * @param times Expected number of times
   */
  async verify(request: RequestMatcher, times?: Times): Promise<VerificationResult> {
    const body: Record<string, unknown> = { httpRequest: request };
    
    if (times) {
      body.times = times;
    }

    try {
      await this.request('/mockserver/verify', 'PUT', body);
      return {
        success: true,
        matchedCount: times?.exactly ?? times?.atLeast ?? 1,
      };
    } catch (error) {
      if (error instanceof ToolError && error.code === ErrorCodes.VERIFICATION_FAILED) {
        return {
          success: false,
          matchedCount: 0,
          message: error.message,
        };
      }
      throw error;
    }
  }

  /**
   * Clear expectations and/or recorded requests
   * @param request Optional request matcher to clear specific expectations
   */
  async clear(request?: RequestMatcher): Promise<void> {
    const body = request ? { httpRequest: request } : {};
    await this.request('/mockserver/clear', 'PUT', body);
  }

  /**
   * Reset MockServer - clears all expectations and recorded requests
   */
  async reset(): Promise<void> {
    await this.request('/mockserver/reset', 'PUT', {});
  }

  /**
   * Retrieve recorded requests from MockServer
   * @param request Optional request matcher to filter results
   */
  async retrieveRecordedRequests(request?: RequestMatcher): Promise<RecordedRequest[]> {
    const body = request ? { httpRequest: request } : {};
    const response = await this.request('/mockserver/retrieve', 'PUT', body, {
      type: 'REQUESTS',
    });
    
    if (Array.isArray(response)) {
      return response as RecordedRequest[];
    }
    return [];
  }

  /**
   * Get MockServer status and connectivity
   */
  async getStatus(): Promise<ServerStatus> {
    const [host, portStr] = this.baseUrl.replace('http://', '').split(':');
    const port = parseInt(portStr, 10);

    try {
      const response = await this.request('/mockserver/status', 'PUT', {});
      return {
        host,
        port,
        reachable: true,
        version: (response as { version?: string })?.version,
      };
    } catch (error) {
      if (error instanceof ToolError && 
          (error.code === ErrorCodes.CONNECTION_FAILED || 
           error.code === ErrorCodes.CONNECTION_TIMEOUT)) {
        return {
          host,
          port,
          reachable: false,
        };
      }
      throw error;
    }
  }

  /**
   * Make HTTP request to MockServer
   */
  private async request(
    path: string,
    method: string,
    body: unknown,
    queryParams?: Record<string, string>
  ): Promise<unknown> {
    let url = `${this.baseUrl}${path}`;
    
    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        
        if (response.status === 406) {
          throw new ToolError(
            ErrorCodes.VERIFICATION_FAILED,
            `Verification failed: ${errorText}`,
            { statusCode: response.status }
          );
        }
        
        throw new ToolError(
          ErrorCodes.MOCKSERVER_ERROR,
          `MockServer error: ${errorText}`,
          { statusCode: response.status }
        );
      }

      const text = await response.text();
      if (!text) {
        return {};
      }
      
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ToolError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ToolError(
            ErrorCodes.CONNECTION_TIMEOUT,
            `Connection to MockServer timed out after ${this.timeout}ms`,
            { host: this.baseUrl }
          );
        }
        
        if (error.message.includes('ECONNREFUSED') || 
            error.message.includes('fetch failed') ||
            error.message.includes('network')) {
          throw new ToolError(
            ErrorCodes.CONNECTION_FAILED,
            `Cannot connect to MockServer at ${this.baseUrl}`,
            { originalError: error.message }
          );
        }
      }

      throw new ToolError(
        ErrorCodes.UNKNOWN_ERROR,
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
