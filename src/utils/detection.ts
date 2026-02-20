import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { DetectionRule } from '../types/index.js';

// Detection rules for suggesting MCPs
const detectionRules: DetectionRule[] = [
  // Vercel
  { files: ['next.config.js', 'next.config.ts', 'next.config.mjs', 'vercel.json'], suggest: ['vercel'] },

  // Supabase
  { files: ['supabase/config.toml', 'supabase/.gitignore'], suggest: ['supabase'] },
  { dependencies: ['@supabase/supabase-js', '@supabase/ssr'], suggest: ['supabase'] },

  // Playwright
  { files: ['playwright.config.ts', 'playwright.config.js'], suggest: ['playwright'] },
  { dependencies: ['@playwright/test', 'playwright'], suggest: ['playwright'] },

  // Puppeteer
  { files: ['puppeteer.config.js', 'puppeteer.config.ts'], suggest: ['puppeteer'] },
  { dependencies: ['puppeteer', 'puppeteer-core'], suggest: ['puppeteer'] },

  // GitHub
  { files: ['.github/workflows', '.github'], suggest: ['github'] },

  // Chrome DevTools (often used with puppeteer/playwright)
  { dependencies: ['puppeteer', 'playwright'], suggest: ['chrome-devtools'] },
];

/**
 * Check if a file or directory exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read package.json dependencies
 */
async function getPackageDependencies(dir: string): Promise<string[]> {
  try {
    const pkgPath = join(dir, 'package.json');
    const content = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);
    return [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ];
  } catch {
    return [];
  }
}

/**
 * Detect project type and suggest MCPs
 */
export async function detectProjectMcps(dir: string = process.cwd()): Promise<{
  detected: { type: string; reason: string }[];
  suggested: string[];
}> {
  const detected: { type: string; reason: string }[] = [];
  const suggestedSet = new Set<string>();

  const dependencies = await getPackageDependencies(dir);

  for (const rule of detectionRules) {
    // Check files
    if (rule.files) {
      for (const file of rule.files) {
        const filePath = join(dir, file);
        if (await fileExists(filePath)) {
          for (const mcp of rule.suggest) {
            if (!suggestedSet.has(mcp)) {
              detected.push({ type: mcp, reason: `Found ${file}` });
              suggestedSet.add(mcp);
            }
          }
        }
      }
    }

    // Check dependencies
    if (rule.dependencies) {
      for (const dep of rule.dependencies) {
        if (dependencies.includes(dep)) {
          for (const mcp of rule.suggest) {
            if (!suggestedSet.has(mcp)) {
              detected.push({ type: mcp, reason: `Found dependency ${dep}` });
              suggestedSet.add(mcp);
            }
          }
        }
      }
    }
  }

  return {
    detected,
    suggested: Array.from(suggestedSet),
  };
}

/**
 * Suggest a stack based on detected MCPs
 */
export function suggestStack(detectedMcps: string[]): string | null {
  const has = (mcp: string) => detectedMcps.includes(mcp);

  // SaaS stack: supabase + vercel
  if (has('supabase') && has('vercel')) {
    return 'saas-ts';
  }

  // Automation stack: playwright or puppeteer
  if (has('playwright') || has('puppeteer')) {
    return 'automation';
  }

  // AI builder: vercel or supabase alone
  if (has('vercel') || has('supabase')) {
    return 'ai-builder';
  }

  return null;
}
