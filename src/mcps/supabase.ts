import { MCPDefinition, ValidationResult } from '../types/index.js';
import { getEnv } from '../utils/env.js';

export const supabase: MCPDefinition = {
  name: 'supabase',
  description: 'Supabase MCP server for database and auth operations',
  config: {
    command: 'npx',
    args: ['-y', '@supabase/mcp-server-supabase@latest', '--project-ref=${SUPABASE_PROJECT_REF}'],
    env: {
      SUPABASE_ACCESS_TOKEN: '${SUPABASE_ACCESS_TOKEN}',
    },
  },
  requiredEnv: ['SUPABASE_PROJECT_REF', 'SUPABASE_ACCESS_TOKEN'],
  envHints: {
    SUPABASE_PROJECT_REF: 'Supabase Dashboard → Select Project → Project Settings → General → "Reference ID"',
    SUPABASE_ACCESS_TOKEN: 'https://supabase.com/dashboard/account/tokens → Generate new token',
  },
  validate: async (): Promise<ValidationResult> => {
    const projectRef = getEnv('SUPABASE_PROJECT_REF');
    const accessToken = getEnv('SUPABASE_ACCESS_TOKEN');

    if (!projectRef) {
      return { valid: false, message: 'SUPABASE_PROJECT_REF not set' };
    }
    if (!accessToken) {
      return { valid: false, message: 'SUPABASE_ACCESS_TOKEN not set' };
    }

    // Try to validate the token by making a simple API call
    try {
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          message: `Connected to project: ${data.name || projectRef}`,
        };
      } else if (response.status === 401) {
        return { valid: false, message: 'Invalid access token' };
      } else if (response.status === 404) {
        return { valid: false, message: 'Project not found' };
      } else {
        return { valid: false, message: `API error: ${response.status}` };
      }
    } catch (error) {
      return {
        valid: false,
        message: 'Could not connect to Supabase API',
        details: String(error),
      };
    }
  },
};
