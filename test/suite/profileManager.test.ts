/**
 * @file profileManager.test.ts
 * @description Unit tests for the ProfileManager class.
 * Tests focus on methods that do not open VS Code UI dialogs.
 */

import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import { ProfileManager } from '../../src/profileManager';
import { AuditLogger } from '../../src/auditLog';
import { CmdRunnerConfigSchema } from '../../src/types';

/** Creates an AuditLogger that writes to a temp file to avoid polluting ~/.cmdrunner */
function makeAuditLogger(): AuditLogger {
  return new AuditLogger({
    enabled: true,
    logPath: path.join(os.tmpdir(), `cmdrunner-pm-audit-${Date.now()}.log`),
    maxSizeBytes: 10485760,
  });
}

/** Builds a minimal valid CmdRunnerConfig using the Zod schema. */
function makeConfig(
  overrides: Record<string, unknown> = {},
): ReturnType<typeof CmdRunnerConfigSchema.parse> {
  return CmdRunnerConfigSchema.parse(overrides);
}

suite('ProfileManager', () => {
  let auditLogger: AuditLogger;

  setup(() => {
    auditLogger = makeAuditLogger();
  });

  suite('getProfileNames', () => {
    test('returns an empty array when no profiles are defined', () => {
      const config = makeConfig({});
      const manager = new ProfileManager(config, auditLogger);
      assert.deepStrictEqual(manager.getProfileNames(), []);
    });

    test('returns the names of all defined profiles', () => {
      const config = makeConfig({
        profiles: {
          dev: { name: 'dev' },
          prod: { name: 'prod' },
        },
      });
      const manager = new ProfileManager(config, auditLogger);
      const names = manager.getProfileNames().sort();
      assert.deepStrictEqual(names, ['dev', 'prod']);
    });
  });

  suite('getActiveProfileName', () => {
    test('returns the activeProfile from config', () => {
      const config = makeConfig({ activeProfile: 'default' });
      const manager = new ProfileManager(config, auditLogger);
      assert.strictEqual(manager.getActiveProfileName(), 'default');
    });

    test('returns a custom active profile when specified', () => {
      const config = makeConfig({
        activeProfile: 'dev',
        profiles: { dev: { name: 'dev' } },
      });
      const manager = new ProfileManager(config, auditLogger);
      assert.strictEqual(manager.getActiveProfileName(), 'dev');
    });
  });

  suite('getMergedEnv', () => {
    test('returns global env when active profile has no env', () => {
      const config = makeConfig({
        globalEnv: { FOO: 'bar' },
        activeProfile: 'default',
      });
      const manager = new ProfileManager(config, auditLogger);
      const env = manager.getMergedEnv();
      assert.strictEqual(env['FOO'], 'bar');
    });

    test('profile env overrides global env for the same key', () => {
      const config = makeConfig({
        globalEnv: { NODE_ENV: 'development', SHARED: 'global' },
        activeProfile: 'prod',
        profiles: {
          prod: { name: 'prod', env: { NODE_ENV: 'production' } },
        },
      });
      const manager = new ProfileManager(config, auditLogger);
      const env = manager.getMergedEnv();
      assert.strictEqual(env['NODE_ENV'], 'production', 'profile var should override global');
      assert.strictEqual(env['SHARED'], 'global', 'non-overridden global var should remain');
    });

    test('returns only global env when profile has empty env', () => {
      const config = makeConfig({
        globalEnv: { KEY: 'value' },
        activeProfile: 'ci',
        profiles: { ci: { name: 'ci', env: {} } },
      });
      const manager = new ProfileManager(config, auditLogger);
      const env = manager.getMergedEnv();
      assert.strictEqual(env['KEY'], 'value');
    });
  });

  suite('updateConfig', () => {
    test('updates the internal config on hot reload', () => {
      const initial = makeConfig({ globalEnv: { VERSION: '1' } });
      const manager = new ProfileManager(initial, auditLogger);

      const updated = makeConfig({ globalEnv: { VERSION: '2' } });
      manager.updateConfig(updated);

      const env = manager.getMergedEnv();
      assert.strictEqual(env['VERSION'], '2');
    });

    test('resets active profile if it no longer exists in new config', () => {
      const initial = makeConfig({
        activeProfile: 'staging',
        profiles: { staging: { name: 'staging' } },
      });
      const manager = new ProfileManager(initial, auditLogger);
      assert.strictEqual(manager.getActiveProfileName(), 'staging');

      // New config without 'staging' profile; activeProfile defaults to 'default'
      const updated = makeConfig({ activeProfile: 'default' });
      manager.updateConfig(updated);

      assert.strictEqual(manager.getActiveProfileName(), 'default');
    });
  });
});
