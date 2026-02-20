import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { getConfiguredMcps, removeMcpFromConfig, configExists } from '../utils/config.js';

interface RemoveOptions {
  force?: boolean;
}

export async function remove(mcpName: string | undefined, options: RemoveOptions): Promise<void> {
  // Check if config exists
  if (!(await configExists())) {
    console.log(chalk.yellow('\nNo .mcp.json found in current directory.'));
    console.log(chalk.gray('Run `mcp-stack init` or `mcp-stack add <mcp>` first.\n'));
    process.exit(1);
  }

  // Get configured MCPs
  const configuredMcps = await getConfiguredMcps();

  if (configuredMcps.length === 0) {
    console.log(chalk.yellow('\nNo MCPs configured in .mcp.json.\n'));
    process.exit(0);
  }

  let nameToRemove = mcpName;

  // If no name provided, show interactive selection
  if (!nameToRemove) {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select MCP to remove:',
        choices: configuredMcps.map((name) => ({
          name,
          value: name,
        })),
      },
    ]);
    nameToRemove = selected;
  }

  // Check if MCP exists in config
  if (!configuredMcps.includes(nameToRemove!)) {
    console.log(chalk.red(`\nMCP "${nameToRemove}" is not configured in .mcp.json.`));
    console.log(chalk.gray(`Configured MCPs: ${configuredMcps.join(', ')}\n`));
    process.exit(1);
  }

  // Confirm removal unless --force
  if (!options.force) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Remove ${nameToRemove} from .mcp.json?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.gray('\nCancelled.\n'));
      process.exit(0);
    }
  }

  // Remove the MCP
  const spinner = ora(`Removing ${nameToRemove}...`).start();

  try {
    await removeMcpFromConfig(nameToRemove!);
    spinner.succeed(chalk.green(`Removed ${nameToRemove} from .mcp.json`));
    console.log(chalk.gray(`\nVerify: Run \`claude mcp list\` in CLI or \`/mcp\` in Claude Code`));
  } catch (error) {
    spinner.fail(chalk.red(`Failed to remove ${nameToRemove}`));
    console.error(error);
    process.exit(1);
  }
}

export async function removeAll(options: RemoveOptions): Promise<void> {
  // Check if config exists
  if (!(await configExists())) {
    console.log(chalk.yellow('\nNo .mcp.json found in current directory.\n'));
    process.exit(1);
  }

  const configuredMcps = await getConfiguredMcps();

  if (configuredMcps.length === 0) {
    console.log(chalk.yellow('\nNo MCPs configured in .mcp.json.\n'));
    process.exit(0);
  }

  // Confirm removal unless --force
  if (!options.force) {
    console.log(chalk.yellow(`\nThis will remove all ${configuredMcps.length} configured MCP(s):`));
    configuredMcps.forEach((name) => console.log(chalk.gray(`  - ${name}`)));

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure?',
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.gray('\nCancelled.\n'));
      process.exit(0);
    }
  }

  // Remove all MCPs
  const spinner = ora('Removing all MCPs...').start();

  try {
    for (const name of configuredMcps) {
      await removeMcpFromConfig(name);
    }
    spinner.succeed(chalk.green(`Removed ${configuredMcps.length} MCP(s) from .mcp.json`));
    console.log(chalk.gray(`\nVerify: Run \`claude mcp list\` in CLI or \`/mcp\` in Claude Code`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to remove MCPs'));
    console.error(error);
    process.exit(1);
  }
}
