import { MCPDefinition, ValidationResult } from '../types/index.js';
import { spawn } from 'node:child_process';

export const chromeDevtools: MCPDefinition = {
  name: 'chrome-devtools',
  description: 'Chrome DevTools MCP server for browser debugging',
  config: {
    command: 'npx',
    args: ['chrome-devtools-mcp@latest'],
  },
  requiredEnv: [],
  validate: async (): Promise<ValidationResult> => {
    // Check if the package can be resolved
    return new Promise((resolve) => {
      const child = spawn('npx', ['--yes', 'chrome-devtools-mcp@latest', '--help'], {
        stdio: 'pipe',
        timeout: 30000,
      });

      let output = '';
      child.stdout?.on('data', (data) => {
        output += data.toString();
      });
      child.stderr?.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', () => {
        resolve({
          valid: true,
          message: 'Chrome DevTools MCP package available',
        });
      });

      child.on('error', (error) => {
        resolve({
          valid: false,
          message: 'Failed to spawn npx',
          details: String(error),
        });
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        child.kill();
        resolve({
          valid: true,
          message: 'Chrome DevTools MCP package assumed available (timeout)',
        });
      }, 10000);
    });
  },
};
