/**
 * @file auditLog.ts
 * @description Append-only audit log writer for cmdRunner.
 * Writes structured JSON entries to ~/.cmdrunner/audit.log.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { AuditEntry, AuditConfig } from './types';

/** Default audit log directory */
const DEFAULT_AUDIT_DIR = path.join(os.homedir(), '.cmdrunner');
/** Default audit log filename */
const DEFAULT_AUDIT_FILE = 'audit.log';

/**
 * Manages append-only audit log writing.
 * Ensures the log directory exists and entries are written atomically.
 */
export class AuditLogger {
  private readonly logPath: string;
  private readonly enabled: boolean;
  private readonly maxSizeBytes: number;

  /**
   * Creates an AuditLogger instance.
   * @param config - Optional audit configuration. Uses defaults if not provided.
   */
  constructor(config?: AuditConfig) {
    this.enabled = config?.enabled ?? true;
    this.maxSizeBytes = config?.maxSizeBytes ?? 10485760;
    const logDir = config?.logPath
      ? path.dirname(config.logPath)
      : DEFAULT_AUDIT_DIR;
    const logFile = config?.logPath
      ? path.basename(config.logPath)
      : DEFAULT_AUDIT_FILE;
    this.logPath = path.join(logDir, logFile);
    if (this.enabled) {
      this.ensureLogDir(logDir);
    }
  }

  /**
   * Ensures the log directory exists, creating it if necessary.
   * @param dir - Directory path to ensure exists.
   */
  private ensureLogDir(dir: string): void {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {
      // Silently fail if we cannot create the log directory
    }
  }

  /**
   * Rotates the log file if it exceeds the maximum size.
   */
  private rotateIfNeeded(): void {
    try {
      if (fs.existsSync(this.logPath)) {
        const stat = fs.statSync(this.logPath);
        if (stat.size >= this.maxSizeBytes) {
          const rotated = `${this.logPath}.${Date.now()}.bak`;
          fs.renameSync(this.logPath, rotated);
        }
      }
    } catch {
      // Silently fail on rotation error
    }
  }

  /**
   * Appends a single audit entry to the log file.
   * @param entry - The audit entry to write.
   */
  public append(entry: AuditEntry): void {
    if (!this.enabled) {
      return;
    }
    try {
      this.rotateIfNeeded();
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logPath, line, { encoding: 'utf8', flag: 'a' });
    } catch {
      // Silently fail on write error to not disrupt extension functionality
    }
  }

  /**
   * Creates and appends an audit entry with current timestamp.
   * @param action - The action type to log.
   * @param extras - Optional additional fields to include.
   */
  public log(
    action: AuditEntry['action'],
    extras?: Partial<Omit<AuditEntry, 'timestamp' | 'action'>>,
  ): void {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action,
      ...extras,
    };
    this.append(entry);
  }

  /**
   * Returns the absolute path to the audit log file.
   */
  public getLogPath(): string {
    return this.logPath;
  }
}
