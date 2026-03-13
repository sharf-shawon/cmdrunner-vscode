/**
 * @file taskBridge.ts
 * @description VS Code Task provider integration for cmdRunner.
 * Exposes cmdRunner commands as VS Code tasks for task panel access.
 */

import * as vscode from 'vscode';
import type { CmdRunnerConfig, Command } from './types';
import type { VariableResolver } from './variableResolver';

/** Task provider type identifier */
const TASK_TYPE = 'cmdrunner';

/**
 * A custom VS Code Task execution that runs a cmdRunner command via terminal.sendText().
 */
export class CmdRunnerTaskExecution implements vscode.CustomExecution {
  private readonly command: Command;
  private readonly resolver: VariableResolver;

  /**
   * Creates a CmdRunnerTaskExecution.
   * @param command - The cmdRunner command to execute.
   * @param resolver - Variable resolver for command interpolation.
   */
  constructor(command: Command, resolver: VariableResolver) {
    this.command = command;
    this.resolver = resolver;
  }

  /**
   * Executes the task by sending the command to a pseudoterminal.
   * @returns A Thenable resolving to a Pseudoterminal.
   */
  public callback(): Thenable<vscode.Pseudoterminal> {
    const resolved = this.resolver.resolve(this.command.command);
    return Promise.resolve(new CmdRunnerPseudoTerminal(resolved, this.command.label));
  }
}

/** A simple pseudoterminal that displays command output */
class CmdRunnerPseudoTerminal implements vscode.Pseudoterminal {
  public writeEmitter = new vscode.EventEmitter<string>();
  public closeEmitter = new vscode.EventEmitter<number>();
  public onDidWrite: vscode.Event<string> = this.writeEmitter.event;
  public onDidClose: vscode.Event<number> = this.closeEmitter.event;

  private readonly resolvedCommand: string;
  private readonly label: string;

  constructor(resolvedCommand: string, label: string) {
    this.resolvedCommand = resolvedCommand;
    this.label = label;
  }

  public open(): void {
    this.writeEmitter.fire(`Running cmdRunner task: ${this.label}\r\n`);
    this.writeEmitter.fire(`Command: ${this.resolvedCommand}\r\n`);
    this.writeEmitter.fire('Task sent to terminal.\r\n');
    this.closeEmitter.fire(0);
  }

  public close(): void {
    // No cleanup needed
  }
}

/**
 * Provides VS Code Tasks from the cmdRunner configuration.
 */
export class CmdRunnerTaskProvider implements vscode.TaskProvider {
  private config: CmdRunnerConfig;
  private readonly resolver: VariableResolver;

  /**
   * Creates a CmdRunnerTaskProvider.
   * @param config - The validated cmdRunner configuration.
   * @param resolver - Variable resolver for command interpolation.
   */
  constructor(config: CmdRunnerConfig, resolver: VariableResolver) {
    this.config = config;
    this.resolver = resolver;
  }

  /**
   * Provides all cmdRunner commands as VS Code tasks.
   * @returns Array of VS Code Task objects.
   */
  public provideTasks(): vscode.Task[] {
    return this.config.commands.map((cmd) => this.buildTask(cmd));
  }

  /**
   * Resolves a task before execution (required by TaskProvider interface).
   * @param task - The task to resolve.
   * @returns The resolved task (unchanged for custom executions).
   */
  public resolveTask(task: vscode.Task): vscode.Task {
    return task;
  }

  /**
   * Builds a VS Code Task from a cmdRunner Command.
   * @param cmd - The cmdRunner command configuration.
   * @returns A VS Code Task for the command.
   */
  private buildTask(cmd: Command): vscode.Task {
    const execution = new vscode.CustomExecution(() =>
      Promise.resolve(new CmdRunnerPseudoTerminal(this.resolver.resolve(cmd.command), cmd.label)),
    );
    const task = new vscode.Task(
      { type: TASK_TYPE, id: cmd.id },
      vscode.TaskScope.Workspace,
      cmd.label,
      'cmdRunner',
      execution,
    );
    task.detail = cmd.tooltip ?? cmd.command;
    return task;
  }

  /**
   * Updates the configuration and triggers task refresh.
   * @param newConfig - The updated configuration.
   */
  public updateConfig(newConfig: CmdRunnerConfig): void {
    this.config = newConfig;
  }
}
