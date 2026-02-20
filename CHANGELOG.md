# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.5] - 2025-02-20

### Removed
- Shell completion command (was beta, not stable enough)

## [0.1.4] - 2025-02-20

### Added
- `fullstack` stack template with 5 MCPs (supabase, vercel, github, context7, playwright)
- `update` command to check for new versions from npm registry

### Changed
- Improved `detect` command accuracy with more detection rules
  - Added Remix, Astro, SvelteKit, Nuxt framework detection
  - Added Context7 detection for documentation-heavy projects
  - Added TypeScript project detection
- Better stack suggestions with scoring system
  - Now suggests `fullstack` when 4+ MCPs match
  - Improved prioritization of stack matches

## [0.1.3] - 2025-02-20

### Added
- Numbered list format for stack and MCP selection prompts
- Numbered list format for `list stacks` and `list mcps` output
- Beta Features section in README for experimental commands

### Changed
- Marked `detect` command as beta
- Consolidated VERSION constant to single source
- Moved `detect` command documentation to Beta Features section

### Fixed
- Doctor command now reads credentials from `.mcp.json` config (not just env vars)
- Connection validation now works with credentials stored in config
- Version display now shows correct version in CLI header

## [0.1.2] - 2025-02-20

### Fixed
- Doctor command credential checking to read from config values first
- Added GITHUB_TOKEN alias when reading GITHUB_PERSONAL_ACCESS_TOKEN
- Added SUPABASE_PROJECT_REF extraction from args

## [0.1.1] - 2025-02-20

### Added
- Security warning in README about adding `.mcp.json` to `.gitignore`
- Security warning in CLI output after `init` and `add` commands

### Fixed
- Doctor command to check `.mcp.json` config values before falling back to env vars

## [0.1.0] - 2025-02-20

### Added
- Initial release
- `init` command - Initialize MCP configuration with stack templates
- `add` command - Add individual MCPs to configuration
- `remove` command - Remove MCPs from configuration
- `list` command - List stacks, MCPs, or configured MCPs
- `stacks` command - Interactive stack browser
- `detect` command - Auto-detect project type (beta)
- `doctor` command - Health check for MCP configurations

### Stack Templates
- `saas-ts` - SaaS stack for TypeScript (supabase, vercel, github)
- `automation` - Browser automation (playwright, puppeteer, chrome-devtools)
- `ai-builder` - AI builder stack (context7, supabase, vercel)

### MCPs
- supabase - Database and auth operations
- vercel - Deployment and project management
- github - Repository operations
- context7 - Documentation and context lookup
- playwright - Browser automation
- puppeteer - Browser automation
- chrome-devtools - Browser debugging

[Unreleased]: https://github.com/seenu30/mcp-stack-manager/compare/v0.1.5...HEAD
[0.1.5]: https://github.com/seenu30/mcp-stack-manager/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/seenu30/mcp-stack-manager/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/seenu30/mcp-stack-manager/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/seenu30/mcp-stack-manager/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/seenu30/mcp-stack-manager/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/seenu30/mcp-stack-manager/releases/tag/v0.1.0
