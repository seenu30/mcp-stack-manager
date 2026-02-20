import chalk from 'chalk';
import ora from 'ora';

const PACKAGE_NAME = 'mcp-stack';
const VERSION = '0.1.5';

interface NpmPackageInfo {
  'dist-tags': {
    latest: string;
  };
  versions: Record<string, unknown>;
}

/**
 * Compare two semver versions
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.replace(/^v/, '').split('.').map(Number);
  const partsB = b.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

/**
 * Check for updates from npm registry
 */
export async function update(): Promise<void> {
  console.log(chalk.bold('\nMCP Stack Manager - Update Check\n'));

  const spinner = ora('Checking for updates...').start();

  try {
    const response = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}`);

    if (!response.ok) {
      spinner.fail('Failed to check for updates');
      console.log(chalk.gray(`Could not reach npm registry (HTTP ${response.status})`));
      return;
    }

    const data = (await response.json()) as NpmPackageInfo;
    const latestVersion = data['dist-tags']?.latest;

    if (!latestVersion) {
      spinner.fail('Could not determine latest version');
      return;
    }

    spinner.stop();

    const comparison = compareVersions(latestVersion, VERSION);

    if (comparison > 0) {
      console.log(chalk.yellow(`  Update available: ${VERSION} → ${latestVersion}\n`));
      console.log(chalk.bold('  To update, run:'));
      console.log(chalk.cyan(`    npm update -g ${PACKAGE_NAME}\n`));
    } else if (comparison === 0) {
      console.log(chalk.green(`  ✓ You're on the latest version (${VERSION})\n`));
    } else {
      // This shouldn't happen, but handle it gracefully
      console.log(chalk.blue(`  You're on version ${VERSION} (latest: ${latestVersion})\n`));
    }
  } catch (error) {
    spinner.fail('Failed to check for updates');
    console.log(chalk.gray('  Could not connect to npm registry'));
    if (error instanceof Error) {
      console.log(chalk.gray(`  ${error.message}\n`));
    }
  }
}
