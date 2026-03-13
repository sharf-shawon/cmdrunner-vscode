# Security Model

## Workspace Trust Gate

cmdRunner respects VS Code's workspace trust system. When `security.requireWorkspaceTrust` is `true` (the default), the extension will refuse to execute any commands in untrusted workspaces.

## Blocked Patterns

The `security.blockedPatterns` array accepts regular expression strings. Any command that matches one of these patterns is rejected at runtime, and the attempt is recorded in the audit log with action `security_violation`.

Example patterns:
```json
{
  "security": {
    "blockedPatterns": [
      "rm\\s+-rf\\s+/",
      "sudo\\s+rm",
      "curl.*\\|.*sh",
      "wget.*\\|.*sh"
    ]
  }
}
```

## Config File Checksums

To prevent tampered configurations from being loaded, you can pin the SHA-256 checksum of your `.cmdrunner` file:

```json
{
  "security": {
    "checksums": {
      ".cmdrunner": "abc123...sha256hex..."
    }
  }
}
```

## Secret Masking

When `security.maskSecrets` is `true` (default), the following patterns are redacted from audit log entries:

| Pattern | Example | Masked As |
|---------|---------|-----------|
| `sk-[A-Za-z0-9]{20,}` | OpenAI API key | `[REDACTED]` |
| `ghp_[A-Za-z0-9]{36,}` | GitHub PAT | `[REDACTED]` |

## Audit Logging

All significant events are written to `~/.cmdrunner/audit.log` (or a custom path) as newline-delimited JSON:

```json
{"timestamp":"2024-01-15T10:30:00.000Z","action":"command_executed","commandId":"build","commandText":"npm run build","workspaceFolder":"/home/user/project"}
```

### Audit Event Types

| Action | Description |
|--------|-------------|
| `extension_activated` | Extension started |
| `extension_deactivated` | Extension stopped |
| `config_loaded` | Configuration file loaded |
| `command_executed` | A command button was clicked |
| `profile_switched` | Active profile changed |
| `security_violation` | A blocked command was attempted |

## No child_process

cmdRunner **never** uses `child_process.exec()` or `child_process.spawn()`. All command execution goes through VS Code's `terminal.sendText()` API. This means:
- Commands run in the user's visible terminal, not in a hidden background process
- The user always sees what is running
- No silent execution vectors exist in the extension itself

## Reporting Vulnerabilities

See [SECURITY.md](../SECURITY.md) for the vulnerability disclosure policy.
