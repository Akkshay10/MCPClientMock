# mockserver-mcp

An MCP (Model Context Protocol) server for interacting with [James Bloom's MockServer](https://www.mock-server.com/). This enables AI assistants to create mock HTTP expectations, verify requests, clear state, and manage MockServer instances programmatically.

## Prerequisites

You need a running MockServer instance:

```bash
# Using Docker (easiest)
docker run -d -p 1080:1080 mockserver/mockserver
```

## Installation

### Using npx (recommended)

```bash
npx mockserver-mcp
```

### Global installation

```bash
npm install -g mockserver-mcp
mockserver-mcp
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MOCKSERVER_HOST` | MockServer hostname | `localhost` |
| `MOCKSERVER_PORT` | MockServer port | `1080` |

### MCP Client Configuration

Add to your MCP client configuration file (e.g., Claude Desktop, Kiro, Cursor):

```json
{
  "mcpServers": {
    "mockserver": {
      "command": "npx",
      "args": ["-y", "mockserver-mcp"],
      "env": {
        "MOCKSERVER_HOST": "localhost",
        "MOCKSERVER_PORT": "1080"
      }
    }
  }
}
```

For shared team MockServer, change `MOCKSERVER_HOST` to your server's address.

## Available Tools

### mockserver_create_expectation

Create a mock HTTP expectation on MockServer.

**Parameters:**
- `httpRequest` (required): Request matching criteria
  - `method`: HTTP method (GET, POST, PUT, DELETE, etc.)
  - `path`: URL path to match
  - `queryStringParameters`: Query parameters to match
  - `headers`: Headers to match
  - `body`: Body matcher with `type` (STRING, JSON, REGEX, XPATH, JSON_PATH) and `value`
- `httpResponse`: Response configuration
  - `statusCode`: HTTP status code
  - `headers`: Response headers
  - `body`: Response body (string or object)
  - `delay`: Response delay with `timeUnit` and `value`
- `times`: How many times to match (`remainingTimes`, `unlimited`)
- `timeToLive`: Expectation lifetime (`timeUnit`, `timeToLive`)

**Example:**
```json
{
  "httpRequest": {
    "method": "GET",
    "path": "/api/users"
  },
  "httpResponse": {
    "statusCode": 200,
    "body": { "users": [] }
  }
}
```


### mockserver_verify

Verify that requests matching criteria were received by MockServer.

**Parameters:**
- `httpRequest` (required): Request matching criteria (same as create_expectation)
- `times`: Expected request count
  - `atLeast`: Minimum number of requests
  - `atMost`: Maximum number of requests
  - `exactly`: Exact number of requests

**Example:**
```json
{
  "httpRequest": {
    "method": "POST",
    "path": "/api/orders"
  },
  "times": {
    "atLeast": 1
  }
}
```

### mockserver_clear

Clear expectations and recorded requests from MockServer.

**Parameters:**
- `httpRequest` (optional): Request matcher to clear specific expectations. If not provided, clears all.

**Example:**
```json
{
  "httpRequest": {
    "path": "/api/users"
  }
}
```

### mockserver_reset

Perform a full reset of MockServer, clearing all expectations and recorded requests.

**Parameters:** None

### mockserver_retrieve_requests

Retrieve recorded requests from MockServer.

**Parameters:**
- `httpRequest` (optional): Request matcher to filter recorded requests

**Example:**
```json
{
  "httpRequest": {
    "method": "GET"
  }
}
```

### mockserver_status

Get MockServer connection status and configuration.

**Parameters:** None

## Why Mocking?

API mocking enables early testing — start building and testing your frontend or integrations before the backend is ready. No more waiting. Ship faster.

## Requirements

- Node.js >= 18.0.0
- A running MockServer instance

## Links

- npm: https://www.npmjs.com/package/mockserver-mcp
- GitHub: https://github.com/Akkshay10/MCPClientMock
- MCP Registry: https://registry.modelcontextprotocol.io

## License

MIT
