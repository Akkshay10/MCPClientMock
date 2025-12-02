#!/usr/bin/env node
/**
 * MCP Server Setup
 * Initializes the MCP server with stdio transport and registers all tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { MockServerClient } from './mockserver-client.js';
import { tools, getToolHandler } from './tools/index.js';

/**
 * Server metadata
 */
const SERVER_NAME = 'mockserver-mcp';
const SERVER_VERSION = '1.0.0';

/**
 * Create and configure the MCP server
 * @param client MockServer client instance
 * @returns Configured MCP server
 */
export function createServer(client: MockServerClient): Server {
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map((t) => ({
        name: t.definition.name,
        description: t.definition.description,
        inputSchema: t.definition.inputSchema,
      })),
    };
  });

  // Register call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const handler = getToolHandler(name);
    if (!handler) {
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
    }

    try {
      return await handler(client, args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error executing ${name}: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Start the MCP server with stdio transport
 * @param client MockServer client instance
 */
export async function startServer(client: MockServerClient): Promise<void> {
  const server = createServer(client);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
