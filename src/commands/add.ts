import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import checkbox from '@inquirer/checkbox';
import { getMcp, buildMcpConfig, getAllMcpNames } from '../mcps/index.js';
import { addMcpToConfig, getConfiguredMcps } from '../utils/config.js';
import { maskValue } from '../utils/env.js';
import { MCPDefinition } from '../types/index.js';

interface AddOptions {
  force?: boolean;
}

/**
 * Prompt user for required and optional credentials with hints
 */
async function promptForCredentials(mcp: MCPDefinition): Promise<Record<string, string>> {
  const values: Record<string, string> = {};
  const hasRequired = mcp.requiredEnv && mcp.requiredEnv.length > 0;
  const hasOptional = mcp.optionalEnv && mcp.optionalEnv.length > 0;

  if (!hasRequired && !hasOptional) return values;

  console.log(chalk.cyan(`\nConfigure ${mcp.name}:\n`));

  // Prompt for required env vars
  if (hasRequired) {
    for (const envVar of mcp.requiredEnv!) {
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
  }

  // Prompt for optional env vars
  if (hasOptional) {
    for (const envVar of mcp.optionalEnv!) {
      const hint = mcp.envHints?.[envVar];
      const existingValue = process.env[envVar];
      const isSecret = envVar.includes('TOKEN') || envVar.includes('KEY') || envVar.includes('SECRET') || envVar.includes('PASSWORD');

      // Show variable name with (optional) label
      console.log(chalk.white.bold(`  ${envVar}`) + chalk.gray(' (optional)'));

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

      // Ask if they want to provide this optional value
      const { wantToProvide } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'wantToProvide',
          message: 'Do you want to provide a value?',
          default: false,
        },
      ]);

      if (!wantToProvide) {
        console.log();
        continue;
      }

      // Prompt for value
      const { value } = await inquirer.prompt([
        {
          type: isSecret ? 'password' : 'input',
          name: 'value',
          message: 'Enter value:',
        },
      ]);

      if (value) {
        values[envVar] = value;
      }
      console.log();
    }
  }

  return values;
}

/**
 * Interactive MCP selection when no MCP name is provided
 */
export async function addInteractive(options: AddOptions = {}): Promise<void> {
  const allMcps = getAllMcpNames();
  const configured = await getConfiguredMcps();

  // Filter out already configured MCPs unless --force
  const availableMcps = options.force
    ? allMcps
    : allMcps.filter(name => !configured.includes(name));

  if (availableMcps.length === 0) {
    console.log(chalk.yellow('\nAll available MCPs are already configured.'));
    console.log(chalk.gray('Use --force to reconfigure existing MCPs.\n'));
    return;
  }

  const selected = await checkbox({
    message: 'Select MCPs to add:',
    choices: availableMcps.map(name => {
      const mcp = getMcp(name);
      return {
        name: `${name} - ${mcp?.description || ''}`,
        value: name,
      };
    }),
    theme: {
      icon: {
        checked: '[✓]',
        unchecked: '[ ]',
        cursor: '→',
      },
    },
  });

  if (selected.length === 0) {
    console.log(chalk.gray('\nNo MCPs selected.\n'));
    return;
  }

  if (selected.length === 1) {
    await add(selected[0], options);
  } else {
    await addMultiple(selected, options);
  }
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

  // Prompt for credentials if needed
  let userValues: Record<string, string> = {};

  if ((mcp.requiredEnv && mcp.requiredEnv.length > 0) || (mcp.optionalEnv && mcp.optionalEnv.length > 0)) {
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

    if (mcp.requiredEnv?.length || mcp.optionalEnv?.length) {
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
