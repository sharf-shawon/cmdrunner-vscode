/**
 * @file startupRunner.ts
 * @description Orchestrates startup command execution with sequential/parallel support.
 * Commands can be run in order or concurrently based on configuration.
 */

import type { CmdRunnerConfig, Command } from './types';
import type { TerminalRunner } from './terminalRunner';
import type { AuditLogger } from './auditLog';

/**
 * Orchestrates running commands at workspace startup.
 */
export class StartupRunner {
  private readonly config: CmdRunnerConfig;
  private readonly terminalRunner: TerminalRunner;
  private readonly auditLogger: AuditLogger;

  /**
   * Creates a StartupRunner with the given dependencies.
   * @param config - The validated cmdRunner configuration.
   * @param terminalRunner - The terminal runner for executing commands.
   * @param auditLogger - The audit logger for startup events.
   */
  constructor(config: CmdRunnerConfig, terminalRunner: TerminalRunner, auditLogger: AuditLogger) {
    this.config = config;
    this.terminalRunner = terminalRunner;
    this.auditLogger = auditLogger;
  }

  /**
   * Runs all startup commands according to the startup configuration.
   * Sequential execution respects order; parallel fires all at once.
   * @param mergedEnv - Environment variables to pass to each command.
   */
  public async run(mergedEnv: Record<string, string>): Promise<void> {
    const startupConfig = this.config.startup;
    if (!startupConfig || startupConfig.commands.length === 0) {
      return;
    }

    const commandIds = startupConfig.commands;
    const commandMap = new Map<string, Command>(this.config.commands.map((cmd) => [cmd.id, cmd]));

    const toRun = commandIds
      .map((id) => commandMap.get(id))
      .filter((cmd): cmd is Command => cmd !== undefined);

    if (toRun.length === 0) {
      return;
    }

    this.auditLogger.log('command_executed', {
      details: `Startup: running ${toRun.length} command(s) (parallel=${String(startupConfig.parallel)})`,
    });

    if (startupConfig.delayMs > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, startupConfig.delayMs));
    }

    if (startupConfig.parallel) {
      await Promise.all(toRun.map((cmd) => this.terminalRunner.run(cmd, { env: mergedEnv })));
    } else {
      for (const cmd of toRun) {
        await this.terminalRunner.run(cmd, { env: mergedEnv });
      }
    }
  }
}
