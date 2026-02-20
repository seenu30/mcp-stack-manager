import chalk from 'chalk';
import { getAllStackNames, getStack } from '../stacks/index.js';
import { getAllMcpNames, getMcp } from '../mcps/index.js';
import { getConfiguredMcps } from '../utils/config.js';

export async function listStacks(): Promise<void> {
  console.log(chalk.bold('\nAvailable Stacks:\n'));

  const stackNames = getAllStackNames();

  for (const name of stackNames) {
    const stack = getStack(name);
    if (stack) {
      console.log(chalk.cyan(`  ${name}`));
      console.log(chalk.gray(`    ${stack.description}`));
      console.log(chalk.gray(`    MCPs: ${stack.mcps.join(', ')}`));
      console.log();
    }
  }
}

export async function listMcps(): Promise<void> {
  console.log(chalk.bold('\nAvailable MCPs:\n'));

  const mcpNames = getAllMcpNames();

  for (const name of mcpNames) {
    const mcp = getMcp(name);
    if (mcp) {
      const envInfo = mcp.requiredEnv?.length
        ? chalk.yellow(` (requires: ${mcp.requiredEnv.join(', ')})`)
        : chalk.green(' (no env required)');

      console.log(chalk.cyan(`  ${name}`));
      console.log(chalk.gray(`    ${mcp.description}`));
      console.log(`    ${envInfo}`);
      console.log();
    }
  }
}

export async function listConfigured(): Promise<void> {
  const configured = await getConfiguredMcps();

  if (configured.length === 0) {
    console.log(chalk.yellow('\nNo MCPs configured in this project.'));
    console.log(chalk.gray('Run `mcp-stack init` to get started.\n'));
    return;
  }

  console.log(chalk.bold('\nConfigured MCPs:\n'));

  for (const name of configured) {
    console.log(chalk.green(`  ✓ ${name}`));
  }

  console.log();
}

export async function list(type?: string): Promise<void> {
  if (type === 'stacks') {
    await listStacks();
  } else if (type === 'mcps') {
    await listMcps();
  } else if (type === 'configured') {
    await listConfigured();
  } else {
    // Show all
    await listStacks();
    await listMcps();
    await listConfigured();
  }
}
