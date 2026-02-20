import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { getStack, getAllStackNames, getAllStacks } from '../stacks/index.js';
import { getMcp, buildMcpConfig, getAllMcpNames, getRequiredEnvForMcps } from '../mcps/index.js';
import { writeConfig, configExists, readConfig } from '../utils/config.js';
import { maskValue } from '../utils/env.js';
import { detectProjectMcps, suggestStack } from '../utils/detection.js';
import { MCPConfigFile } from '../types/index.js';

interface InitOptions {
  detect?: boolean;
  force?: boolean;
}

async function selectStack(): Promise<string | null> {
  const stacks = getAllStacks();

  const { selection } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selection',
      message: 'Select a stack template:',
      choices: [
        ...stacks.map((stack) => ({
          name: `${stack.name} - ${stack.description}`,
          value: stack.name,
        })),
        new inquirer.Separator(),
        { name: 'Custom (select individual MCPs)', value: '__custom__' },
      ],
    },
  ]);

  return selection === '__custom__' ? null : selection;
}

async function selectMcps(): Promise<string[]> {
  const mcpNames = getAllMcpNames();

  const { selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Select MCPs to add:',
      choices: mcpNames.map((name) => {
        const mcp = getMcp(name);
        return {
          name: `${name} - ${mcp?.description || ''}`,
          value: name,
        };
      }),
    },
  ]);

  return selected;
}

/**
 * Prompt for all required credentials across MCPs with hints and override option
 */
async function promptForAllCredentials(mcpNames: string[]): Promise<Record<string, string>> {
  const values: Record<string, string> = {};
  const allRequired = getRequiredEnvForMcps(mcpNames);

  if (allRequired.length === 0) return values;

  // Group vars by MCP for better UX
  for (const mcpName of mcpNames) {
    const mcp = getMcp(mcpName);
    if (!mcp?.requiredEnv?.length) continue;

    console.log(chalk.cyan(`\nConfigure ${mcpName}:\n`));

    for (const envVar of mcp.requiredEnv) {
      // Skip if we already have this value (from a previous MCP)
      if (values[envVar]) continue;

      const hint = mcp.envHints?.[envVar];
      const existingValue = process.env[envVar];
      const isSecret =
        envVar.includes('TOKEN') ||
        envVar.includes('KEY') ||
        envVar.includes('SECRET') ||
        envVar.includes('PASSWORD');

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
  }

  return values;
}

export async function init(stackName?: string, options: InitOptions = {}): Promise<void> {
  console.log(chalk.bold('\nMCP Stack Manager\n'));

  // Check if config already exists
  if (await configExists()) {
    if (!options.force) {
      const existing = await readConfig();
      const existingMcps = existing ? Object.keys(existing.mcpServers) : [];

      console.log(chalk.yellow('A .mcp.json file already exists.'));
      console.log(chalk.gray(`Configured MCPs: ${existingMcps.join(', ') || 'none'}`));

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Merge with existing config', value: 'merge' },
            { name: 'Replace existing config', value: 'replace' },
            { name: 'Cancel', value: 'cancel' },
          ],
        },
      ]);

      if (action === 'cancel') {
        console.log(chalk.gray('\nAborted.\n'));
        return;
      }

      if (action === 'replace') {
        options.force = true;
      }
    }
  }

  let mcpsToAdd: string[] = [];

  // Auto-detect mode
  if (options.detect) {
    const spinner = ora('Detecting project type...').start();
    const { detected, suggested } = await detectProjectMcps();
    spinner.stop();

    if (detected.length > 0) {
      console.log(chalk.green('Detected project configuration:\n'));
      for (const { type, reason } of detected) {
        console.log(chalk.gray(`  ${type}: ${reason}`));
      }

      const suggestedStackName = suggestStack(suggested);
      if (suggestedStackName) {
        console.log(chalk.cyan(`\nSuggested stack: ${suggestedStackName}`));
      }

      const { useDetected } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useDetected',
          message: `Add detected MCPs (${suggested.join(', ')})?`,
          default: true,
        },
      ]);

      if (useDetected) {
        mcpsToAdd = suggested;
      }
    } else {
      console.log(chalk.yellow('Could not auto-detect project type.\n'));
    }
  }

  // Stack selection mode
  if (mcpsToAdd.length === 0) {
    if (stackName) {
      const stack = getStack(stackName);
      if (!stack) {
        console.log(chalk.red(`Unknown stack: ${stackName}`));
        console.log(chalk.gray(`Available stacks: ${getAllStackNames().join(', ')}`));
        process.exit(1);
      }
      mcpsToAdd = stack.mcps;
      console.log(chalk.cyan(`Using stack: ${stack.name}`));
      console.log(chalk.gray(`${stack.description}\n`));
    } else {
      // Interactive mode
      const selectedStack = await selectStack();

      if (selectedStack) {
        const stack = getStack(selectedStack);
        if (stack) {
          mcpsToAdd = stack.mcps;
          console.log(chalk.gray(`\nSelected: ${stack.description}\n`));
        }
      } else {
        mcpsToAdd = await selectMcps();
      }
    }
  }

  if (mcpsToAdd.length === 0) {
    console.log(chalk.yellow('\nNo MCPs selected. Aborted.\n'));
    return;
  }

  // Prompt for credentials
  const userValues = await promptForAllCredentials(mcpsToAdd);

  // Build the config
  const spinner = ora('Writing .mcp.json...').start();

  try {
    const existingConfig = options.force ? null : await readConfig();
    const config: MCPConfigFile = {
      mcpServers: existingConfig?.mcpServers || {},
    };

    for (const mcpName of mcpsToAdd) {
      const mcp = getMcp(mcpName);
      if (mcp) {
        config.mcpServers[mcpName] = buildMcpConfig(mcp, userValues);
      }
    }

    await writeConfig(config);
    spinner.succeed(chalk.green('Created .mcp.json'));

    console.log(chalk.bold('\nAdded MCPs:'));
    const setupHints: string[] = [];
    for (const name of mcpsToAdd) {
      console.log(chalk.green(`  ✓ ${name}`));
      const mcp = getMcp(name);
      if (mcp?.setupHint) {
        setupHints.push(`${name}: ${mcp.setupHint}`);
      }
    }

    // Show setup hints if any
    if (setupHints.length > 0) {
      console.log(chalk.bold('\nSetup required:'));
      for (const hint of setupHints) {
        console.log(chalk.cyan(`  ${hint}`));
      }
    }

    console.log(chalk.gray('\nVerify: Run `claude mcp list` in CLI or `/mcp` in Claude Code'));
    console.log(chalk.gray('Health check: Run `mcp-stack doctor` to verify connections\n'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to write .mcp.json'));
    console.error(error);
    process.exit(1);
  }
}
