import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { getMcp, buildMcpConfig, getAllMcpNames } from '../mcps/index.js';
import { addMcpToConfig, getConfiguredMcps } from '../utils/config.js';
import { maskValue } from '../utils/env.js';
import { MCPDefinition } from '../types/index.js';

interface AddOptions {
  force?: boolean;
  skipPrompts?: boolean;
}

/**
 * Prompt user for required credentials with hints and override option
 */
async function promptForCredentials(mcp: MCPDefinition): Promise<Record<string, string>> {
  const values: Record<string, string> = {};

  if (!mcp.requiredEnv?.length) return values;

  console.log(chalk.cyan(`\nConfigure ${mcp.name}:\n`));

  for (const envVar of mcp.requiredEnv) {
    const hint = mcp.envHints?.[envVar];
    const existingValue = process.env[envVar];
    const isSecret = envVar.includes('TOKEN') || envVar.includes('KEY') || envVar.includes('SECRET') || envVar.includes('PASSWORD');

    // Show variable name
    console.log(chalk.white.bold(`  ${envVar}`));

    // Show hint if available
    if (hint) {
      console.log(chalk.gray(`  Hint: ${hint}`));
    }

    if (existingValue) {
      // Show masked existing value and ask to use or override
      const masked = maskValue(existingValue);
      console.log(chalk.green(`  Found in environment: ${masked}`));

      const { useExisting } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useExisting',
          message: 'Use this value for this project?',
          default: true,
        },
      ]);

      if (useExisting) {
        values[envVar] = existingValue;
        console.log();
        continue;
      }
    }

    // Prompt for new value
    const { value } = await inquirer.prompt([
      {
        type: isSecret ? 'password' : 'input',
        name: 'value',
        message: 'Enter value:',
        validate: (input: string) => input.length > 0 || 'Value is required',
      },
    ]);

    values[envVar] = value;
    console.log();
  }

  return values;
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

  // Prompt for credentials (or skip if --skip-prompts)
  let userValues: Record<string, string> = {};

  if (!options.skipPrompts && mcp.requiredEnv && mcp.requiredEnv.length > 0) {
    userValues = await promptForCredentials(mcp);
  }

  // Build and add the config
  const spinner = ora(`Adding ${mcpName}...`).start();

  try {
    const config = buildMcpConfig(mcp, userValues);
    await addMcpToConfig(mcpName, config);
    spinner.succeed(chalk.green(`Added ${mcpName} to .mcp.json`));

    // Show setup hint if available (for browser auth, etc.)
    if (mcp.setupHint) {
      console.log(chalk.cyan(`\n${mcp.setupHint}`));
    }

    // Verification hint
    console.log(chalk.gray(`\nVerify: Run \`claude mcp list\` in CLI or \`/mcp\` in Claude Code`));
  } catch (error) {
    spinner.fail(chalk.red(`Failed to add ${mcpName}`));
    console.error(error);
    process.exit(1);
  }
}

export async function addMultiple(mcpNames: string[], options: AddOptions = {}): Promise<void> {
  console.log(chalk.bold(`\nAdding ${mcpNames.length} MCPs...\n`));

  // Collect all required env vars to avoid duplicate prompts
  const allValues: Record<string, string> = {};

  for (const name of mcpNames) {
    const mcp = getMcp(name);
    if (!mcp) continue;

    if (!options.skipPrompts && mcp.requiredEnv?.length) {
      const values = await promptForCredentials(mcp);
      Object.assign(allValues, values);
    }

    const spinner = ora(`Adding ${name}...`).start();
    try {
      const config = buildMcpConfig(mcp, allValues);
      await addMcpToConfig(name, config);
      spinner.succeed(chalk.green(`Added ${name}`));

      // Show setup hint if available
      if (mcp.setupHint) {
        console.log(chalk.cyan(`  ${mcp.setupHint}`));
      }
    } catch (error) {
      spinner.fail(chalk.red(`Failed to add ${name}`));
    }
  }

  console.log(chalk.gray('\nVerify: Run `claude mcp list` in CLI or `/mcp` in Claude Code'));
  console.log(chalk.gray('Health check: Run `mcp-stack doctor` to verify connections\n'));
}
