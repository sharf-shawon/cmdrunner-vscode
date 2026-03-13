/**
 * @file variableResolver.test.ts
 * @description Unit tests for the VariableResolver class.
 * Tests focus on variables that do not require an open editor in VS Code.
 */

import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import { VariableResolver } from '../../src/variableResolver';

/** Workspace folder used as the resolver root for all tests */
const WORKSPACE = path.join(os.tmpdir(), 'test-workspace');

suite('VariableResolver', () => {
  let resolver: VariableResolver;

  setup(() => {
    resolver = new VariableResolver(WORKSPACE);
  });

  suite('resolve', () => {
    test('passes through text without variables unchanged', () => {
      const input = 'echo hello world';
      assert.strictEqual(resolver.resolve(input), input);
    });

    test('resolves ${workspaceFolder} to the workspace path', () => {
      const result = resolver.resolve('cd ${workspaceFolder}');
      assert.strictEqual(result, `cd ${WORKSPACE}`);
    });

    test('resolves ${workspaceFolderBasename} to the folder name', () => {
      const expected = path.basename(WORKSPACE);
      const result = resolver.resolve('echo ${workspaceFolderBasename}');
      assert.strictEqual(result, `echo ${expected}`);
    });

    test('resolves ${env:PATH} to process.env.PATH', () => {
      const expectedPath = process.env['PATH'] ?? '';
      const result = resolver.resolve('echo ${env:PATH}');
      assert.strictEqual(result, `echo ${expectedPath}`);
    });

    test('resolves ${env:NONEXISTENT_VAR_XYZ} to empty string', () => {
      const result = resolver.resolve('${env:NONEXISTENT_VAR_XYZ}');
      assert.strictEqual(result, '');
    });

    test('resolves ${date} to YYYY-MM-DD format', () => {
      const result = resolver.resolve('${date}');
      assert.match(result, /^\d{4}-\d{2}-\d{2}$/, '${date} should be YYYY-MM-DD');
    });

    test('resolves ${time} to HH:MM:SS format', () => {
      const result = resolver.resolve('${time}');
      assert.match(result, /^\d{2}:\d{2}:\d{2}$/, '${time} should be HH:MM:SS');
    });

    test('leaves unknown variables as-is', () => {
      const input = 'echo ${unknownVar}';
      assert.strictEqual(resolver.resolve(input), input);
    });

    test('resolves ${gitBranch} to a string (possibly empty)', () => {
      const result = resolver.resolve('${gitBranch}');
      // The workspace may not be a git repo; result must be a string
      assert.strictEqual(typeof result, 'string');
    });

    test('resolves multiple variables in a single command', () => {
      const result = resolver.resolve('cd ${workspaceFolder} && echo ${date}');
      assert.ok(result.startsWith(`cd ${WORKSPACE} && echo `), 'workspace should be resolved');
      assert.match(result, /\d{4}-\d{2}-\d{2}$/, 'date should be at the end');
    });
  });
});
