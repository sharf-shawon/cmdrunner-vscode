/**
 * @file terminalRunner.integration.test.ts
 * @description Integration smoke test for the TerminalRunner class.
 * Verifies the class can be instantiated with its required dependencies
 * inside the VS Code electron test environment.
 */

import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import { TerminalRunner } from '../../../src/terminalRunner';
import { AuditLogger } from '../../../src/auditLog';
import { SecurityManager } from '../../../src/security';
import { VariableResolver } from '../../../src/variableResolver';
import { StatusBarManager } from '../../../src/statusBar';
import { CmdRunnerConfigSchema, SecurityConfigSchema } from '../../../src/types';

suite('TerminalRunner (integration)', () => {
  let runner: TerminalRunner;

  setup(() => {
    const auditLogger = new AuditLogger({
      enabled: true,
      logPath: path.join(os.tmpdir(), `cmdrunner-integration-${Date.now()}.log`),
      maxSizeBytes: 10485760,
    });

    const securityConfig = SecurityConfigSchema.parse({ requireWorkspaceTrust: false });
    const securityManager = new SecurityManager(securityConfig);

    const variableResolver = new VariableResolver(os.tmpdir());

    const config = CmdRunnerConfigSchema.parse({});
    const statusBarManager = new StatusBarManager(config);

    runner = new TerminalRunner(auditLogger, securityManager, variableResolver, statusBarManager);
  });

  teardown(() => {
    runner.dispose();
  });

  test('TerminalRunner can be instantiated with all dependencies', () => {
    assert.ok(runner instanceof TerminalRunner, 'runner should be a TerminalRunner instance');
  });

  test('dispose() can be called without error', () => {
    assert.doesNotThrow(() => runner.dispose());
  });
});
