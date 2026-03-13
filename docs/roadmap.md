# Roadmap

## v0.1.0 — Foundation (Current)

- [x] Status bar command buttons
- [x] JSONC configuration with Zod validation
- [x] Environment profiles
- [x] Startup command orchestration (sequential/parallel)
- [x] Hot reload on config change
- [x] Workspace trust gate
- [x] Secret masking in audit logs
- [x] Variable interpolation (${workspaceFolder}, ${env:VAR}, ${gitBranch}, etc.)
- [x] VS Code Task provider integration
- [x] Onboarding walkthrough
- [x] Audit logging to ~/.cmdrunner/audit.log

## v0.2.0 — Enhanced UX

- [ ] YAML configuration support (in addition to JSONC)
- [ ] Command groups and separators in status bar
- [ ] Command history and quick replay
- [ ] Status bar button badges (running indicator)
- [ ] Multi-root workspace per-folder configuration
- [ ] Command output capture to output channel

## v0.3.0 — Advanced Security

- [ ] GPG-signed config files
- [ ] Secret scanning integration with GitHub Advanced Security
- [ ] Command argument sanitization
- [ ] Per-command environment isolation

## v0.4.0 — Team Features

- [ ] Shared team configuration via remote URLs
- [ ] Config diff viewer for team sync
- [ ] Command documentation tooltips with markdown support
- [ ] Role-based command visibility

## v1.0.0 — Marketplace Release

- [ ] Full test suite at ≥90% coverage
- [ ] VS Code Marketplace publication
- [ ] Internationalization (i18n) via @vscode/l10n
- [ ] Complete documentation website
- [ ] Video walkthrough
