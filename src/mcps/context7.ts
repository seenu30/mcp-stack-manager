import { MCPDefinition, ValidationResult } from '../types/index.js';

export const context7: MCPDefinition = {
  name: 'context7',
  description: 'Context7 MCP server for documentation and context lookup',
  config: {
    type: 'http',
    url: 'https://mcp.context7.com/mcp',
    headers: {
      'CONTEXT7_API_KEY': '${CONTEXT7_API_KEY}',
    },
  },
  requiredEnv: [],
  optionalEnv: ['CONTEXT7_API_KEY'],
  envHints: {
    CONTEXT7_API_KEY: 'Get a free API key at https://context7.com/dashboard for higher rate limits',
  },
  setupHint: 'Auth: Run /mcp in Claude Code → Select context7 → Authenticate (opens browser)',
  validate: async (): Promise<ValidationResult> => {
    // HTTP MCPs authenticate via the browser, we can only check if the endpoint is reachable
    try {
      const response = await fetch('https://mcp.context7.com/mcp', {
        method: 'HEAD',
      });

      // Any response means the server is up
      return {
        valid: true,
        message: 'Context7 MCP endpoint reachable',
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Could not reach Context7 MCP endpoint',
        details: String(error),
      };
    }
  },
};
