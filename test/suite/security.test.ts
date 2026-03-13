/**
 * @file security.test.ts
 * @description Unit tests for the SecurityManager class.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SecurityManager } from '../../src/security';

/** Minimal helper to build a SecurityManager with overrides. */
function makeManager(overrides: {
  blockedPatterns?: string[];
  requireWorkspaceTrust?: boolean;
  maskSecrets?: boolean;
  checksums?: Record<string, string>;
}): SecurityManager {
  return new SecurityManager({
    blockedPatterns: overrides.blockedPatterns ?? [],
    requireWorkspaceTrust: overrides.requireWorkspaceTrust ?? false,
    checksums: overrides.checksums ?? {},
    maskSecrets: overrides.maskSecrets ?? false,
  });
}

suite('SecurityManager', () => {
  suite('isWorkspaceTrusted', () => {
    test('returns true when requireWorkspaceTrust is false', () => {
      const manager = makeManager({ requireWorkspaceTrust: false });
      assert.strictEqual(manager.isWorkspaceTrusted(), true);
    });
  });

  suite('isCommandBlocked', () => {
    test('blocks commands matching a configured pattern', () => {
      const manager = makeManager({ blockedPatterns: ['rm\\s+-rf'] });
      assert.strictEqual(manager.isCommandBlocked('rm -rf /'), true);
    });

    test('allows commands that do not match any pattern', () => {
      const manager = makeManager({ blockedPatterns: ['rm\\s+-rf'] });
      assert.strictEqual(manager.isCommandBlocked('echo hello'), false);
    });

    test('handles invalid regex gracefully (skips bad pattern)', () => {
      // An unclosed bracket is an invalid regex — must not throw
      const manager = makeManager({ blockedPatterns: ['[invalid'] });
      assert.doesNotThrow(() => manager.isCommandBlocked('echo test'));
      assert.strictEqual(manager.isCommandBlocked('echo test'), false);
    });

    test('returns false when blockedPatterns is empty', () => {
      const manager = makeManager({ blockedPatterns: [] });
      assert.strictEqual(manager.isCommandBlocked('sudo rm -rf /'), false);
    });
  });

  suite('maskSecrets', () => {
    test('masks sk- tokens when maskSecrets is true', () => {
      const manager = makeManager({ maskSecrets: true });
      const result = manager.maskSecrets('key=sk-ABCDEFGHIJKLMNOPQRSTU');
      assert.ok(!result.includes('sk-'), 'sk- token should be masked');
      assert.ok(result.includes('[REDACTED]'), '[REDACTED] marker should appear');
    });

    test('masks ghp_ tokens when maskSecrets is true', () => {
      const manager = makeManager({ maskSecrets: true });
      const ghpToken = 'ghp_' + 'A'.repeat(36);
      const result = manager.maskSecrets(`token: ${ghpToken}`);
      assert.ok(!result.includes('ghp_'), 'ghp_ token should be masked');
      assert.ok(result.includes('[REDACTED]'));
    });

    test('returns original text when maskSecrets is false', () => {
      const manager = makeManager({ maskSecrets: false });
      const original = 'sk-ABCDEFGHIJKLMNOPQRSTU some text';
      assert.strictEqual(manager.maskSecrets(original), original);
    });
  });

  suite('computeChecksum', () => {
    let tmpFile: string;

    setup(() => {
      tmpFile = path.join(os.tmpdir(), `cmdrunner-sec-${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, 'hello checksum', 'utf8');
    });

    teardown(() => {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    });

    test('returns non-empty hex string for an existing file', () => {
      const manager = makeManager({});
      const checksum = manager.computeChecksum(tmpFile);
      assert.ok(checksum.length > 0, 'checksum should not be empty');
      assert.match(checksum, /^[0-9a-f]{64}$/, 'should be SHA-256 hex');
    });

    test('returns empty string for a missing file', () => {
      const manager = makeManager({});
      const checksum = manager.computeChecksum('/no/such/file/xyz.txt');
      assert.strictEqual(checksum, '');
    });
  });

  suite('verifyChecksum', () => {
    let tmpFile: string;
    let realChecksum: string;

    setup(() => {
      tmpFile = path.join(os.tmpdir(), `cmdrunner-verify-${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, 'verify me', 'utf8');
      const manager = makeManager({});
      realChecksum = manager.computeChecksum(tmpFile);
    });

    teardown(() => {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    });

    test('returns true when checksum matches', () => {
      const manager = makeManager({});
      assert.strictEqual(manager.verifyChecksum(tmpFile, realChecksum), true);
    });

    test('returns false when checksum does not match', () => {
      const manager = makeManager({});
      assert.strictEqual(manager.verifyChecksum(tmpFile, 'deadbeef'), false);
    });

    test('returns true when expected checksum is empty', () => {
      const manager = makeManager({});
      assert.strictEqual(manager.verifyChecksum(tmpFile, ''), true);
    });
  });
});
