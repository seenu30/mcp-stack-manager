import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { MCPConfigFile, MCPConfigFileSchema, MCPServerConfig } from '../types/index.js';

const MCP_CONFIG_FILE = '.mcp.json';

/**
 * Get the path to .mcp.json in the current directory
 */
export function getMcpConfigPath(dir: string = process.cwd()): string {
  return join(dir, MCP_CONFIG_FILE);
}

/**
 * Check if .mcp.json exists
 */
export async function configExists(dir: string = process.cwd()): Promise<boolean> {
  try {
    await access(getMcpConfigPath(dir));
    return true;
  } catch {
    return false;
  }
}

/**
 * Read and parse .mcp.json
 */
export async function readConfig(dir: string = process.cwd()): Promise<MCPConfigFile | null> {
  try {
    const content = await readFile(getMcpConfigPath(dir), 'utf-8');
    const parsed = JSON.parse(content);
    const validated = MCPConfigFileSchema.parse(parsed);
    return validated;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Write .mcp.json
 */
export async function writeConfig(
  config: MCPConfigFile,
  dir: string = process.cwd()
): Promise<void> {
  const content = JSON.stringify(config, null, 2) + '\n';
  await writeFile(getMcpConfigPath(dir), content, 'utf-8');
}

/**
 * Add or update an MCP server in the config
 */
export async function addMcpToConfig(
  name: string,
  serverConfig: MCPServerConfig,
  dir: string = process.cwd()
): Promise<MCPConfigFile> {
  const existing = await readConfig(dir);
  const config: MCPConfigFile = existing || { mcpServers: {} };

  config.mcpServers[name] = serverConfig;
  await writeConfig(config, dir);

  return config;
}

/**
 * Remove an MCP server from the config
 */
export async function removeMcpFromConfig(
  name: string,
  dir: string = process.cwd()
): Promise<MCPConfigFile | null> {
  const config = await readConfig(dir);
  if (!config) {
    return null;
  }

  delete config.mcpServers[name];
  await writeConfig(config, dir);

  return config;
}

/**
 * Get list of configured MCP names
 */
export async function getConfiguredMcps(dir: string = process.cwd()): Promise<string[]> {
  const config = await readConfig(dir);
  if (!config) {
    return [];
  }
  return Object.keys(config.mcpServers);
}
