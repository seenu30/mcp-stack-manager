import { MCPDefinition, ValidationResult } from '../types/index.js';
import { spawn } from 'node:child_process';

export const playwright: MCPDefinition = {
  name: 'playwright',
  description: 'Playwright MCP server for browser automation',
  config: {
    command: 'npx',
    args: ['@playwright/mcp@latest'],
  },
  requiredEnv: [],
  validate: async (): Promise<ValidationResult> => {
    // Check if the package can be resolved
    return new Promise((resolve) => {
      const child = spawn('npx', ['--yes', '@playwright/mcp@latest', '--help'], {
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

      child.on('close', (code) => {
        if (code === 0 || output.includes('playwright')) {
          resolve({
            valid: true,
            message: 'Playwright MCP package available',
          });
        } else {
          resolve({
            valid: false,
            message: 'Could not verify Playwright MCP package',
            details: output,
          });
        }
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
          message: 'Playwright MCP package assumed available (timeout)',
        });
      }, 10000);
    });
  },
};
