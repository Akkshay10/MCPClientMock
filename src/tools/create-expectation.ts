/**
 * MCP Tool: Create Expectation
 * Creates a mock expectation on MockServer
 */

import { z } from 'zod';
import { MockServerClient } from '../mockserver-client.js';
import { ToolError } from '../types/errors.js';

// Zod schemas for request matcher and response parameters
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

const ResponseDelaySchema = z.object({
  timeUnit: z.enum(['MILLISECONDS', 'SECONDS']),
  value: z.number(),
});

const HttpResponseSchema = z.object({
  statusCode: z.number().optional(),
  headers: z.record(z.array(z.string())).optional(),
  body: z.union([z.string(), z.record(z.unknown())]).optional(),
  delay: ResponseDelaySchema.optional(),
});

const ExpectationTimesSchema = z.object({
  remainingTimes: z.number(),
  unlimited: z.boolean(),
});

const TimeToLiveSchema = z.object({
  timeUnit: z.enum(['MILLISECONDS', 'SECONDS', 'MINUTES']),
  timeToLive: z.number(),
});

export const CreateExpectationInputSchema = z.object({
  httpRequest: RequestMatcherSchema,
  httpResponse: HttpResponseSchema.optional(),
  times: ExpectationTimesSchema.optional(),
  timeToLive: TimeToLiveSchema.optional(),
  id: z.string().optional(),
});

export type CreateExpectationInput = z.infer<typeof CreateExpectationInputSchema>;

export const createExpectationTool = {
  name: 'mockserver_create_expectation',
  description: 'Create a mock HTTP expectation on MockServer. Define request matching criteria and the response to return.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      httpRequest: {
        type: 'object',
        description: 'Request matching criteria (method, path, headers, body, etc.)',
        properties: {
          method: { type: 'string', description: 'HTTP method to match (GET, POST, PUT, DELETE, etc.)' },
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
      httpResponse: {
        type: 'object',
        description: 'Response configuration',
        properties: {
          statusCode: { type: 'number', description: 'HTTP status code to return' },
          headers: { type: 'object', description: 'Response headers' },
          body: { description: 'Response body (string or object)' },
          delay: {
            type: 'object',
            description: 'Response delay configuration',
            properties: {
              timeUnit: { type: 'string', enum: ['MILLISECONDS', 'SECONDS'] },
              value: { type: 'number' },
            },
          },
        },
      },
      times: {
        type: 'object',
        description: 'How many times this expectation should be matched',
        properties: {
          remainingTimes: { type: 'number' },
          unlimited: { type: 'boolean' },
        },
      },
      timeToLive: {
        type: 'object',
        description: 'How long this expectation should remain active',
        properties: {
          timeUnit: { type: 'string', enum: ['MILLISECONDS', 'SECONDS', 'MINUTES'] },
          timeToLive: { type: 'number' },
        },
      },
      id: { type: 'string', description: 'Optional expectation identifier' },
    },
    required: ['httpRequest'],
  },
};

export async function handleCreateExpectation(
  client: MockServerClient,
  input: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = CreateExpectationInputSchema.safeParse(input);
  
  if (!parsed.success) {
    throw new ToolError(
      'INVALID_PARAMETERS',
      `Invalid parameters: ${parsed.error.message}`,
      { errors: parsed.error.errors }
    );
  }

  const expectation = parsed.data;
  
  await client.createExpectation(expectation);

  const summary = {
    id: expectation.id,
    method: expectation.httpRequest.method ?? 'ANY',
    path: expectation.httpRequest.path ?? '/*',
    statusCode: expectation.httpResponse?.statusCode ?? 200,
  };

  return {
    content: [
      {
        type: 'text',
        text: `Expectation created successfully.\n\nDetails:\n- Method: ${summary.method}\n- Path: ${summary.path}\n- Response Status: ${summary.statusCode}${summary.id ? `\n- ID: ${summary.id}` : ''}`,
      },
    ],
  };
}
