# mcp-stack

A CLI tool for managing MCP (Model Context Protocol) server configurations in Claude Code. Define reusable stack templates and quickly configure MCPs for your projects.

## Features

- **Stack Templates** - Pre-configured MCP bundles for common workflows (SaaS, automation, AI apps)
- **Interactive Setup** - Guided credential prompts with hints for where to find each value
- **Project Detection** - Auto-detect project type and suggest relevant MCPs (beta)
- **Health Checks** - Validate MCP configurations and test connections
- **Simple CLI** - Add, remove, and manage MCPs with intuitive commands

## Installation

```bash
npm install -g mcp-stack
```

## Quick Start

```bash
# Initialize with a stack template
mcp-stack init saas-ts

# Or interactively select MCPs
mcp-stack init

# Add individual MCPs
mcp-stack add github
mcp-stack add supabase vercel

# Check configuration health
mcp-stack doctor
```

## Commands

### `init [stack]`
Initialize MCP configuration with a stack template.

```bash
mcp-stack init              # Interactive stack selection
mcp-stack init saas-ts      # Use specific stack
mcp-stack init --detect     # Auto-detect project type
mcp-stack init --force      # Overwrite existing config
```

### `add [mcp...]`
Add MCP(s) to the configuration.

```bash
mcp-stack add               # Interactive MCP selection
mcp-stack add github        # Add single MCP
mcp-stack add github vercel # Add multiple MCPs
mcp-stack add --force       # Overwrite if already configured
```

### `remove [mcp]`
Remove MCP(s) from the configuration.

```bash
mcp-stack remove            # Interactive removal
mcp-stack remove github     # Remove specific MCP
mcp-stack remove --all      # Remove all MCPs
mcp-stack remove --stack saas-ts  # Remove all MCPs from a stack
```

### `list [type]`
List available stacks, MCPs, or configured MCPs.

```bash
mcp-stack list              # List everything
mcp-stack list stacks       # List stack templates
mcp-stack list mcps         # List all available MCPs
mcp-stack list configured   # List MCPs in current project
```

### `stacks`
Interactive stack browser - select a stack to view its MCPs.

```bash
mcp-stack stacks
```

### `detect` (beta)
Detect project type and suggest MCPs based on your codebase.

```bash
mcp-stack detect
```

### `doctor`
Check MCP configurations and validate connections.

```bash
mcp-stack doctor
```

## Available Stacks

| Stack | Description | MCPs |
|-------|-------------|------|
| `saas-ts` | SaaS stack for TypeScript projects | supabase, vercel, github |
| `automation` | Browser automation stack | playwright, puppeteer, chrome-devtools |
| `ai-builder` | AI builder stack | context7, supabase, vercel |

## Available MCPs

| MCP | Description | Credentials |
|-----|-------------|-------------|
| `github` | GitHub repository operations | `GITHUB_TOKEN` |
| `supabase` | Supabase database and auth | `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN` |
| `vercel` | Vercel deployments | Browser auth |
| `context7` | Documentation and context lookup | Browser auth (API key optional) |
| `playwright` | Browser automation with Playwright | None |
| `puppeteer` | Browser automation with Puppeteer | None |
| `chrome-devtools` | Chrome DevTools Protocol | None |

## Configuration

mcp-stack creates a `.mcp.json` file in your project root. This file is automatically read by Claude Code.

> **Warning: Add `.mcp.json` to your `.gitignore`!**
>
> The `.mcp.json` file may contain API keys and credentials. Never commit it to version control.
> ```bash
> echo ".mcp.json" >> .gitignore
> ```

Example `.mcp.json`:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    },
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

## Verifying Setup

After configuration, verify your MCPs are working:

1. **In Claude Code CLI**: Run `claude mcp list`
2. **In Claude Code IDE**: Type `/mcp` to see MCP status
3. **With mcp-stack**: Run `mcp-stack doctor`

## Contributing

Contributions are welcome! Feel free to:

- Add new MCP definitions
- Create new stack templates
- Improve detection rules
- Fix bugs or improve documentation

## License

MIT
