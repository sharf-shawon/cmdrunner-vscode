/**
 * @file configLoader.test.ts
 * @description Unit tests for the configLoader module.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { stripJsonComments, computeFileChecksum, loadConfig } from '../../src/configLoader';

suite('configLoader', () => {
  suite('stripJsonComments', () => {
    test('strips single-line comments', () => {
      const input = '{\n  // this is a comment\n  "key": "value"\n}';
      const result = stripJsonComments(input);
      assert.ok(!result.includes('// this is a comment'), 'comment should be removed');
      assert.ok(result.includes('"key": "value"'), 'value should be retained');
    });

    test('strips multi-line comments', () => {
      const input = '{\n  /* block comment */\n  "key": "value"\n}';
      const result = stripJsonComments(input);
      assert.ok(!result.includes('/* block comment */'), 'block comment should be removed');
      assert.ok(result.includes('"key": "value"'), 'value should be retained');
    });

    test('handles strings with // inside', () => {
      const input = '{"url": "http://example.com"}';
      const result = stripJsonComments(input);
      assert.strictEqual(result, '{"url": "http://example.com"}');
    });

    test('handles empty string', () => {
      assert.strictEqual(stripJsonComments(''), '');
    });
  });

  suite('computeFileChecksum', () => {
    let tmpFile: string;

    setup(() => {
      tmpFile = path.join(os.tmpdir(), `cmdrunner-chk-${Date.now()}.json`);
      fs.writeFileSync(tmpFile, '{"version":"1"}', 'utf8');
    });

    teardown(() => {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    });

    test('returns non-empty string for existing file', () => {
      const checksum = computeFileChecksum(tmpFile);
      assert.ok(checksum.length > 0, 'checksum should be non-empty');
      assert.match(checksum, /^[0-9a-f]{64}$/, 'checksum should be a hex SHA-256');
    });

    test('returns empty string for missing file', () => {
      const checksum = computeFileChecksum(path.join(os.tmpdir(), 'no-such-file-xyz.json'));
      assert.strictEqual(checksum, '');
    });
  });

  suite('loadConfig', () => {
    let tmpDir: string;

    setup(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmdrunner-cfg-'));
    });

    teardown(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('throws on missing file', () => {
      assert.throws(
        () => loadConfig(path.join(tmpDir, 'nonexistent.json')),
        /Configuration file not found/,
      );
    });

    test('throws on invalid JSON', () => {
      const file = path.join(tmpDir, '.cmdrunner');
      fs.writeFileSync(file, 'not { valid json }', 'utf8');
      assert.throws(() => loadConfig(file), /Invalid JSON/);
    });

    test('throws on schema validation failure', () => {
      const file = path.join(tmpDir, '.cmdrunner');
      // commands must be an array — passing a string causes Zod to reject it
      fs.writeFileSync(file, JSON.stringify({ commands: 'bad-type' }), 'utf8');
      assert.throws(() => loadConfig(file), /Configuration validation failed/);
    });

    test('returns valid LoadedConfig for valid JSON', () => {
      const file = path.join(tmpDir, '.cmdrunner');
      fs.writeFileSync(
        file,
        JSON.stringify({ version: '1', commands: [{ id: 'a', label: 'A', command: 'echo a' }] }),
        'utf8',
      );
      const loaded = loadConfig(file);
      assert.strictEqual(loaded.filePath, file);
      assert.ok(loaded.checksum.length > 0, 'checksum should be set');
      assert.ok(loaded.loadedAt.length > 0, 'loadedAt should be set');
      assert.strictEqual(loaded.config.commands.length, 1);
      assert.strictEqual(loaded.config.commands[0]?.id, 'a');
    });
  });
});
