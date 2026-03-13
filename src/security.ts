/**
 * @file security.ts
 * @description Security utilities for cmdRunner: workspace trust, blocked patterns,
 * checksum verification, and secret masking.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as vscode from 'vscode';
import type { SecurityConfig } from './types';

/** Patterns that always trigger secret masking */
const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9]{20,}/g,
  /ghp_[A-Za-z0-9]{36,}/g,
  /ghs_[A-Za-z0-9]{36,}/g,
  /(?:password|passwd|secret|token|api[_-]?key)\s*=\s*\S+/gi,
];

/** Replacement string for masked secrets */
const MASK_REPLACEMENT = '[REDACTED]';

/**
 * Provides security checks and utilities for the cmdRunner extension.
 */
export class SecurityManager {
  private readonly config: SecurityConfig;

  /**
   * Creates a SecurityManager with the given security configuration.
   * @param config - Security configuration object.
   */
  constructor(config: SecurityConfig) {
    this.config = config;
  }

  /**
   * Checks whether the current workspace is trusted.
   * @returns true if trusted, false otherwise.
   */
  public isWorkspaceTrusted(): boolean {
    if (!this.config.requireWorkspaceTrust) {
      return true;
    }
    return vscode.workspace.isTrusted;
  }

  /**
   * Checks whether a command matches any blocked patterns.
   * @param command - The shell command string to check.
   * @returns true if blocked, false if allowed.
   */
  public isCommandBlocked(command: string): boolean {
    for (const pattern of this.config.blockedPatterns) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(command)) {
          return true;
        }
      } catch {
        // Invalid regex pattern — skip silently
      }
    }
    return false;
  }

  /**
   * Computes the SHA-256 checksum of a file.
   * @param filePath - Absolute path to the file.
   * @returns Hex-encoded SHA-256 digest.
   */
  public computeChecksum(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch {
      return '';
    }
  }

  /**
   * Verifies the checksum of a file against a known-good value.
   * @param filePath - Absolute path to the file.
   * @param expectedChecksum - Expected SHA-256 hex digest.
   * @returns true if checksums match or no expected checksum is configured.
   */
  public verifyChecksum(filePath: string, expectedChecksum: string): boolean {
    if (!expectedChecksum) {
      return true;
    }
    const actual = this.computeChecksum(filePath);
    return actual === expectedChecksum;
  }

  /**
   * Verifies the checksum of the config file if configured.
   * @param filePath - Absolute path to the config file.
   * @returns true if checksum passes, false if it fails.
   */
  public verifyConfigChecksum(filePath: string): boolean {
    const fileName = filePath.split(/[/\\]/).pop() ?? '';
    const expected = this.config.checksums[fileName] ?? '';
    if (!expected) {
      return true;
    }
    return this.verifyChecksum(filePath, expected);
  }

  /**
   * Masks known secret patterns in a string.
   * @param text - The text potentially containing secrets.
   * @returns The text with secrets replaced by [REDACTED].
   */
  public maskSecrets(text: string): string {
    if (!this.config.maskSecrets) {
      return text;
    }
    let result = text;
    for (const pattern of SECRET_PATTERNS) {
      result = result.replace(new RegExp(pattern.source, pattern.flags), MASK_REPLACEMENT);
    }
    return result;
  }

  /**
   * Validates workspace trust and throws if not trusted.
   * @throws Error if workspace is not trusted and trust is required.
   */
  public assertWorkspaceTrusted(): void {
    if (!this.isWorkspaceTrusted()) {
      throw new Error(
        'cmdRunner: Workspace is not trusted. Please trust this workspace to use cmdRunner.',
      );
    }
  }
}

/**
 * Creates a default SecurityManager with empty blocked patterns.
 * @returns A SecurityManager with default security settings.
 */
export function createDefaultSecurityManager(): SecurityManager {
  return new SecurityManager({
    blockedPatterns: [],
    requireWorkspaceTrust: true,
    checksums: {},
    maskSecrets: true,
  });
}
