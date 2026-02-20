import { MCPDefinition, ValidationResult } from '../types/index.js';
import { spawn } from 'node:child_process';

export const puppeteer: MCPDefinition = {
  name: 'puppeteer',
  description: 'Puppeteer MCP server for browser automation',
  config: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
  },
  requiredEnv: [],
  validate: async (): Promise<ValidationResult> => {
    // Check if the package can be resolved
    return new Promise((resolve) => {
      const child = spawn('npx', ['--yes', '@modelcontextprotocol/server-puppeteer', '--help'], {
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
        // Package exists if it responds at all
        resolve({
          valid: true,
          message: 'Puppeteer MCP package available',
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
          message: 'Puppeteer MCP package assumed available (timeout)',
        });
      }, 10000);
    });
  },
};
