import chalk from 'chalk';
import ora from 'ora';
import { readConfig } from '../utils/config.js';
import { getMcp } from '../mcps/index.js';
import { checkRequiredEnv } from '../utils/env.js';
import { DoctorCheckResult, MCPServerConfig } from '../types/index.js';

/**
 * Check if credentials are configured in the MCP config (not just env vars)
 * Returns true if the config has actual values (not ${VAR} templates)
 */
function hasConfiguredCredentials(mcpConfig: MCPServerConfig): boolean {
  // Check env object for non-template values
  if (mcpConfig.env) {
    for (const value of Object.values(mcpConfig.env)) {
      if (value && value.length > 0 && !value.includes('${')) {
        return true;
      }
    }
  }
  // Check args for values like --project-ref=xxx (not templates)
  if (mcpConfig.args) {
    for (const arg of mcpConfig.args) {
      if (arg.includes('=') && !arg.includes('${')) {
        return true;
      }
    }
  }
  // Check headers for non-template values
  if (mcpConfig.headers) {
    for (const value of Object.values(mcpConfig.headers)) {
      if (value && value.length > 0 && !value.includes('${')) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Set environment variables from config values for validation
 * This allows validate functions to read credentials from config
 */
function setEnvFromConfig(mcpConfig: MCPServerConfig): void {
  // Extract from env object (e.g., GITHUB_PERSONAL_ACCESS_TOKEN, SUPABASE_ACCESS_TOKEN)
  if (mcpConfig.env) {
    for (const [key, value] of Object.entries(mcpConfig.env)) {
      if (value && !value.includes('${')) {
        process.env[key] = value;
        // Also set common aliases
        if (key === 'GITHUB_PERSONAL_ACCESS_TOKEN') {
          process.env['GITHUB_TOKEN'] = value;
        }
      }
    }
  }
  // Extract from args (e.g., --project-ref=xxx for Supabase)
  if (mcpConfig.args) {
    for (const arg of mcpConfig.args) {
      const match = arg.match(/^--([^=]+)=(.+)$/);
      if (match && !match[2].includes('${')) {
        if (match[1] === 'project-ref') {
          process.env['SUPABASE_PROJECT_REF'] = match[2];
        }
      }
    }
  }
}

export async function doctor(): Promise<void> {
  console.log(chalk.bold('\nMCP Stack Manager - Doctor\n'));

  const config = await readConfig();

  if (!config || Object.keys(config.mcpServers).length === 0) {
    console.log(chalk.yellow('No MCPs configured in this project.'));
    console.log(chalk.gray('Run `mcp-stack init` to get started.\n'));
    return;
  }

  const mcpNames = Object.keys(config.mcpServers);
  console.log(chalk.gray(`Checking ${mcpNames.length} configured MCP(s)...\n`));

  const results: DoctorCheckResult[] = [];

  for (const mcpName of mcpNames) {
    const result: DoctorCheckResult = {
      mcp: mcpName,
      status: 'healthy',
      checks: [],
    };

    const mcp = getMcp(mcpName);

    // Check 1: Is this a known MCP?
    if (!mcp) {
      result.status = 'warning';
      result.checks.push({
        name: 'Known MCP',
        passed: false,
        message: 'Unknown MCP (not in registry, but may still work)',
      });
      results.push(result);
      continue;
    }

    // Check 2: Credentials (check config values first, then env vars)
    const mcpConfig = config.mcpServers[mcpName];
    if (mcp.requiredEnv && mcp.requiredEnv.length > 0) {
      // First check if credentials are configured in .mcp.json
      const hasConfigCreds = hasConfiguredCredentials(mcpConfig);

      if (hasConfigCreds) {
        result.checks.push({
          name: 'Credentials',
          passed: true,
          message: 'Configured in .mcp.json',
        });
      } else {
        // Fall back to checking environment variables
        const { missing, present } = checkRequiredEnv(mcp.requiredEnv);

        if (missing.length > 0) {
          result.status = 'error';
          result.checks.push({
            name: 'Credentials',
            passed: false,
            message: `Missing: ${missing.join(', ')}`,
          });
        } else {
          result.checks.push({
            name: 'Credentials',
            passed: true,
            message: `All required set (${present.join(', ')})`,
          });
        }
      }
    } else if (!mcp.setupHint) {
      result.checks.push({
        name: 'Credentials',
        passed: true,
        message: 'No credentials required',
      });
    }

    // Check 3: Browser authentication
    if (mcp.setupHint) {
      result.checks.push({
        name: 'Auth status',
        passed: true,
        message: 'Check in Claude Code (/mcp)',
      });
    }

    // Check 4: Optional credentials (check from actual config)
    if (mcp.optionalEnv && mcp.optionalEnv.length > 0) {
      for (const envVar of mcp.optionalEnv) {
        // Check if value is set in config headers or env
        const headerValue = mcpConfig.headers?.[envVar];
        const isConfigured = headerValue && headerValue.length > 0;

        result.checks.push({
          name: 'API Key',
          passed: true,
          message: isConfigured ? 'configured' : 'not set (optional)',
        });
      }
    }

    // Check 5: Validation (connection test)
    if (mcp.validate) {
      const spinner = ora(`  Validating ${mcpName}...`).start();
      try {
        // Set env vars from config so validate functions can read them
        setEnvFromConfig(mcpConfig);
        const validationResult = await mcp.validate();
        spinner.stop();

        if (validationResult.valid) {
          result.checks.push({
            name: 'Connection',
            passed: true,
            message: validationResult.message,
          });
        } else {
          if (result.status === 'healthy') {
            result.status = 'warning';
          }
          result.checks.push({
            name: 'Connection',
            passed: false,
            message: validationResult.message,
          });
        }
      } catch (error) {
        spinner.stop();
        if (result.status === 'healthy') {
          result.status = 'warning';
        }
        result.checks.push({
          name: 'Connection',
          passed: false,
          message: `Validation error: ${String(error)}`,
        });
      }
    }

    results.push(result);
  }

  // Print results
  let healthyCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  for (const result of results) {
    const statusIcon =
      result.status === 'healthy'
        ? chalk.green('✓')
        : result.status === 'warning'
          ? chalk.yellow('!')
          : chalk.red('✗');

    const statusColor =
      result.status === 'healthy'
        ? chalk.green
        : result.status === 'warning'
          ? chalk.yellow
          : chalk.red;

    console.log(statusColor(`${statusIcon} ${result.mcp}`));

    for (const check of result.checks) {
      const checkIcon = check.passed ? chalk.green('  ✓') : chalk.red('  ✗');
      console.log(`${checkIcon} ${check.name}: ${chalk.gray(check.message)}`);
    }

    console.log();

    if (result.status === 'healthy') healthyCount++;
    else if (result.status === 'warning') warningCount++;
    else errorCount++;
  }

  // Summary
  console.log(chalk.bold('Summary:'));
  console.log(chalk.green(`  ${healthyCount} healthy`));
  if (warningCount > 0) {
    console.log(chalk.yellow(`  ${warningCount} warning(s)`));
  }
  if (errorCount > 0) {
    console.log(chalk.red(`  ${errorCount} error(s)`));
  }
  console.log();

  if (errorCount > 0) {
    console.log(chalk.red('Some MCPs have errors. Fix the issues above for best experience.\n'));
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(chalk.yellow('Some MCPs have warnings but should still work.\n'));
  } else {
    console.log(chalk.green('All MCPs are healthy!\n'));
  }
}
