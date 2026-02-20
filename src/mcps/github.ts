import { MCPDefinition, ValidationResult } from '../types/index.js';
import { getEnv } from '../utils/env.js';

export const github: MCPDefinition = {
  name: 'github',
  description: 'GitHub MCP server for repository operations',
  config: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}',
    },
  },
  requiredEnv: ['GITHUB_TOKEN'],
  envHints: {
    GITHUB_TOKEN: 'https://github.com/settings/tokens → Generate new token (classic) → Select scopes: repo, read:org',
  },
  validate: async (): Promise<ValidationResult> => {
    const token = getEnv('GITHUB_TOKEN');

    if (!token) {
      return { valid: false, message: 'GITHUB_TOKEN not set' };
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'mcp-stack-manager',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as { login: string };
        return {
          valid: true,
          message: `Authenticated as: ${data.login}`,
        };
      } else if (response.status === 401) {
        return { valid: false, message: 'Invalid or expired token' };
      } else {
        return { valid: false, message: `GitHub API error: ${response.status}` };
      }
    } catch (error) {
      return {
        valid: false,
        message: 'Could not connect to GitHub API',
        details: String(error),
      };
    }
  },
};
