/**
 * MCP Tool: Reset
 * Performs a full reset of MockServer - clears all expectations and recorded requests
 */

import { z } from 'zod';
import { MockServerClient } from '../mockserver-client.js';

export const ResetInputSchema = z.object({});

export type ResetInput = z.infer<typeof ResetInputSchema>;

export const resetTool = {
  name: 'mockserver_reset',
  description: 'Perform a full reset of MockServer, clearing all expectations and recorded requests.',
  inputSchema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
};

export async function handleReset(
  client: MockServerClient,
  _input: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  await client.reset();

  return {
    content: [
      {
        type: 'text',
        text: 'MockServer has been fully reset. All expectations and recorded requests have been cleared.',
      },
    ],
  };
}
