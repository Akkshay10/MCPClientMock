/**
 * MCP Tool: Verify Requests
 * Verifies that specific requests were made to MockServer
 */

import { z } from 'zod';
import { MockServerClient } from '../mockserver-client.js';
import { ToolError } from '../types/errors.js';

const BodyMatcherSchema = z.object({
  type: z.enum(['STRING', 'JSON', 'REGEX', 'XPATH', 'JSON_PATH']),
  value: z.string(),
  matchType: z.enum(['STRICT', 'ONLY_MATCHING_FIELDS']).optional(),
});

const RequestMatcherSchema = z.object({
  method: z.string().optional(),
  path: z.string().optional(),
  pathParameters: z.record(z.array(z.string())).optional(),
  queryStringParameters: z.record(z.array(z.string())).optional(),
  headers: z.record(z.array(z.string())).optional(),
  body: BodyMatcherSchema.optional(),
});

const TimesSchema = z.object({
  atLeast: z.number().optional(),
  atMost: z.number().optional(),
  exactly: z.number().optional(),
});

export const VerifyInputSchema = z.object({
  httpRequest: RequestMatcherSchema,
  times: TimesSchema.optional(),
});

export type VerifyInput = z.infer<typeof VerifyInputSchema>;

export const verifyTool = {
  name: 'mockserver_verify',
  description: 'Verify that requests matching criteria were received by MockServer. Returns verification result with match count.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      httpRequest: {
        type: 'object',
        description: 'Request matching criteria',
        properties: {
          method: { type: 'string', description: 'HTTP method to match' },
          path: { type: 'string', description: 'URL path to match' },
          pathParameters: { type: 'object', description: 'Path parameters to match' },
          queryStringParameters: { type: 'object', description: 'Query string parameters to match' },
          headers: { type: 'object', description: 'Headers to match' },
          body: {
            type: 'object',
            description: 'Body matcher configuration',
            properties: {
              type: { type: 'string', enum: ['STRING', 'JSON', 'REGEX', 'XPATH', 'JSON_PATH'] },
              value: { type: 'string' },
              matchType: { type: 'string', enum: ['STRICT', 'ONLY_MATCHING_FIELDS'] },
            },
          },
        },
      },
      times: {
        type: 'object',
        description: 'Expected number of matching requests',
        properties: {
          atLeast: { type: 'number', description: 'Minimum number of expected requests' },
          atMost: { type: 'number', description: 'Maximum number of expected requests' },
          exactly: { type: 'number', description: 'Exact number of expected requests' },
        },
      },
    },
    required: ['httpRequest'],
  },
};

export async function handleVerify(
  client: MockServerClient,
  input: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = VerifyInputSchema.safeParse(input);
  
  if (!parsed.success) {
    throw new ToolError(
      'INVALID_PARAMETERS',
      `Invalid parameters: ${parsed.error.message}`,
      { errors: parsed.error.errors }
    );
  }

  const { httpRequest, times } = parsed.data;
  const result = await client.verify(httpRequest, times);

  const timesDescription = times
    ? times.exactly !== undefined
      ? `exactly ${times.exactly}`
      : times.atLeast !== undefined && times.atMost !== undefined
        ? `between ${times.atLeast} and ${times.atMost}`
        : times.atLeast !== undefined
          ? `at least ${times.atLeast}`
          : times.atMost !== undefined
            ? `at most ${times.atMost}`
            : 'any number of'
    : 'at least 1';

  if (result.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Verification PASSED.\n\nExpected: ${timesDescription} request(s)\nMatched: ${result.matchedCount} request(s)\n\nCriteria:\n- Method: ${httpRequest.method ?? 'ANY'}\n- Path: ${httpRequest.path ?? '/*'}`,
        },
      ],
    };
  } else {
    return {
      content: [
        {
          type: 'text',
          text: `Verification FAILED.\n\nExpected: ${timesDescription} request(s)\nMatched: ${result.matchedCount} request(s)\n\nCriteria:\n- Method: ${httpRequest.method ?? 'ANY'}\n- Path: ${httpRequest.path ?? '/*'}${result.message ? `\n\nDetails: ${result.message}` : ''}`,
        },
      ],
    };
  }
}
