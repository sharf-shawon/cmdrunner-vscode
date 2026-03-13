/**
 * @file statusBar.ts
 * @description Status bar UI lifecycle and button management for cmdRunner.
 * Creates, updates, and disposes VS Code status bar items for each command.
 */

import * as vscode from 'vscode';
import type { Command, CmdRunnerConfig, DisplayConfig } from './types';

/** Tracks a status bar item alongside its command id and last execution time */
interface StatusBarEntry {
  item: vscode.StatusBarItem;
  commandId: string;
  lastExecuted: number;
  cooldownMs: number;
}

/**
 * Manages the lifecycle of status bar buttons for cmdRunner.
 */
export class StatusBarManager {
  private items: Map<string, StatusBarEntry> = new Map();
  private config: CmdRunnerConfig;

  /**
   * Creates a StatusBarManager with the given configuration.
   * @param config - The validated cmdRunner configuration.
   */
  constructor(config: CmdRunnerConfig) {
    this.config = config;
  }

  /**
   * Builds the label or icon string for a status bar button.
   * @param cmd - The command configuration.
   * @param display - The display configuration.
   * @returns Formatted label string.
   */
  private buildLabel(cmd: Command, display?: DisplayConfig): string {
    const mode = display?.mode ?? 'both';
    const iconStr = cmd.icon ? `$(${cmd.icon}) ` : '';
    if (mode === 'icon' && cmd.icon) {
      return `$(${cmd.icon})`;
    }
    if (mode === 'text') {
      return cmd.label;
    }
    // 'both' mode
    return `${iconStr}${cmd.label}`;
  }

  /**
   * Creates or updates all status bar items based on current config.
   * Removes items for commands that no longer exist.
   * @param activeProfile - The name of the currently active profile.
   */
  public refresh(activeProfile: string): void {
    const display = this.config.display;
    const commands = this.config.commands.filter((cmd) => {
      if (!cmd.profiles || cmd.profiles.length === 0) {
        return true;
      }
      return cmd.profiles.includes(activeProfile);
    });

    const activeIds = new Set(commands.map((c) => c.id));

    // Remove items not in current command set
    for (const [id, entry] of this.items) {
      if (!activeIds.has(id)) {
        entry.item.dispose();
        this.items.delete(id);
      }
    }

    // Create or update items
    for (const cmd of commands) {
      const label = this.buildLabel(cmd, display);
      const alignment =
        cmd.alignment === 'right'
          ? vscode.StatusBarAlignment.Right
          : vscode.StatusBarAlignment.Left;

      let entry = this.items.get(cmd.id);
      if (!entry) {
        const item = vscode.window.createStatusBarItem(alignment, cmd.priority);
        item.command = `cmdrunner.run.${cmd.id}`;
        entry = { item, commandId: cmd.id, lastExecuted: 0, cooldownMs: cmd.cooldownMs };
        this.items.set(cmd.id, entry);
      }

      const item = entry.item;
      item.text = label;
      item.tooltip = cmd.tooltip ?? cmd.label;
      if (cmd.color) {
        item.color = cmd.color;
      }
      item.show();
    }
  }

  /**
   * Checks whether a command is currently in its cooldown period.
   * @param commandId - The command id to check.
   * @returns true if still in cooldown, false if ready to execute.
   */
  public isInCooldown(commandId: string): boolean {
    const entry = this.items.get(commandId);
    if (!entry) {
      return false;
    }
    const elapsed = Date.now() - entry.lastExecuted;
    return elapsed < entry.cooldownMs;
  }

  /**
   * Records the execution time for a command (for cooldown tracking).
   * @param commandId - The command id that was executed.
   */
  public recordExecution(commandId: string): void {
    const entry = this.items.get(commandId);
    if (entry) {
      entry.lastExecuted = Date.now();
    }
  }

  /**
   * Updates the internal configuration and refreshes status bar items.
   * @param newConfig - The updated configuration object.
   * @param activeProfile - The currently active profile name.
   */
  public updateConfig(newConfig: CmdRunnerConfig, activeProfile: string): void {
    this.config = newConfig;
    this.refresh(activeProfile);
  }

  /**
   * Hides all status bar items without disposing them.
   */
  public hideAll(): void {
    for (const entry of this.items.values()) {
      entry.item.hide();
    }
  }

  /**
   * Disposes all status bar items and clears the item map.
   */
  public dispose(): void {
    for (const entry of this.items.values()) {
      entry.item.dispose();
    }
    this.items.clear();
  }
}
