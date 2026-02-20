#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { init } from './commands/init.js';
import { add, addMultiple, addInteractive } from './commands/add.js';
import { remove, removeAll, removeStack } from './commands/remove.js';
import { list } from './commands/list.js';
import { detect } from './commands/detect.js';
import { doctor } from './commands/doctor.js';

const program = new Command();

program
  .name('mcp-stack')
  .description('MCP Stack Manager for Claude Code - manage MCP server configurations')
  .version('0.1.0');

// init command
program
  .command('init [stack]')
  .description('Initialize MCP configuration with a stack template')
  .option('-d, --detect', 'Auto-detect project type and suggest MCPs')
  .option('-f, --force', 'Overwrite existing .mcp.json')
  .option('-s, --skip-prompts', 'Skip credential prompts (use env vars only)')
  .action(async (stack: string | undefined, options: { detect?: boolean; force?: boolean; skipPrompts?: boolean }) => {
    await init(stack, options);
  });

// add command
program
  .command('add [mcp...]')
  .description('Add MCP(s) to the configuration')
  .option('-f, --force', 'Overwrite if already configured')
  .option('-s, --skip-prompts', 'Skip credential prompts (use env vars only)')
  .action(async (mcps: string[], options: { force?: boolean; skipPrompts?: boolean }) => {
    if (!mcps || mcps.length === 0) {
      await addInteractive(options);
    } else if (mcps.length === 1) {
      await add(mcps[0], options);
    } else {
      await addMultiple(mcps, options);
    }
  });

// remove command
program
  .command('remove [mcp]')
  .description('Remove MCP(s) from the configuration')
  .option('-a, --all', 'Remove all configured MCPs')
  .option('-s, --stack [name]', 'Remove all MCPs from a stack')
  .option('-f, --force', 'Skip confirmation prompt')
  .action(async (mcp: string | undefined, options: { all?: boolean; stack?: string | boolean; force?: boolean }) => {
    if (options.all) {
      await removeAll(options);
    } else if (options.stack !== undefined) {
      // --stack was used, value is true if no name provided, or the stack name
      const stackName = typeof options.stack === 'string' ? options.stack : undefined;
      await removeStack(stackName, options);
    } else {
      await remove(mcp, options);
    }
  });

// list command
program
  .command('list [type]')
  .description('List available stacks, MCPs, or configured MCPs')
  .addHelpText(
    'after',
    `
Types:
  stacks      List available stack templates
  mcps        List all available MCPs
  configured  List MCPs configured in this project
  (none)      List all of the above
`
  )
  .action(async (type?: string) => {
    await list(type);
  });

// detect command
program
  .command('detect')
  .description('Detect project type and suggest MCPs')
  .action(async () => {
    await detect();
  });

// doctor command
program
  .command('doctor')
  .description('Check MCP configurations and validate connections')
  .action(async () => {
    await doctor();
  });

// Add header
console.log(chalk.bold.cyan('\n  MCP Stack Manager v0.1.0\n'));

// Parse and run
program.parse();
