# Changelog

All notable changes to cmdRunner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-01-15

### Added

- Status bar command buttons with configurable icons, labels, and colors
- JSONC configuration file (`.cmdrunner`) with Zod runtime validation
- Environment profiles with env var merging
- Startup command orchestration (sequential and parallel)
- Hot reload on `.cmdrunner` file changes
- Workspace trust gate (respects VS Code workspace trust)
- Secret masking in audit logs (`sk-*`, `ghp_*` patterns)
- Variable interpolation (`${workspaceFolder}`, `${env:VAR}`, `${gitBranch}`, etc.)
- VS Code Task provider integration
- Onboarding walkthrough
- Append-only audit logging to `~/.cmdrunner/audit.log`
- Rate limiting via `cooldownMs` per command
- JSON schema validation for `.cmdrunner` files
- Comprehensive documentation

[Unreleased]: https://github.com/sharf-shawon/cmdrunner-vscode/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/sharf-shawon/cmdrunner-vscode/releases/tag/v0.1.0
