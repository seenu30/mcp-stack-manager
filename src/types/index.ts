import { z } from 'zod';

// MCP server configuration schema (matches Claude Code format)
export const MCPServerConfigSchema = z.object({
  // For stdio servers
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  // For HTTP/SSE servers
  type: z.enum(['http', 'sse']).optional(),
  url: z.string().optional(),
  headers: z.record(z.string()).optional(),
});

export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;

// The .mcp.json file format
export const MCPConfigFileSchema = z.object({
  mcpServers: z.record(MCPServerConfigSchema),
});

export type MCPConfigFile = z.infer<typeof MCPConfigFileSchema>;

// Validation result
export interface ValidationResult {
  valid: boolean;
  message: string;
  details?: string;
}

// MCP definition with metadata
export interface MCPDefinition {
  name: string;
  description: string;
  config: MCPServerConfig;
  requiredEnv?: string[];
  optionalEnv?: string[];
  envHints?: Record<string, string>; // Hints for where to find each credential
  validate?: () => Promise<ValidationResult>;
}

// Detection rule for auto-detecting project type
export interface DetectionRule {
  files?: string[];
  dependencies?: string[];
  suggest: string[];
}

// Stack template
export interface StackTemplate {
  name: string;
  description: string;
  mcps: string[];
  detection?: {
    files?: string[];
    dependencies?: string[];
  };
}

// Doctor check result
export interface DoctorCheckResult {
  mcp: string;
  status: 'healthy' | 'warning' | 'error' | 'not_configured';
  checks: {
    name: string;
    passed: boolean;
    message: string;
  }[];
}
