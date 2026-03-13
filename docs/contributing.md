# Contributing to cmdRunner

## Development Setup

### Prerequisites

- Node.js 18+
- VS Code 1.85+
- Git

### Setup

```bash
git clone https://github.com/sharf-shawon/cmdrunner-vscode
cd cmdrunner-vscode
npm install
```

### Build

```bash
npm run compile
```

### Watch Mode

```bash
npm run watch
```

### Run Extension (Debug)

Press `F5` in VS Code to launch the Extension Development Host with the extension loaded.

## Testing

### Run Tests

```bash
npm test
```

Tests run in the VS Code Extension Test environment via `@vscode/test-electron`.

### Coverage

```bash
npm run coverage
```

Coverage reports are written to `coverage/`. Minimum coverage thresholds: 80% lines, functions, branches, statements.

## Code Quality

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

### Type Check

```bash
npm run compile
```

## Commit Convention

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add parallel startup command support
fix: resolve incorrect cooldown calculation
docs: update configuration reference
chore: bump zod to 3.22.4
test: add profileManager edge case coverage
refactor: extract variable resolver into separate module
```

Allowed prefixes: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `perf`, `ci`, `build`, `style`.

## Pull Request Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes following the code quality standards
4. Run `npm run compile && npm run lint && npm test`
5. Commit using Conventional Commits format
6. Open a PR against `main`
7. Fill out the PR template completely

## Code Standards

- **TypeScript strict mode** — zero `any` types
- **JSDoc** on all public functions
- **Zod validation** on all external data
- **No child_process** — use `terminal.sendText()` only
- **80% test coverage** minimum
