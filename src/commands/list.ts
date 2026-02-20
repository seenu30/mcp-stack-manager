import chalk from 'chalk';
import inquirer from 'inquirer';
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
      console.log(chalk.cyan(`  ${name}`));
      console.log(chalk.gray(`    ${mcp.description}`));

      // Show required env vars
      if (mcp.requiredEnv?.length) {
        console.log(chalk.yellow(`    credentials: ${mcp.requiredEnv.join(', ')}`));
      }

      // Show optional env vars
      if (mcp.optionalEnv?.length) {
        console.log(chalk.blue(`    optional: ${mcp.optionalEnv.join(', ')}`));
      }

      // Show browser auth requirement
      if (mcp.setupHint) {
        console.log(chalk.magenta(`    auth: browser (via /mcp in Claude Code)`));
      }

      // Show no credentials needed for simple MCPs
      if (!mcp.requiredEnv?.length && !mcp.optionalEnv?.length && !mcp.setupHint) {
        console.log(chalk.green(`    no credentials required`));
      }

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

/**
 * Interactive stack browser - select a stack to see its MCPs
 */
export async function browseStacks(): Promise<void> {
  const stackNames = getAllStackNames();

  const { selectedStack } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedStack',
      message: 'Select a stack to view MCPs:',
      choices: stackNames.map(name => {
        const stack = getStack(name);
        return {
          name: `${name} - ${stack?.description || ''}`,
          value: name,
        };
      }),
    },
  ]);

  const stack = getStack(selectedStack);
  if (!stack) return;

  console.log(chalk.bold(`\n${stack.name}`));
  console.log(chalk.gray(`${stack.description}\n`));
  console.log(chalk.bold('MCPs in this stack:\n'));

  for (const mcpName of stack.mcps) {
    const mcp = getMcp(mcpName);
    if (mcp) {
      console.log(chalk.cyan(`  ${mcpName}`));
      console.log(chalk.gray(`    ${mcp.description}`));

      // Show required env vars
      if (mcp.requiredEnv?.length) {
        console.log(chalk.yellow(`    credentials: ${mcp.requiredEnv.join(', ')}`));
      }

      // Show optional env vars
      if (mcp.optionalEnv?.length) {
        console.log(chalk.blue(`    optional: ${mcp.optionalEnv.join(', ')}`));
      }

      // Show browser auth requirement
      if (mcp.setupHint) {
        console.log(chalk.magenta(`    auth: browser (via /mcp in Claude Code)`));
      }

      // Show no credentials needed for simple MCPs
      if (!mcp.requiredEnv?.length && !mcp.optionalEnv?.length && !mcp.setupHint) {
        console.log(chalk.green(`    no credentials required`));
      }

      console.log();
    }
  }
}
