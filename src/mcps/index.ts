import { MCPDefinition, MCPServerConfig } from '../types/index.js';
import { supabase } from './supabase.js';
import { vercel } from './vercel.js';
import { github } from './github.js';
import { playwright } from './playwright.js';
import { puppeteer } from './puppeteer.js';
import { chromeDevtools } from './chrome-devtools.js';
import { context7 } from './context7.js';
import { expandEnvVars } from '../utils/env.js';

// Registry of all available MCPs
export const mcpRegistry: Record<string, MCPDefinition> = {
  supabase,
  vercel,
  github,
  playwright,
  puppeteer,
  'chrome-devtools': chromeDevtools,
  context7,
};

/**
 * Get an MCP definition by name
 */
export function getMcp(name: string): MCPDefinition | undefined {
  return mcpRegistry[name];
}

/**
 * Get all available MCP names
 */
export function getAllMcpNames(): string[] {
  return Object.keys(mcpRegistry);
}

/**
 * Get all MCPs that require environment variables
 */
export function getMcpsWithRequiredEnv(): MCPDefinition[] {
  return Object.values(mcpRegistry).filter(
    (mcp) => mcp.requiredEnv && mcp.requiredEnv.length > 0
  );
}

/**
 * Build a concrete MCP config from a definition
 * Expands environment variables in the config, with optional user-provided values taking precedence
 */
export function buildMcpConfig(
  definition: MCPDefinition,
  userValues?: Record<string, string>
): MCPServerConfig {
  const config = { ...definition.config };

  // Helper to get value: user-provided first, then env var, then empty string
  const getValue = (varName: string): string => {
    return userValues?.[varName] || process.env[varName] || '';
  };

  // Helper to expand ${VAR} patterns in a string
  const expandValue = (value: string): string => {
    return value.replace(/\$\{([^}]+)\}/g, (_, expr) => {
      const [varName, defaultValue] = expr.split(':-');
      return getValue(varName) || defaultValue || '';
    });
  };

  // Expand in args
  if (config.args) {
    config.args = config.args.map(expandValue);
  }

  // Expand in env
  if (config.env) {
    config.env = Object.fromEntries(
      Object.entries(config.env).map(([key, value]) => [key, expandValue(value)])
    );
  }

  // Expand in url
  if (config.url) {
    config.url = expandValue(config.url);
  }

  // Expand in headers
  if (config.headers) {
    config.headers = Object.fromEntries(
      Object.entries(config.headers).map(([key, value]) => [key, expandValue(value)])
    );
  }

  return config;
}

/**
 * Get required environment variables for a list of MCPs
 */
export function getRequiredEnvForMcps(mcpNames: string[]): string[] {
  const envVars = new Set<string>();

  for (const name of mcpNames) {
    const mcp = getMcp(name);
    if (mcp?.requiredEnv) {
      for (const envVar of mcp.requiredEnv) {
        envVars.add(envVar);
      }
    }
  }

  return Array.from(envVars);
}
