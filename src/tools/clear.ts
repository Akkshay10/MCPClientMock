/**
 * MCP Tool: Clear
 * Clears expectations and/or recorded requests from MockServer
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

export const ClearInputSchema = z.object({
  httpRequest: RequestMatcherSchema.optional(),
});

export type ClearInput = z.infer<typeof ClearInputSchema>;

export const clearTool = {
  name: 'mockserver_clear',
  description: 'Clear expectations and recorded requests from MockServer. Optionally filter by request matcher.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      httpRequest: {
        type: 'object',
        description: 'Optional request matcher to clear specific expectations. If not provided, clears all.',
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
    },
    required: [],
  },
};

export async function handleClear(
  client: MockServerClient,
  input: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = ClearInputSchema.safeParse(input);
  
  if (!parsed.success) {
    throw new ToolError(
      'INVALID_PARAMETERS',
      `Invalid parameters: ${parsed.error.message}`,
      { errors: parsed.error.errors }
    );
  }

  const { httpRequest } = parsed.data;
  await client.clear(httpRequest);

  if (httpRequest) {
    const criteria = [];
    if (httpRequest.method) criteria.push(`Method: ${httpRequest.method}`);
    if (httpRequest.path) criteria.push(`Path: ${httpRequest.path}`);
    
    return {
      content: [
        {
          type: 'text',
          text: `Cleared expectations and recorded requests matching:\n${criteria.length > 0 ? criteria.map(c => `- ${c}`).join('\n') : '- All matching criteria provided'}`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: 'Cleared all expectations and recorded requests from MockServer.',
      },
    ],
  };
}
