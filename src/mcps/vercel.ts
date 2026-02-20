import { MCPDefinition, ValidationResult } from '../types/index.js';

export const vercel: MCPDefinition = {
  name: 'vercel',
  description: 'Vercel MCP server for deployment and project management',
  config: {
    type: 'http',
    url: 'https://mcp.vercel.com',
  },
  requiredEnv: [],
  setupHint: 'Auth: Run /mcp in Claude Code → Select vercel → Authenticate (opens browser)',
  validate: async (): Promise<ValidationResult> => {
    // HTTP MCPs authenticate via the browser, we can only check if the endpoint is reachable
    try {
      const response = await fetch('https://mcp.vercel.com', {
        method: 'HEAD',
      });

      // Any response (even 4xx) means the server is up
      return {
        valid: true,
        message: 'Vercel MCP endpoint reachable (authentication via browser)',
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Could not reach Vercel MCP endpoint',
        details: String(error),
      };
    }
  },
};
