# MCP Stack Manager

A CLI tool for managing MCP (Model Context Protocol) server configurations for Claude Code. Initialize projects with pre-configured stack templates, auto-detect project types, and validate your MCP connections.

## Installation

```bash
npm install -g mcp-stack
```

Or use npx:

```bash
npx mcp-stack init
```

## Quick Start

```bash
# Initialize with a stack template
mcp-stack init saas-ts

# Or auto-detect your project
mcp-stack init --detect

# Or select interactively
mcp-stack init
```

## Commands

### `mcp-stack init [stack]`

Initialize MCP configuration with a stack template or interactively.

```bash
mcp-stack init              # Interactive mode
mcp-stack init saas-ts      # Use saas-ts stack
mcp-stack init --detect     # Auto-detect project type
mcp-stack init --force      # Overwrite existing config
```

### `mcp-stack add <mcp...>`

Add individual MCP(s) to your configuration.

```bash
mcp-stack add playwright
mcp-stack add supabase vercel github
```

### `mcp-stack list [type]`

List available stacks, MCPs, or configured MCPs.

```bash
mcp-stack list           # Show everything
mcp-stack list stacks    # Show stack templates
mcp-stack list mcps      # Show available MCPs
mcp-stack list configured # Show configured MCPs
```

### `mcp-stack detect`

Detect your project type and get MCP suggestions.

```bash
mcp-stack detect
```

### `mcp-stack doctor`

Check your MCP configurations and validate connections.

```bash
mcp-stack doctor
```

## Stack Templates

### saas-ts

SaaS stack for TypeScript projects.

- supabase
- vercel
- github

### automation

Browser automation stack.

- playwright
- puppeteer
- chrome-devtools

### ai-builder

AI builder stack.

- context7
- supabase
- vercel

## Available MCPs

| MCP | Description | Required Env |
|-----|-------------|--------------|
| supabase | Supabase database and auth | `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN` |
| vercel | Vercel deployment | None (browser auth) |
| github | GitHub repository operations | `GITHUB_TOKEN` |
| playwright | Browser automation | None |
| puppeteer | Browser automation | None |
| chrome-devtools | Browser debugging | None |
| context7 | Documentation lookup | None |

## Environment Variables

Some MCPs require environment variables. Set them before running Claude Code:

```bash
export SUPABASE_PROJECT_REF=your-project-ref
export SUPABASE_ACCESS_TOKEN=your-access-token
export GITHUB_TOKEN=your-github-token
```

Or add them to a `.env` file in your project root.

## Output

The tool generates a `.mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref=..."],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "..."
      }
    },
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com"
    }
  }
}
```

This file is read by Claude Code to configure MCP servers.

## License

MIT
