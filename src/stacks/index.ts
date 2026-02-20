import { StackTemplate } from '../types/index.js';
import saasTs from './saas-ts.json' with { type: 'json' };
import automation from './automation.json' with { type: 'json' };
import aiBuilder from './ai-builder.json' with { type: 'json' };
import fullstack from './fullstack.json' with { type: 'json' };

// Registry of all available stacks
export const stackRegistry: Record<string, StackTemplate> = {
  'saas-ts': saasTs as StackTemplate,
  automation: automation as StackTemplate,
  'ai-builder': aiBuilder as StackTemplate,
  fullstack: fullstack as StackTemplate,
};

/**
 * Get a stack template by name
 */
export function getStack(name: string): StackTemplate | undefined {
  return stackRegistry[name];
}

/**
 * Get all available stack names
 */
export function getAllStackNames(): string[] {
  return Object.keys(stackRegistry);
}

/**
 * Get all stack templates
 */
export function getAllStacks(): StackTemplate[] {
  return Object.values(stackRegistry);
}
