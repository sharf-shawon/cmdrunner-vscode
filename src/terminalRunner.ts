/**
 * @file terminalRunner.ts
 * @description Command execution via VS Code terminals using terminal.sendText() exclusively.
 * Never uses child_process.exec() or spawn().
 */

import * as vscode from 'vscode';
import type { Command } from './types';
import type { AuditLogger } from './auditLog';
import type { SecurityManager } from './security';
import type { VariableResolver } from './variableResolver';
import type { StatusBarManager } from './statusBar';

/** Options for running a command */
interface RunOptions {
  /** Environment variables to set before the command */
  env?: Record<string, string>;
  /** Terminal profile name to use */
  terminalProfile?: string;
}

/**
 * Executes commands in VS Code integrated terminals.
 * Strictly uses terminal.sendText() — no child_process usage.
 */
export class TerminalRunner {
  private terminals: Map<string, vscode.Terminal> = new Map();
  private readonly auditLogger: AuditLogger;
  private readonly securityManager: SecurityManager;
  private readonly variableResolver: VariableResolver;
  private readonly statusBarManager: StatusBarManager;

  /**
   * Creates a TerminalRunner with the required dependencies.
   * @param auditLogger - For logging command executions.
   * @param securityManager - For security checks.
   * @param variableResolver - For resolving variables in commands.
   * @param statusBarManager - For cooldown tracking.
   */
  constructor(
    auditLogger: AuditLogger,
    securityManager: SecurityManager,
    variableResolver: VariableResolver,
    statusBarManager: StatusBarManager,
  ) {
    this.auditLogger = auditLogger;
    this.securityManager = securityManager;
    this.variableResolver = variableResolver;
    this.statusBarManager = statusBarManager;
  }

  /**
   * Gets or creates a terminal for the given command configuration.
   * Reuses terminals when reuseTerminal is true.
   * @param cmd - The command configuration.
   * @param profile - Optional terminal profile name.
   * @returns A VS Code Terminal instance.
   */
  private getOrCreateTerminal(cmd: Command, profile?: string): vscode.Terminal {
    const terminalName = `cmdRunner: ${cmd.label}`;
    const terminalKey = cmd.reuseTerminal ? terminalName : `${terminalName}-${Date.now()}`;

    if (cmd.reuseTerminal) {
      const existing = this.terminals.get(terminalKey);
      if (existing) {
        // Check if terminal still exists
        const allTerminals = vscode.window.terminals;
        if (allTerminals.includes(existing)) {
          return existing;
        }
        this.terminals.delete(terminalKey);
      }
    }

    const options: vscode.TerminalOptions = {
      name: terminalName,
    };
    if (profile) {
      options.shellPath = profile;
    }

    const terminal = vscode.window.createTerminal(options);
    if (cmd.reuseTerminal) {
      this.terminals.set(terminalKey, terminal);
    }
    return terminal;
  }

  /**
   * Builds environment export commands to prepend before the main command.
   * Assumes a bash/zsh-compatible shell. Not suitable for cmd.exe or PowerShell.
   * @param env - Environment variable map.
   * @returns Shell export command string, or empty string if no vars.
   */
  private buildEnvPreamble(env: Record<string, string>): string {
    const entries = Object.entries(env);
    if (entries.length === 0) {
      return '';
    }
    const exports = entries.map(([k, v]) => `export ${k}=${JSON.stringify(v)}`).join(' && ');
    return `${exports} && `;
  }

  /**
   * Runs a command in a VS Code terminal.
   * @param cmd - The command configuration to execute.
   * @param options - Optional run options (env vars, terminal profile).
   * @returns Promise that resolves when the command is sent to the terminal.
   * @throws Error if the workspace is not trusted or command is blocked.
   */
  public async run(cmd: Command, options?: RunOptions): Promise<void> {
    this.securityManager.assertWorkspaceTrusted();

    if (this.statusBarManager.isInCooldown(cmd.id)) {
      await vscode.window.showWarningMessage(
        `cmdRunner: "${cmd.label}" is in cooldown. Please wait.`,
      );
      return;
    }

    const resolvedCommand = this.variableResolver.resolve(cmd.command);

    if (this.securityManager.isCommandBlocked(resolvedCommand)) {
      this.auditLogger.log('security_violation', {
        commandId: cmd.id,
        commandText: this.securityManager.maskSecrets(resolvedCommand),
        details: 'Command matched a blocked pattern',
      });
      throw new Error(`cmdRunner: Command "${cmd.label}" is blocked by security policy.`);
    }

    const envPreamble = options?.env ? this.buildEnvPreamble(options.env) : '';
    const fullCommand = `${envPreamble}${resolvedCommand}`;
    const maskedCommand = this.securityManager.maskSecrets(fullCommand);

    const terminal = this.getOrCreateTerminal(cmd, options?.terminalProfile ?? cmd.terminalProfile);
    terminal.show();
    terminal.sendText(fullCommand);

    this.statusBarManager.recordExecution(cmd.id);
    this.auditLogger.log('command_executed', {
      commandId: cmd.id,
      commandText: maskedCommand,
    });
  }

  /**
   * Disposes all tracked terminals.
   */
  public dispose(): void {
    this.terminals.clear();
  }
}
