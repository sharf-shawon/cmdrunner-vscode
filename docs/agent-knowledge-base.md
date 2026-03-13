# Agent Knowledge Base

This file stores learnings accumulated by AI agents working on the cmdRunner codebase.
Entries follow the format: `[YYYY-MM-DD][category] Description`.

---

## Entries

[2024-01-15][architecture] Extension activates only when `.cmdrunner` file exists in workspace root (via `workspaceContains:.cmdrunner` activation event). This prevents unnecessary activation in workspaces without config.

[2024-01-15][security] All command execution uses `terminal.sendText()` exclusively. Never use `child_process.exec()` or `spawn()` — this is a hard requirement enforced by security policy and must not be changed.

[2024-01-15][testing] Tests run in VS Code Extension Test environment via `@vscode/test-electron`. The `vscode` module is available in tests as a real module injection. Use `suite()`/`test()` from Mocha's TDD interface.

[2024-01-15][config] The `.cmdrunner` file is JSONC (JSON with comments). The `stripJsonComments()` function in `configLoader.ts` handles comment removal before JSON parsing. Zod schemas in `types.ts` do all runtime validation.

[2024-01-15][schemas] When adding new config fields: (1) update `types.ts` Zod schema, (2) update `.vscode/cmdrunner.schema.json`, (3) update `docs/configuration-reference.md`. Keep all three in sync.

[2024-01-15][audit] Audit log entries are newline-delimited JSON written to `~/.cmdrunner/audit.log`. Secrets are masked before writing. Log rotates when file exceeds `maxSizeBytes` (default 10 MB).

[2024-01-15][variables] Variable resolver supports: `${workspaceFolder}`, `${workspaceFolderBasename}`, `${file}`, `${fileBasename}`, `${fileDirname}`, `${fileExtname}`, `${gitBranch}`, `${env:VAR}`, `${config:section.key}`, `${date}`, `${time}`, `${datetime}`.

[2024-01-15][profiles] Profile env vars override globalEnv. `getMergedEnv()` returns `{...globalEnv, ...profileEnv}`. Profile switching logs to audit and shows VS Code info message.

[2024-01-15][conventions] Conventional Commits required for all commits. Allowed prefixes: feat, fix, docs, chore, test, refactor, perf, ci, build, style.
