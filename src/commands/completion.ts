import chalk from 'chalk';

const COMMANDS = ['init', 'add', 'remove', 'list', 'stacks', 'detect', 'doctor', 'update', 'completion'];
const STACKS = ['fullstack', 'saas-ts', 'automation', 'ai-builder'];
const MCPS = ['supabase', 'vercel', 'github', 'context7', 'playwright', 'puppeteer', 'chrome-devtools'];
const LIST_TYPES = ['stacks', 'mcps', 'configured'];

/**
 * Generate bash completion script
 */
export function generateBashCompletion(): string {
  return `# mcp-stack bash completion
# Add this to your ~/.bashrc or ~/.bash_profile

_mcp_stack_completions() {
    local cur prev commands stacks mcps list_types
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    commands="${COMMANDS.join(' ')}"
    stacks="${STACKS.join(' ')}"
    mcps="${MCPS.join(' ')}"
    list_types="${LIST_TYPES.join(' ')}"

    case "\${prev}" in
        mcp-stack)
            COMPREPLY=( \$(compgen -W "\${commands}" -- "\${cur}") )
            return 0
            ;;
        init)
            COMPREPLY=( \$(compgen -W "\${stacks} --detect --force" -- "\${cur}") )
            return 0
            ;;
        add)
            COMPREPLY=( \$(compgen -W "\${mcps} --force" -- "\${cur}") )
            return 0
            ;;
        remove)
            COMPREPLY=( \$(compgen -W "\${mcps} --all --stack --force" -- "\${cur}") )
            return 0
            ;;
        list)
            COMPREPLY=( \$(compgen -W "\${list_types}" -- "\${cur}") )
            return 0
            ;;
        --stack)
            COMPREPLY=( \$(compgen -W "\${stacks}" -- "\${cur}") )
            return 0
            ;;
        completion)
            COMPREPLY=( \$(compgen -W "bash zsh" -- "\${cur}") )
            return 0
            ;;
    esac

    COMPREPLY=()
}

complete -F _mcp_stack_completions mcp-stack
`;
}

/**
 * Generate zsh completion script
 */
export function generateZshCompletion(): string {
  return `#compdef mcp-stack
# mcp-stack zsh completion
# Add this to your ~/.zshrc or place in your fpath

_mcp_stack() {
    local -a commands stacks mcps list_types

    commands=(
        'init:Initialize MCP configuration with a stack template'
        'add:Add MCP(s) to the configuration'
        'remove:Remove MCP(s) from the configuration'
        'list:List available stacks, MCPs, or configured MCPs'
        'stacks:Browse stacks and view MCPs in each stack'
        'detect:Detect project type and suggest MCPs (beta)'
        'doctor:Check MCP configurations and validate connections'
        'update:Check for new versions'
        'completion:Generate shell completion scripts'
    )

    stacks=(${STACKS.map((s) => `'${s}'`).join(' ')})
    mcps=(${MCPS.map((m) => `'${m}'`).join(' ')})
    list_types=('stacks' 'mcps' 'configured')

    case "\$words[2]" in
        init)
            _arguments \\
                '--detect[Auto-detect project type]' \\
                '--force[Overwrite existing config]' \\
                '1:stack:(\${stacks})'
            ;;
        add)
            _arguments \\
                '--force[Overwrite if already configured]' \\
                '*:mcp:(\${mcps})'
            ;;
        remove)
            _arguments \\
                '--all[Remove all MCPs]' \\
                '--stack[Remove stack MCPs]:stack:(\${stacks})' \\
                '--force[Skip confirmation]' \\
                '1:mcp:(\${mcps})'
            ;;
        list)
            _arguments '1:type:(\${list_types})'
            ;;
        completion)
            _arguments '1:shell:(bash zsh)'
            ;;
        *)
            _describe -t commands 'mcp-stack commands' commands
            ;;
    esac
}

_mcp_stack "\$@"
`;
}

/**
 * Output shell completion script
 */
export async function completion(shell?: string): Promise<void> {
  if (!shell) {
    console.log(chalk.bold('\nGenerate shell completion scripts\n'));
    console.log('Usage:');
    console.log(chalk.cyan('  mcp-stack completion bash') + chalk.gray('  # Bash completion'));
    console.log(chalk.cyan('  mcp-stack completion zsh') + chalk.gray('   # Zsh completion'));
    console.log();
    console.log('Installation:');
    console.log(chalk.gray('  # Bash - add to ~/.bashrc:'));
    console.log(chalk.cyan('  eval "$(mcp-stack completion bash)"'));
    console.log();
    console.log(chalk.gray('  # Zsh - add to ~/.zshrc:'));
    console.log(chalk.cyan('  eval "$(mcp-stack completion zsh)"'));
    console.log();
    return;
  }

  switch (shell.toLowerCase()) {
    case 'bash':
      console.log(generateBashCompletion());
      break;
    case 'zsh':
      console.log(generateZshCompletion());
      break;
    default:
      console.log(chalk.red(`Unknown shell: ${shell}`));
      console.log(chalk.gray('Supported shells: bash, zsh'));
  }
}
