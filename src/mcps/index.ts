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
 * Expands environment variables in the config
 */
export function buildMcpConfig(definition: MCPDefinition): MCPServerConfig {
  const config = { ...definition.config };

  // Expand environment variables in args
  if (config.args) {
    config.args = config.args.map(expandEnvVars);
  }

  // Expand environment variables in env
  if (config.env) {
    config.env = Object.fromEntries(
      Object.entries(config.env).map(([key, value]) => [key, expandEnvVars(value)])
    );
  }

  // Expand environment variables in url
  if (config.url) {
    config.url = expandEnvVars(config.url);
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
