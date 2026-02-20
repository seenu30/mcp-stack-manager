import chalk from 'chalk';
import ora from 'ora';
import { detectProjectMcps, suggestStack } from '../utils/detection.js';

export async function detect(): Promise<void> {
  console.log(chalk.bold('\nMCP Stack Manager - Project Detection\n'));

  const spinner = ora('Scanning project...').start();
  const { detected, suggested } = await detectProjectMcps();
  spinner.stop();

  if (detected.length === 0) {
    console.log(chalk.yellow('No project-specific MCPs detected.\n'));
    console.log(chalk.gray('This could mean:'));
    console.log(chalk.gray('  - The project uses technologies we don\'t have detection rules for'));
    console.log(chalk.gray('  - You\'re in an empty or non-project directory'));
    console.log(chalk.gray('\nRun `mcp-stack init` to manually select MCPs.\n'));
    return;
  }

  console.log(chalk.green('Detected:'));
  console.log();

  for (const { type, reason } of detected) {
    console.log(chalk.cyan(`  ${type}`));
    console.log(chalk.gray(`    ${reason}`));
  }

  console.log();

  // Suggest a stack if applicable
  const suggestedStackName = suggestStack(suggested);
  if (suggestedStackName) {
    console.log(chalk.bold('Suggested stack:'));
    console.log(chalk.cyan(`  ${suggestedStackName}`));
    console.log();
    console.log(chalk.gray(`Run: mcp-stack init ${suggestedStackName}`));
  } else {
    console.log(chalk.bold('Suggested MCPs:'));
    console.log(chalk.cyan(`  ${suggested.join(', ')}`));
    console.log();
    console.log(chalk.gray('Run: mcp-stack init --detect'));
  }

  console.log();
}
