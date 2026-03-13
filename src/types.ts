/**
 * @file types.ts
 * @description Zod schemas and TypeScript interfaces for cmdRunner configuration.
 * All configuration validation happens here at load time.
 */

import { z } from 'zod';

/** Zod schema for a single command button */
export const CommandSchema = z.object({
  /** Unique identifier for this command */
  id: z.string().min(1),
  /** Label shown on the status bar button */
  label: z.string().min(1),
  /** The shell command to execute */
  command: z.string().min(1),
  /** Optional tooltip text */
  tooltip: z.string().optional(),
  /** Optional codicon icon name (e.g. "play", "terminal") */
  icon: z.string().optional(),
  /** Color for the status bar item */
  color: z.string().optional(),
  /** Cooldown in milliseconds between executions */
  cooldownMs: z.number().int().nonnegative().optional().default(0),
  /** Whether to show in all profiles or only named ones */
  profiles: z.array(z.string()).optional(),
  /** Whether this command runs at startup */
  runOnStartup: z.boolean().optional().default(false),
  /** Terminal profile to use */
  terminalProfile: z.string().optional(),
  /** Whether to reuse an existing terminal */
  reuseTerminal: z.boolean().optional().default(true),
  /** Display alignment in status bar */
  alignment: z.enum(['left', 'right']).optional().default('left'),
  /** Priority for ordering in status bar */
  priority: z.number().int().optional(),
});

/** TypeScript type derived from CommandSchema */
export type Command = z.infer<typeof CommandSchema>;

/** Zod schema for environment profile */
export const ProfileSchema = z.object({
  /** Profile display name */
  name: z.string().min(1),
  /** Environment variables to merge for this profile */
  env: z.record(z.string(), z.string()).optional().default({}),
  /** Description of this profile */
  description: z.string().optional(),
});

/** TypeScript type derived from ProfileSchema */
export type Profile = z.infer<typeof ProfileSchema>;

/** Zod schema for startup configuration */
export const StartupConfigSchema = z.object({
  /** Commands to run at startup (by id) */
  commands: z.array(z.string()).optional().default([]),
  /** Whether to run startup commands in parallel */
  parallel: z.boolean().optional().default(false),
  /** Delay in milliseconds before running startup commands */
  delayMs: z.number().int().nonnegative().optional().default(0),
});

/** TypeScript type derived from StartupConfigSchema */
export type StartupConfig = z.infer<typeof StartupConfigSchema>;

/** Zod schema for security configuration */
export const SecurityConfigSchema = z.object({
  /** Blocked command patterns (regex strings) */
  blockedPatterns: z.array(z.string()).optional().default([]),
  /** Whether to require workspace trust */
  requireWorkspaceTrust: z.boolean().optional().default(true),
  /** Known checksums for config files: filename -> sha256 */
  checksums: z.record(z.string(), z.string()).optional().default({}),
  /** Whether to mask secrets in audit logs */
  maskSecrets: z.boolean().optional().default(true),
});

/** TypeScript type derived from SecurityConfigSchema */
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;

/** Zod schema for audit log configuration */
export const AuditConfigSchema = z.object({
  /** Whether audit logging is enabled */
  enabled: z.boolean().optional().default(true),
  /** Path to audit log file */
  logPath: z.string().optional(),
  /** Maximum log file size in bytes before rotation */
  maxSizeBytes: z.number().int().positive().optional().default(10485760),
});

/** TypeScript type derived from AuditConfigSchema */
export type AuditConfig = z.infer<typeof AuditConfigSchema>;

/** Zod schema for display configuration */
export const DisplayConfigSchema = z.object({
  /** Display mode for status bar buttons */
  mode: z.enum(['icon', 'text', 'both']).optional().default('both'),
  /** Whether to show command count badge */
  showCount: z.boolean().optional().default(false),
  /** Status bar item alignment */
  statusBarAlignment: z.enum(['left', 'right']).optional().default('left'),
});

/** TypeScript type derived from DisplayConfigSchema */
export type DisplayConfig = z.infer<typeof DisplayConfigSchema>;

/** Root configuration schema */
export const CmdRunnerConfigSchema = z.object({
  /** Schema version for forward compatibility */
  version: z.string().optional().default('1'),
  /** List of command buttons */
  commands: z.array(CommandSchema).optional().default([]),
  /** Named environment profiles */
  profiles: z.record(z.string(), ProfileSchema).optional().default({}),
  /** Active profile name */
  activeProfile: z.string().optional().default('default'),
  /** Startup command configuration */
  startup: StartupConfigSchema.optional(),
  /** Security configuration */
  security: SecurityConfigSchema.optional(),
  /** Audit log configuration */
  audit: AuditConfigSchema.optional(),
  /** Display configuration */
  display: DisplayConfigSchema.optional(),
  /** Global environment variables */
  globalEnv: z.record(z.string(), z.string()).optional().default({}),
});

/** TypeScript type derived from CmdRunnerConfigSchema */
export type CmdRunnerConfig = z.infer<typeof CmdRunnerConfigSchema>;

/** Represents a loaded and validated configuration with metadata */
export interface LoadedConfig {
  /** The validated configuration object */
  config: CmdRunnerConfig;
  /** Absolute path to the config file */
  filePath: string;
  /** ISO timestamp when the config was loaded */
  loadedAt: string;
  /** SHA-256 checksum of the config file */
  checksum: string;
}

/** Audit log entry structure */
export interface AuditEntry {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Action type */
  action: 'command_executed' | 'config_loaded' | 'profile_switched' | 'extension_activated' | 'extension_deactivated' | 'security_violation';
  /** Command id if applicable */
  commandId?: string;
  /** Profile name if applicable */
  profile?: string;
  /** Masked command text */
  commandText?: string;
  /** Workspace folder URI */
  workspaceFolder?: string;
  /** Additional context */
  details?: string;
}

/** Extension state */
export interface ExtensionState {
  /** Currently loaded configuration */
  config: LoadedConfig | null;
  /** Active profile name */
  activeProfile: string;
  /** Whether the extension is active */
  isActive: boolean;
  /** Last error message */
  lastError: string | null;
}
