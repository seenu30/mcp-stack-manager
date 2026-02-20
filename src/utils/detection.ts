import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { DetectionRule } from '../types/index.js';

// Detection rules for suggesting MCPs
const detectionRules: DetectionRule[] = [
  // Vercel - Next.js, Remix, Astro, SvelteKit, Nuxt
  { files: ['next.config.js', 'next.config.ts', 'next.config.mjs', 'vercel.json'], suggest: ['vercel'] },
  { files: ['remix.config.js', 'remix.config.ts'], suggest: ['vercel'] },
  { files: ['astro.config.mjs', 'astro.config.ts'], suggest: ['vercel'] },
  { files: ['svelte.config.js'], suggest: ['vercel'] },
  { files: ['nuxt.config.ts', 'nuxt.config.js'], suggest: ['vercel'] },
  { dependencies: ['next', '@remix-run/react', 'astro', '@sveltejs/kit', 'nuxt'], suggest: ['vercel'] },

  // Supabase
  { files: ['supabase/config.toml', 'supabase/.gitignore'], suggest: ['supabase'] },
  { dependencies: ['@supabase/supabase-js', '@supabase/ssr', '@supabase/auth-helpers-nextjs'], suggest: ['supabase'] },

  // Playwright
  { files: ['playwright.config.ts', 'playwright.config.js'], suggest: ['playwright'] },
  { dependencies: ['@playwright/test', 'playwright'], suggest: ['playwright'] },

  // Puppeteer
  { files: ['puppeteer.config.js', 'puppeteer.config.ts'], suggest: ['puppeteer'] },
  { dependencies: ['puppeteer', 'puppeteer-core'], suggest: ['puppeteer'] },

  // GitHub - Git repo or workflows
  { files: ['.github/workflows', '.github', '.git'], suggest: ['github'] },

  // Context7 - Documentation-heavy projects
  { files: ['docs', 'documentation', 'wiki', 'API.md', 'ARCHITECTURE.md'], suggest: ['context7'] },
  { dependencies: ['typedoc', 'jsdoc', 'docusaurus', 'vitepress', 'nextra'], suggest: ['context7'] },

  // TypeScript projects - suggest github for version control
  { files: ['tsconfig.json'], suggest: ['github'] },
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
 * Uses scoring to pick the best matching stack
 */
export function suggestStack(detectedMcps: string[]): string | null {
  const has = (mcp: string) => detectedMcps.includes(mcp);
  const count = (...mcps: string[]) => mcps.filter(has).length;

  // Fullstack: supabase + vercel + (playwright OR github) + context7
  // Most comprehensive - prioritize if many matches
  const fullstackScore = count('supabase', 'vercel', 'github', 'context7', 'playwright');
  if (fullstackScore >= 4) {
    return 'fullstack';
  }

  // SaaS stack: supabase + vercel (+ github)
  if (has('supabase') && has('vercel')) {
    return 'saas-ts';
  }

  // Automation stack: playwright or puppeteer (browser automation focus)
  if ((has('playwright') || has('puppeteer')) && !has('supabase') && !has('vercel')) {
    return 'automation';
  }

  // AI builder: context7 + (vercel OR supabase)
  if (has('context7') && (has('vercel') || has('supabase'))) {
    return 'ai-builder';
  }

  // Fallback to ai-builder for single vercel/supabase
  if (has('vercel') || has('supabase')) {
    return 'ai-builder';
  }

  return null;
}
