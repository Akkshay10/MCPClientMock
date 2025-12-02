/**
 * MCP Tool: Retrieve Requests
 * Retrieves recorded requests from MockServer
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

export const RetrieveRequestsInputSchema = z.object({
  httpRequest: RequestMatcherSchema.optional(),
});

export type RetrieveRequestsInput = z.infer<typeof RetrieveRequestsInputSchema>;

export const retrieveRequestsTool = {
  name: 'mockserver_retrieve_requests',
  description: 'Retrieve recorded requests from MockServer. Optionally filter by request matcher.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      httpRequest: {
        type: 'object',
        description: 'Optional request matcher to filter recorded requests',
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

export async function handleRetrieveRequests(
  client: MockServerClient,
  input: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = RetrieveRequestsInputSchema.safeParse(input);
  
  if (!parsed.success) {
    throw new ToolError(
      'INVALID_PARAMETERS',
      `Invalid parameters: ${parsed.error.message}`,
      { errors: parsed.error.errors }
    );
  }

  const { httpRequest } = parsed.data;
  const requests = await client.retrieveRecordedRequests(httpRequest);

  if (requests.length === 0) {
    const filterInfo = httpRequest 
      ? ` matching criteria (${httpRequest.method ?? 'ANY'} ${httpRequest.path ?? '/*'})`
      : '';
    return {
      content: [
        {
          type: 'text',
          text: `No recorded requests found${filterInfo}.`,
        },
      ],
    };
  }

  const requestSummaries = requests.map((req, index) => {
    const parts = [
      `${index + 1}. ${req.method ?? 'UNKNOWN'} ${req.path ?? '/'}`,
    ];
    if (req.timestamp) parts.push(`   Timestamp: ${req.timestamp}`);
    if (req.queryStringParameters) {
      const params = Object.entries(req.queryStringParameters)
        .map(([k, v]) => `${k}=${v.join(',')}`)
        .join('&');
      if (params) parts.push(`   Query: ${params}`);
    }
    return parts.join('\n');
  });

  return {
    content: [
      {
        type: 'text',
        text: `Retrieved ${requests.length} recorded request(s):\n\n${requestSummaries.join('\n\n')}`,
      },
    ],
  };
}
