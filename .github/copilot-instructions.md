# Copilot Instructions for cmdRunner

## Mandatory Agent Rules

1. **Read knowledge base first**: Before starting any work, read `docs/agent-knowledge-base.md` to understand prior learnings and avoid repeating mistakes.

2. **No child_process**: Never use `child_process.exec()`, `child_process.spawn()`, or any Node.js process spawning API. All command execution MUST use `terminal.sendText()` exclusively. This is a hard security requirement.

3. **Zero `any` types**: Never use TypeScript's `any` type. Use `unknown` and narrow with type guards, or define proper interfaces. The ESLint rule `@typescript-eslint/no-explicit-any: error` enforces this.

4. **Zod for all external data**: All data from external sources (config files, user input, environment) must be validated with Zod schemas defined in `types.ts`. Never trust raw parsed JSON without validation.

5. **Update docs on src changes**: Whenever you modify files in `src/`, update the relevant documentation in `docs/`. If you change types in `types.ts`, also update `.vscode/cmdrunner.schema.json`.

6. **Conventional Commits**: All commit messages must follow Conventional Commits format: `type(scope): description`. Allowed types: feat, fix, docs, chore, test, refactor, perf, ci, build, style.

7. **Workspace trust gate**: Never remove or bypass the workspace trust check in `security.ts`. The `assertWorkspaceTrusted()` call in `terminalRunner.ts` is mandatory.

8. **Append to knowledge base**: When you discover something new about the codebase that future agents should know, append an entry to `docs/agent-knowledge-base.md` in `[YYYY-MM-DD][category] Description` format.

9. **Test coverage**: Maintain ≥80% test coverage. When adding new functionality, add corresponding tests in `test/suite/`. Run `npm test` before committing.
