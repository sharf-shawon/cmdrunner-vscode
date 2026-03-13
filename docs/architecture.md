# cmdRunner Architecture

## Overview

cmdRunner is a VS Code extension that provides clickable status bar buttons for running terminal commands. It is designed to be secure, team-friendly, and AI-agent-ready.

## Module Interactions

```
extension.ts (activation)
├── configLoader.ts     ─── Reads & validates .cmdrunner (Zod)
├── security.ts         ─── Workspace trust, blocked patterns, checksums, secret masking
├── auditLog.ts         ─── Append-only audit log (~/.cmdrunner/audit.log)
├── variableResolver.ts ─── ${workspaceFolder}, ${env:VAR}, ${gitBranch}, ...
├── profileManager.ts   ─── Profile switching, merged env vars
├── statusBar.ts        ─── Status bar buttons lifecycle & cooldown
├── terminalRunner.ts   ─── terminal.sendText() execution only
├── startupRunner.ts    ─── Sequential/parallel startup orchestration
├── taskBridge.ts       ─── VS Code Task provider
└── walkthrough.ts      ─── Onboarding walkthrough
```

## Security Boundaries

1. **Workspace Trust Gate**: The extension refuses to run any commands in untrusted workspaces (when `requireWorkspaceTrust: true`).
2. **Blocked Patterns**: Commands matching any regex in `security.blockedPatterns` are rejected at runtime.
3. **Checksum Verification**: The config file checksum can be pinned in `security.checksums` to prevent tampering.
4. **Secret Masking**: Patterns like `sk-*`, `ghp_*` are redacted from audit logs.
5. **No child_process**: All command execution uses `terminal.sendText()` exclusively — no shell injection vectors via Node.js child_process APIs.

## Data Flow

1. VS Code activates extension when `.cmdrunner` exists in workspace root.
2. `configLoader` reads and validates the file with Zod.
3. `security` checks workspace trust and config checksum.
4. `profileManager` activates the default (or saved) profile.
5. `statusBar` creates status bar items for each command.
6. User clicks a button → `terminalRunner.run()` is called.
7. Variable resolution, security checks, cooldown check happen.
8. Command is sent to terminal via `sendText()`.
9. Audit entry is written.

## Multi-Root Workspace Support

The extension loads configuration from the first workspace folder. Each workspace folder can have its own `.cmdrunner` configuration. Hot reload is supported via `FileSystemWatcher`.

## Hot Reload

When `.cmdrunner` changes on disk, the `FileSystemWatcher` fires and the configuration is reloaded. Status bar items are updated in place without restarting the extension.
