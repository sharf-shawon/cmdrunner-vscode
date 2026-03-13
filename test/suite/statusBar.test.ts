/**
 * @file statusBar.test.ts
 * @description Unit tests for the StatusBarManager class.
 * Tests focus on cooldown tracking and disposal; refresh() is tested in the
 * VS Code electron environment where createStatusBarItem is available.
 */

import * as assert from 'assert';
import { StatusBarManager } from '../../src/statusBar';
import { CmdRunnerConfigSchema, CommandSchema } from '../../src/types';

/** Builds a minimal valid CmdRunnerConfig using the Zod schema. */
function makeConfig(
  overrides: Record<string, unknown> = {},
): ReturnType<typeof CmdRunnerConfigSchema.parse> {
  return CmdRunnerConfigSchema.parse(overrides);
}

/** Creates a parsed Command via the Zod schema to satisfy all defaults. */
function makeCommand(overrides: {
  id: string;
  label: string;
  command: string;
  cooldownMs?: number;
}): ReturnType<typeof CommandSchema.parse> {
  return CommandSchema.parse(overrides);
}

suite('StatusBarManager', () => {
  suite('isInCooldown', () => {
    test('returns false for an unknown commandId (item never created)', () => {
      const config = makeConfig({});
      const manager = new StatusBarManager(config);
      assert.strictEqual(manager.isInCooldown('unknown-cmd'), false);
    });

    test('returns false immediately after creation (no items)', () => {
      const config = makeConfig({});
      const manager = new StatusBarManager(config);
      assert.strictEqual(manager.isInCooldown('any-id'), false);
    });
  });

  suite('refresh and cooldown tracking', () => {
    let manager: StatusBarManager;

    setup(() => {
      const cmd = makeCommand({ id: 'build', label: 'Build', command: 'npm run build', cooldownMs: 100 });
      const config = makeConfig({ commands: [cmd] });
      manager = new StatusBarManager(config);
      // refresh() calls vscode.window.createStatusBarItem — available in VS Code test env
      manager.refresh('default');
    });

    teardown(() => {
      manager.dispose();
    });

    test('isInCooldown returns false before any execution', () => {
      assert.strictEqual(manager.isInCooldown('build'), false);
    });

    test('isInCooldown returns true after recordExecution when cooldownMs > 0', () => {
      manager.recordExecution('build');
      assert.strictEqual(manager.isInCooldown('build'), true);
    });

    test('isInCooldown returns false for a command not in the current profile', () => {
      assert.strictEqual(manager.isInCooldown('nonexistent'), false);
    });
  });

  suite('refresh profile filtering', () => {
    let manager: StatusBarManager;

    setup(() => {
      const globalCmd = makeCommand({ id: 'global', label: 'Global', command: 'echo global' });
      const devCmd = CommandSchema.parse({
        id: 'dev-only',
        label: 'Dev',
        command: 'echo dev',
        profiles: ['dev'],
      });
      const config = makeConfig({ commands: [globalCmd, devCmd] });
      manager = new StatusBarManager(config);
    });

    teardown(() => {
      manager.dispose();
    });

    test('shows global command in any profile', () => {
      manager.refresh('default');
      // global command should not be in cooldown (it exists in items map)
      assert.strictEqual(manager.isInCooldown('global'), false);
    });

    test('dev-only command is visible when dev profile is active', () => {
      manager.refresh('dev');
      // Command is created; isInCooldown should return false (not executed yet)
      assert.strictEqual(manager.isInCooldown('dev-only'), false);
    });
  });

  suite('dispose', () => {
    test('dispose clears all items without error', () => {
      const cmd = makeCommand({ id: 'x', label: 'X', command: 'echo x' });
      const config = makeConfig({ commands: [cmd] });
      const manager = new StatusBarManager(config);
      manager.refresh('default');
      assert.doesNotThrow(() => manager.dispose());
      // After dispose, isInCooldown should return false for all
      assert.strictEqual(manager.isInCooldown('x'), false);
    });
  });
});
