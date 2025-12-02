/**
 * MCP Tools Index
 * Exports all tool definitions and handlers for registration
 */

import { MockServerClient } from '../mockserver-client.js';
import { createExpectationTool, handleCreateExpectation } from './create-expectation.js';
import { verifyTool, handleVerify } from './verify.js';
import { clearTool, handleClear } from './clear.js';
import { resetTool, handleReset } from './reset.js';
import { retrieveRequestsTool, handleRetrieveRequests } from './retrieve-requests.js';
import { statusTool, handleStatus } from './status.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export type ToolHandler = (
  client: MockServerClient,
  input: unknown
) => Promise<{ content: Array<{ type: 'text'; text: string }> }>;

export interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}

/**
 * All available MCP tools for MockServer
 */
export const tools: RegisteredTool[] = [
  { definition: createExpectationTool, handler: handleCreateExpectation },
  { definition: verifyTool, handler: handleVerify },
  { definition: clearTool, handler: handleClear },
  { definition: resetTool, handler: handleReset },
  { definition: retrieveRequestsTool, handler: handleRetrieveRequests },
  { definition: statusTool, handler: handleStatus },
];

/**
 * Get tool handler by name
 */
export function getToolHandler(name: string): ToolHandler | undefined {
  const tool = tools.find(t => t.definition.name === name);
  return tool?.handler;
}

/**
 * Get all tool definitions for MCP registration
 */
export function getToolDefinitions(): ToolDefinition[] {
  return tools.map(t => t.definition);
}

// Re-export individual tools and handlers
export { createExpectationTool, handleCreateExpectation } from './create-expectation.js';
export { verifyTool, handleVerify } from './verify.js';
export { clearTool, handleClear } from './clear.js';
export { resetTool, handleReset } from './reset.js';
export { retrieveRequestsTool, handleRetrieveRequests } from './retrieve-requests.js';
export { statusTool, handleStatus } from './status.js';
