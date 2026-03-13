/**
 * @file runTests.ts
 * @description VS Code extension test runner entry point.
 */

import * as path from 'path';
import { runTests } from '@vscode/test-electron';

/**
 * Main test runner function.
 */
async function main(): Promise<void> {
  const extensionDevelopmentPath = path.resolve(__dirname, '../../');
  const extensionTestsPath = path.resolve(__dirname, './suite/index');

  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
  });
}

main().catch((err: unknown) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
