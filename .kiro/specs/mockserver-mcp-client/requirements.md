# Requirements Document

## Introduction

This document defines the requirements for an MCP (Model Context Protocol) server that provides tools for interacting with James Bloom's MockServer. The MCP server will enable AI assistants to create mock HTTP expectations, verify requests, clear state, and manage MockServer instances programmatically.

## Glossary

- **MCP Server**: A Model Context Protocol server that exposes tools and resources to AI assistants
- **MockServer**: An open-source tool by James Bloom for mocking HTTP/HTTPS services
- **Expectation**: A MockServer configuration that defines how to respond to matching requests
- **Verification**: The process of checking that MockServer received expected requests
- **Request Matcher**: Criteria used to match incoming requests (path, method, headers, body)

## Requirements

### Requirement 1: Expectation Management

**User Story:** As a developer, I want to create mock HTTP expectations through the MCP client, so that I can simulate API responses during testing and development.

#### Acceptance Criteria

1. WHEN a user provides request matching criteria and response details, THE MCP Server SHALL create an expectation on the configured MockServer instance.
2. WHEN creating an expectation, THE MCP Server SHALL support matching by HTTP method, path, query parameters, headers, and body.
3. WHEN creating an expectation, THE MCP Server SHALL support configuring response status code, headers, body, and delay.
4. WHEN an expectation is created successfully, THE MCP Server SHALL return confirmation with the expectation identifier.
5. IF the MockServer is unreachable, THEN THE MCP Server SHALL return an error message indicating connection failure.

### Requirement 2: Request Verification

**User Story:** As a developer, I want to verify that specific requests were made to MockServer, so that I can validate my application's HTTP interactions.

#### Acceptance Criteria

1. WHEN a user provides request matching criteria, THE MCP Server SHALL verify if matching requests were received by MockServer.
2. WHEN verifying requests, THE MCP Server SHALL support specifying minimum and maximum expected request counts.
3. WHEN verification succeeds, THE MCP Server SHALL return the count of matching requests received.
4. WHEN verification fails, THE MCP Server SHALL return details about the mismatch including actual request count.
5. IF the MockServer is unreachable, THEN THE MCP Server SHALL return an error message indicating connection failure.

### Requirement 3: State Management

**User Story:** As a developer, I want to clear MockServer expectations and recorded requests, so that I can reset state between test scenarios.

#### Acceptance Criteria

1. WHEN a user requests to clear all expectations, THE MCP Server SHALL remove all configured expectations from MockServer.
2. WHEN a user requests to clear recorded requests, THE MCP Server SHALL remove all logged requests from MockServer.
3. WHEN a user requests a full reset, THE MCP Server SHALL clear both expectations and recorded requests.
4. WHEN clearing operations complete successfully, THE MCP Server SHALL return confirmation of the cleared items.
5. IF the MockServer is unreachable, THEN THE MCP Server SHALL return an error message indicating connection failure.

### Requirement 4: Request Retrieval

**User Story:** As a developer, I want to retrieve recorded requests from MockServer, so that I can inspect what requests my application made.

#### Acceptance Criteria

1. WHEN a user requests recorded requests, THE MCP Server SHALL retrieve all logged requests from MockServer.
2. WHEN a user provides request matching criteria, THE MCP Server SHALL retrieve only matching recorded requests.
3. WHEN requests are retrieved, THE MCP Server SHALL return request details including method, path, headers, and body.
4. IF no matching requests exist, THEN THE MCP Server SHALL return an empty result set.
5. IF the MockServer is unreachable, THEN THE MCP Server SHALL return an error message indicating connection failure.

### Requirement 5: Server Configuration

**User Story:** As a developer, I want to configure the MockServer connection details, so that I can connect to different MockServer instances.

#### Acceptance Criteria

1. WHEN the MCP Server starts, THE MCP Server SHALL read MockServer host and port from environment variables.
2. WHERE environment variables are not set, THE MCP Server SHALL use default values of localhost and port 1080.
3. WHEN a user queries server status, THE MCP Server SHALL return the current MockServer connection configuration.
4. WHEN a user queries server status, THE MCP Server SHALL indicate whether MockServer is reachable.

### Requirement 6: Publishing and Distribution

**User Story:** As a developer, I want to publish the MCP client as an npm package, so that other developers can easily install and use it.

#### Acceptance Criteria

1. THE MCP Server SHALL be packaged as a standalone npm package with a descriptive name.
2. THE MCP Server SHALL include a CLI entry point for running as a standalone process.
3. THE MCP Server SHALL include TypeScript type definitions for consumers.
4. THE MCP Server SHALL include documentation for installation and configuration.
5. THE MCP Server SHALL specify compatible Node.js versions in package metadata.
