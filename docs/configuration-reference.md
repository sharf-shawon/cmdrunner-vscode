# Configuration Reference

The `.cmdrunner` file is a JSONC (JSON with comments) file placed at the root of your workspace.

## Root Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `version` | `string` | `"1"` | Schema version |
| `commands` | `Command[]` | `[]` | Array of command button definitions |
| `profiles` | `Record<string, Profile>` | `{}` | Named environment profiles |
| `activeProfile` | `string` | `"default"` | Profile to activate on startup |
| `startup` | `StartupConfig` | — | Startup command configuration |
| `security` | `SecurityConfig` | — | Security settings |
| `audit` | `AuditConfig` | — | Audit logging settings |
| `display` | `DisplayConfig` | — | Display settings |
| `globalEnv` | `Record<string, string>` | `{}` | Global environment variables |

## Command Object

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | `string` | required | Unique identifier |
| `label` | `string` | required | Status bar button label |
| `command` | `string` | required | Shell command to execute |
| `tooltip` | `string` | — | Button tooltip text |
| `icon` | `string` | — | VS Code codicon name (e.g. `"play"`) |
| `color` | `string` | — | Status bar item color |
| `cooldownMs` | `number` | `0` | Minimum ms between executions |
| `profiles` | `string[]` | — | Show only in these profiles (all if omitted) |
| `runOnStartup` | `boolean` | `false` | Run automatically on startup |
| `terminalProfile` | `string` | — | Terminal shell profile to use |
| `reuseTerminal` | `boolean` | `true` | Reuse existing terminal by name |
| `alignment` | `"left"\|"right"` | `"left"` | Status bar alignment |
| `priority` | `number` | — | Status bar ordering priority |

## Profile Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Profile display name |
| `env` | `Record<string, string>` | Environment variables for this profile |
| `description` | `string` | Optional profile description |

## StartupConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `commands` | `string[]` | `[]` | Command IDs to run at startup |
| `parallel` | `boolean` | `false` | Run startup commands in parallel |
| `delayMs` | `number` | `0` | Delay before running startup commands |

## SecurityConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `blockedPatterns` | `string[]` | `[]` | Regex patterns — matching commands are blocked |
| `requireWorkspaceTrust` | `boolean` | `true` | Require VS Code workspace trust |
| `checksums` | `Record<string, string>` | `{}` | SHA-256 checksums per filename |
| `maskSecrets` | `boolean` | `true` | Mask secrets in audit logs |

## AuditConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable audit logging |
| `logPath` | `string` | `~/.cmdrunner/audit.log` | Custom log file path |
| `maxSizeBytes` | `number` | `10485760` | Max log size before rotation |

## DisplayConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `"icon"\|"text"\|"both"` | `"both"` | What to show on status bar buttons |
| `showCount` | `boolean` | `false` | Show command count badge |
| `statusBarAlignment` | `"left"\|"right"` | `"left"` | Overall status bar alignment |

## Example

```json
{
  "version": "1",
  "commands": [
    {
      "id": "build",
      "label": "Build",
      "command": "npm run build",
      "icon": "tools",
      "tooltip": "Run npm build",
      "cooldownMs": 2000
    },
    {
      "id": "test",
      "label": "Test",
      "command": "npm test",
      "icon": "beaker",
      "profiles": ["dev", "ci"]
    }
  ],
  "profiles": {
    "dev": {
      "name": "Development",
      "env": { "NODE_ENV": "development" },
      "description": "Local development environment"
    },
    "ci": {
      "name": "CI",
      "env": { "NODE_ENV": "test", "CI": "true" },
      "description": "Continuous integration environment"
    }
  },
  "activeProfile": "dev",
  "startup": {
    "commands": ["build"],
    "parallel": false,
    "delayMs": 500
  },
  "security": {
    "blockedPatterns": ["rm\\s+-rf\\s+/", "sudo\\s+rm"],
    "requireWorkspaceTrust": true,
    "maskSecrets": true
  },
  "globalEnv": {
    "PROJECT_NAME": "my-project"
  }
}
```
