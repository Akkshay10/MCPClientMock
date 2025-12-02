#!/usr/bin/env node
/**
 * MockServer MCP CLI Entry Point
 * Reads configuration from environment and starts the MCP server
 */

import { MockServerClient } from './mockserver-client.js';
import { startServer } from './server.js';

/**
 * Default configuration values
 */
const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 1080;

/**
 * Read configuration from environment variables
 */
function getConfig(): { host: string; port: number } {
  const host = process.env.MOCKSERVER_HOST || DEFAULT_HOST;
  const portStr = process.env.MOCKSERVER_PORT;
  const port = portStr ? parseInt(portStr, 10) : DEFAULT_PORT;

  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(`Invalid MOCKSERVER_PORT: ${portStr}. Using default: ${DEFAULT_PORT}`);
    return { host, port: DEFAULT_PORT };
  }

  return { host, port };
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const config = getConfig();
  const client = new MockServerClient(config);
  
  await startServer(client);
}

main().catch((error) => {
  console.error('Failed to start MockServer MCP server:', error);
  process.exit(1);
});
