/**
 * MCP Tool: Status
 * Gets MockServer connection status and configuration
 */

import { z } from 'zod';
import { MockServerClient } from '../mockserver-client.js';

export const StatusInputSchema = z.object({});

export type StatusInput = z.infer<typeof StatusInputSchema>;

export const statusTool = {
  name: 'mockserver_status',
  description: 'Get MockServer connection status and configuration. Returns host, port, and reachability.',
  inputSchema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
};

export async function handleStatus(
  client: MockServerClient,
  _input: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const status = await client.getStatus();

  const statusText = status.reachable ? '✓ Connected' : '✗ Unreachable';
  const versionInfo = status.version ? `\nVersion: ${status.version}` : '';

  return {
    content: [
      {
        type: 'text',
        text: `MockServer Status: ${statusText}\n\nConfiguration:\n- Host: ${status.host}\n- Port: ${status.port}${versionInfo}`,
      },
    ],
  };
}
