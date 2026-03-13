/**
 * @file configLoader.ts
 * @description Loads, parses, and validates the .cmdrunner configuration file.
 * Supports JSON with comments (JSONC) format. Uses Zod for runtime validation.
 */

import * as fs from 'fs';
import * as crypto from 'crypto';
import * as vscode from 'vscode';
import { CmdRunnerConfigSchema } from './types';
import type { CmdRunnerConfig, LoadedConfig } from './types';

/** Default configuration file path relative to workspace root */
const DEFAULT_CONFIG_PATH = '.cmdrunner';

/**
 * Strips single-line and multi-line comments from a JSON string.
 * This enables JSONC (JSON with comments) support.
 * @param input - Raw file content that may contain comments.
 * @returns Clean JSON string with comments removed.
 */
export function stripJsonComments(input: string): string {
  let result = '';
  let i = 0;
  const len = input.length;
  let inString = false;
  let inSingleLineComment = false;
  let inMultiLineComment = false;

  while (i < len) {
    const ch = input[i];
    const next = input[i + 1];

    if (inSingleLineComment) {
      if (ch === '\n') {
        inSingleLineComment = false;
        result += ch;
      }
      i++;
      continue;
    }

    if (inMultiLineComment) {
      if (ch === '*' && next === '/') {
        inMultiLineComment = false;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    if (inString) {
      result += ch;
      if (ch === '\\') {
        i++;
        if (i < len) {
          result += input[i];
        }
      } else if (ch === '"') {
        inString = false;
      }
      i++;
      continue;
    }

    if (ch === '"') {
      inString = true;
      result += ch;
      i++;
      continue;
    }

    if (ch === '/' && next === '/') {
      inSingleLineComment = true;
      i += 2;
      continue;
    }

    if (ch === '/' && next === '*') {
      inMultiLineComment = true;
      i += 2;
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}

/**
 * Computes the SHA-256 checksum of a file's contents.
 * @param filePath - Absolute path to the file.
 * @returns Hex-encoded SHA-256 digest.
 */
export function computeFileChecksum(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch {
    return '';
  }
}

/**
 * Resolves the configuration file path from VS Code workspace settings.
 * @param workspaceFolder - URI of the workspace folder.
 * @returns Absolute path to the configuration file.
 */
export function resolveConfigPath(workspaceFolder: vscode.Uri): string {
  const configSetting = vscode.workspace
    .getConfiguration('cmdrunner')
    .get<string>('configPath', DEFAULT_CONFIG_PATH);
  return vscode.Uri.joinPath(workspaceFolder, configSetting).fsPath;
}

/**
 * Loads and validates a cmdRunner configuration file.
 * @param filePath - Absolute path to the .cmdrunner file.
 * @returns A LoadedConfig object with validated config, path, timestamp, and checksum.
 * @throws Error if the file cannot be read, parsed, or validated.
 */
export function loadConfig(filePath: string): LoadedConfig {
  if (!fs.existsSync(filePath)) {
    throw new Error(`cmdRunner: Configuration file not found: ${filePath}`);
  }

  let rawContent: string;
  try {
    rawContent = fs.readFileSync(filePath, 'utf8');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`cmdRunner: Failed to read configuration file: ${msg}`);
  }

  const stripped = stripJsonComments(rawContent);

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`cmdRunner: Invalid JSON in configuration file: ${msg}`);
  }

  const result = CmdRunnerConfigSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`cmdRunner: Configuration validation failed:\n${issues}`);
  }

  const config: CmdRunnerConfig = result.data;
  const checksum = computeFileChecksum(filePath);

  return {
    config,
    filePath,
    loadedAt: new Date().toISOString(),
    checksum,
  };
}
