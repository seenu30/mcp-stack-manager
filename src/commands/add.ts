import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { getMcp, buildMcpConfig, getAllMcpNames } from '../mcps/index.js';
import { addMcpToConfig, getConfiguredMcps } from '../utils/config.js';
import { checkRequiredEnv } from '../utils/env.js';

interface AddOptions {
  projectRef?: string;
  force?: boolean;
}

export async function add(mcpName: string, options: AddOptions = {}): Promise<void> {
  const mcp = getMcp(mcpName);

  if (!mcp) {
    console.log(chalk.red(`\nUnknown MCP: ${mcpName}`));
    console.log(chalk.gray(`Available MCPs: ${getAllMcpNames().join(', ')}`));
    process.exit(1);
  }

  // Check if already configured
  const configured = await getConfiguredMcps();
  if (configured.includes(mcpName) && !options.force) {
    console.log(chalk.yellow(`\n${mcpName} is already configured.`));
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Do you want to overwrite the existing configuration?',
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.gray('Skipped.\n'));
      return;
    }
  }

  // Check required environment variables
  if (mcp.requiredEnv && mcp.requiredEnv.length > 0) {
    const { missing, present } = checkRequiredEnv(mcp.requiredEnv);

    if (present.length > 0) {
      console.log(chalk.green(`\n✓ Found environment variables: ${present.join(', ')}`));
    }

    if (missing.length > 0) {
      console.log(chalk.yellow(`\n! Missing environment variables: ${missing.join(', ')}`));
      console.log(chalk.gray('\nYou can either:'));
      console.log(chalk.gray('  1. Set them in your environment before running Claude Code'));
      console.log(chalk.gray('  2. Add them to a .env file'));
      console.log(chalk.gray('  3. Configure them in your shell profile\n'));

      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Continue without these environment variables?',
          default: true,
        },
      ]);

      if (!proceed) {
        console.log(chalk.gray('Aborted.\n'));
        return;
      }
    }
  }

  // Build and add the config
  const spinner = ora(`Adding ${mcpName}...`).start();

  try {
    const config = buildMcpConfig(mcp);
    await addMcpToConfig(mcpName, config);
    spinner.succeed(chalk.green(`Added ${mcpName} to .mcp.json`));
  } catch (error) {
    spinner.fail(chalk.red(`Failed to add ${mcpName}`));
    console.error(error);
    process.exit(1);
  }
}

export async function addMultiple(mcpNames: string[]): Promise<void> {
  console.log(chalk.bold(`\nAdding ${mcpNames.length} MCPs...\n`));

  for (const name of mcpNames) {
    await add(name, { force: true });
  }

  console.log(chalk.green('\nDone! Run `mcp-stack doctor` to verify connections.\n'));
}
