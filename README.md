# cmdRunner

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/sharf-shawon.cmdrunner-vscode?label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=sharf-shawon.cmdrunner-vscode)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/sharf-shawon.cmdrunner-vscode)](https://marketplace.visualstudio.com/items?itemName=sharf-shawon.cmdrunner-vscode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/sharf-shawon/cmdrunner-vscode/actions/workflows/ci.yml/badge.svg)](https://github.com/sharf-shawon/cmdrunner-vscode/actions/workflows/ci.yml)

A VS Code extension that allows developers to configure and run terminal commands directly from clickable buttons in the status bar. **Secure**, **team-friendly**, and **AI-agent-ready**.

## Quick Start

1. Install the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=sharf-shawon.cmdrunner-vscode)
2. Open a workspace and run **cmdRunner: Open Walkthrough** (`Ctrl+Shift+P`)
3. A `.cmdrunner` template will be created — edit it with your commands
4. Click the buttons in the status bar to run commands!

Or create `.cmdrunner` manually at your workspace root:

```json
{
  "version": "1",
  "commands": [
    {
      "id": "build",
      "label": "Build",
      "command": "npm run build",
      "icon": "tools"
    }
  ]
}
```

## Full Configuration Reference

See [docs/configuration-reference.md](docs/configuration-reference.md) for the complete field reference.

### Minimal Example

```json
{
  "version": "1",
  "commands": [{ "id": "build", "label": "Build", "command": "npm run build" }]
}
```

### Full Example

```json
{
  "version": "1",
  "commands": [
    {
      "id": "build",
      "label": "Build",
      "command": "npm run build",
      "icon": "tools",
      "tooltip": "Compile the project",
      "cooldownMs": 2000,
      "alignment": "left",
      "priority": 100
    }
  ],
  "profiles": {
    "dev": { "name": "Development", "env": { "NODE_ENV": "development" } },
    "prod": { "name": "Production", "env": { "NODE_ENV": "production" } }
  },
  "activeProfile": "dev",
  "startup": { "commands": ["build"], "parallel": false, "delayMs": 500 },
  "security": { "requireWorkspaceTrust": true, "maskSecrets": true },
  "globalEnv": { "PROJECT": "my-app" }
}
```

## Startup Commands

Commands can run automatically when the workspace opens:

```json
{
  "startup": {
    "commands": ["build", "lint"],
    "parallel": true,
    "delayMs": 1000
  }
}
```

## Environment Profiles

Switch between environments with a single command (**cmdRunner: Switch Profile**):

```json
{
  "profiles": {
    "dev": {
      "name": "Development",
      "env": { "NODE_ENV": "development", "API_URL": "http://localhost:3000" },
      "description": "Local development"
    },
    "staging": {
      "name": "Staging",
      "env": { "NODE_ENV": "production", "API_URL": "https://staging.example.com" },
      "description": "Staging environment"
    }
  },
  "activeProfile": "dev"
}
```

## Display Modes

Control how buttons appear in the status bar:

| Mode               | Example          |
| ------------------ | ---------------- |
| `"both"` (default) | `$(tools) Build` |
| `"icon"`           | `$(tools)`       |
| `"text"`           | `Build`          |

```json
{
  "display": { "mode": "both" }
}
```

> **Screenshot**: Status bar buttons appear at the bottom of VS Code, customizable by icon, label, color, and alignment.

## Terminal Profiles

Use a specific shell for a command:

```json
{
  "commands": [
    {
      "id": "powershell-build",
      "label": "PS Build",
      "command": "& npm run build",
      "terminalProfile": "PowerShell"
    }
  ]
}
```

## Variable Interpolation

Variables are resolved at runtime:

| Variable                     | Description                  |
| ---------------------------- | ---------------------------- |
| `${workspaceFolder}`         | Absolute workspace root path |
| `${workspaceFolderBasename}` | Workspace folder name        |
| `${file}`                    | Currently open file path     |
| `${fileBasename}`            | Open file name               |
| `${fileDirname}`             | Directory of open file       |
| `${fileExtname}`             | Extension of open file       |
| `${gitBranch}`               | Current git branch           |
| `${env:VAR}`                 | Environment variable         |
| `${config:section.key}`      | VS Code setting              |
| `${date}`                    | Current date (YYYY-MM-DD)    |
| `${time}`                    | Current time (HH:MM:SS)      |
| `${datetime}`                | Current datetime (ISO 8601)  |

Example:

```json
{ "command": "echo Building ${workspaceFolderBasename} on branch ${gitBranch}" }
```

## Security Model

cmdRunner is designed with security as a first-class concern:

- **Workspace Trust**: Respects VS Code's workspace trust — commands won't run in untrusted workspaces
- **Blocked Patterns**: Regex blocklist prevents dangerous commands from executing
- **No Background Processes**: All execution uses `terminal.sendText()` — nothing runs hidden
- **Secret Masking**: API keys and tokens are redacted from audit logs
- **Checksum Verification**: Pin your config file to a SHA-256 checksum
- **Audit Log**: All executions logged to `~/.cmdrunner/audit.log`

See [docs/security.md](docs/security.md) for full details.

## VS Code Task Bridge

cmdRunner commands are automatically exposed as VS Code Tasks:

1. Open the Command Palette → **Tasks: Run Task**
2. Select **cmdRunner** task group
3. Choose any configured command

This enables integration with VS Code's problem matchers, task dependencies, and keyboard shortcuts.

## AI Agent Onboarding

This project is AI-agent-ready. Before working on the codebase:

1. Read [`docs/agent-knowledge-base.md`](docs/agent-knowledge-base.md) for accumulated learnings
2. Review [`docs/architecture.md`](docs/architecture.md) for module interactions
3. Check [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for mandatory rules
4. Review your role in [`.agents.md`](.agents.md)

**Key Agent Rules**:

- Never use `child_process` — only `terminal.sendText()`
- Zero `any` TypeScript types
- Update `docs/` when changing `src/`
- Append learnings to `docs/agent-knowledge-base.md`

## Contributing Guide

See [docs/contributing.md](docs/contributing.md) for the full guide.

### Quick Start for Contributors

```bash
git clone https://github.com/sharf-shawon/cmdrunner-vscode
cd cmdrunner-vscode
npm install
npm run compile
npm test
```

If you are developing in Docker or GitHub Codespaces, this repository also includes a ready-to-use dev container in `.devcontainer/` with the Electron test dependencies preinstalled. Open the repo in VS Code and run `Dev Containers: Reopen in Container`.

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format.

## License

[MIT](LICENSE)
