/**
 * Expand environment variables in a string
 * Supports ${VAR} and ${VAR:-default} syntax
 */
export function expandEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, expr) => {
    const [varName, defaultValue] = expr.split(':-');
    return process.env[varName] ?? defaultValue ?? '';
  });
}

/**
 * Check if required environment variables are set
 */
export function checkRequiredEnv(required: string[]): {
  missing: string[];
  present: string[];
} {
  const missing: string[] = [];
  const present: string[] = [];

  for (const varName of required) {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  }

  return { missing, present };
}

/**
 * Get environment variable value or undefined
 */
export function getEnv(name: string): string | undefined {
  return process.env[name];
}

/**
 * Mask a sensitive value for display
 */
export function maskValue(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars) {
    return '*'.repeat(value.length);
  }
  return value.slice(0, visibleChars) + '*'.repeat(Math.min(8, value.length - visibleChars));
}
