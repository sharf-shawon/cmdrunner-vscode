/**
 * @file index.ts
 * @description Mocha test suite loader for cmdRunner extension tests.
 */

import * as fs from 'fs';
import * as path from 'path';
import Mocha from 'mocha';

/**
 * Recursively collects *.test.js files under a directory.
 * @param dir - Root directory to search.
 * @returns Array of absolute file paths.
 */
function collectTestFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTestFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

/** Default timeout in milliseconds for each test */
const TEST_TIMEOUT_MS = 10000;

/**
 * Discovers and runs all test files in the suite directory.
 * @returns Promise that resolves when all tests complete.
 */
export async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: TEST_TIMEOUT_MS,
  });

  const testsRoot = path.resolve(__dirname, '.');
  const files = collectTestFiles(testsRoot);

  for (const file of files) {
    mocha.addFile(file);
  }

  return new Promise((resolve, reject) => {
    mocha.run((failures: number) => {
      if (failures > 0) {
        reject(new Error(`${failures} test(s) failed.`));
      } else {
        resolve();
      }
    });
  });
}
