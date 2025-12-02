import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockServerClient } from '../../src/mockserver-client.js';
import { ToolError, ErrorCodes } from '../../src/types/errors.js';

describe('MockServerClient', () => {
  let client: MockServerClient;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    client = new MockServerClient({ host: 'localhost', port: 1080 });
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createExpectation', () => {
    it('should create expectation successfully', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('', { status: 201 }));

      await expect(client.createExpectation({
        httpRequest: { method: 'GET', path: '/test' },
        httpResponse: { statusCode: 200, body: 'OK' },
      })).resolves.toBeUndefined();

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:1080/mockserver/expectation',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should create expectation with query string parameters', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('', { status: 201 }));

      await client.createExpectation({
        httpRequest: {
          method: 'GET',
          path: '/api/users',
          queryStringParameters: {
            page: ['1'],
            limit: ['10'],
            sort: ['name', 'asc'],
          },
        },
        httpResponse: { statusCode: 200, body: { users: [] } },
      });

      const callBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
      expect(callBody.httpRequest.queryStringParameters).toEqual({
        page: ['1'],
        limit: ['10'],
        sort: ['name', 'asc'],
      });
    });

    it('should throw error when MockServer returns error', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('Invalid expectation', { status: 400 }));

      await expect(client.createExpectation({
        httpRequest: { method: 'GET', path: '/test' },
      })).rejects.toThrow(ToolError);
    });
  });

  describe('verify', () => {
    it('should return success when verification passes', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('', { status: 202 }));

      const result = await client.verify({ method: 'GET', path: '/test' }, { atLeast: 1 });

      expect(result.success).toBe(true);
    });

    it('should return failure when verification fails', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('Request not matched', { status: 406 }));

      const result = await client.verify({ method: 'GET', path: '/test' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Verification failed');
    });
  });

  describe('clear', () => {
    it('should clear all expectations when no matcher provided', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('', { status: 200 }));

      await expect(client.clear()).resolves.toBeUndefined();

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:1080/mockserver/clear',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should clear specific expectations when matcher provided', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('', { status: 200 }));

      await client.clear({ path: '/test' });

      const callBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
      expect(callBody.httpRequest).toEqual({ path: '/test' });
    });
  });

  describe('reset', () => {
    it('should reset MockServer', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('', { status: 200 }));

      await expect(client.reset()).resolves.toBeUndefined();

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:1080/mockserver/reset',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('retrieveRecordedRequests', () => {
    it('should retrieve recorded requests', async () => {
      const mockRequests = [
        { method: 'GET', path: '/test1' },
        { method: 'POST', path: '/test2' },
      ];
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(mockRequests), { status: 200 }));

      const result = await client.retrieveRecordedRequests();

      expect(result).toEqual(mockRequests);
    });

    it('should return empty array when no requests recorded', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('[]', { status: 200 }));

      const result = await client.retrieveRecordedRequests();

      expect(result).toEqual([]);
    });
  });

  describe('getStatus', () => {
    it('should return reachable status when server responds', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ version: '5.15.0' }), { status: 200 }));

      const status = await client.getStatus();

      expect(status.reachable).toBe(true);
      expect(status.host).toBe('localhost');
      expect(status.port).toBe(1080);
      expect(status.version).toBe('5.15.0');
    });

    it('should return unreachable status when connection fails', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('fetch failed: ECONNREFUSED'));

      const status = await client.getStatus();

      expect(status.reachable).toBe(false);
      expect(status.host).toBe('localhost');
      expect(status.port).toBe(1080);
    });
  });

  describe('error handling', () => {
    it('should throw CONNECTION_FAILED for connection errors', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('fetch failed: ECONNREFUSED'));

      await expect(client.createExpectation({
        httpRequest: { path: '/test' },
      })).rejects.toMatchObject({
        code: ErrorCodes.CONNECTION_FAILED,
      });
    });

    it('should throw CONNECTION_TIMEOUT for timeout errors', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      fetchSpy.mockRejectedValueOnce(abortError);

      await expect(client.createExpectation({
        httpRequest: { path: '/test' },
      })).rejects.toMatchObject({
        code: ErrorCodes.CONNECTION_TIMEOUT,
      });
    });
  });
});
