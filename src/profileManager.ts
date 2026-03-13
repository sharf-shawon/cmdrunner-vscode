/**
 * @file profileManager.ts
 * @description Manages environment profiles and profile switching for cmdRunner.
 * Handles merging of global env vars with profile-specific vars.
 */

import * as vscode from 'vscode';
import type { CmdRunnerConfig, Profile } from './types';
import type { AuditLogger } from './auditLog';

/**
 * Manages the active profile and environment variable merging.
 */
export class ProfileManager {
  private activeProfileName: string;
  private config: CmdRunnerConfig;
  private readonly auditLogger: AuditLogger;

  /**
   * Creates a ProfileManager with the given configuration and audit logger.
   * @param config - The validated cmdRunner configuration.
   * @param auditLogger - The audit logger instance for profile switch events.
   */
  constructor(config: CmdRunnerConfig, auditLogger: AuditLogger) {
    this.config = config;
    this.auditLogger = auditLogger;
    this.activeProfileName = config.activeProfile;
  }

  /**
   * Returns the names of all available profiles.
   * @returns Array of profile names.
   */
  public getProfileNames(): string[] {
    return Object.keys(this.config.profiles);
  }

  /**
   * Returns the currently active profile object, or undefined if none.
   * @returns The active Profile, or undefined.
   */
  public getActiveProfile(): Profile | undefined {
    return this.config.profiles[this.activeProfileName];
  }

  /**
   * Returns the name of the currently active profile.
   * @returns Active profile name string.
   */
  public getActiveProfileName(): string {
    return this.activeProfileName;
  }

  /**
   * Switches to a named profile and logs the switch event.
   * @param profileName - Name of the profile to switch to.
   * @throws Error if the profile does not exist.
   */
  public async switchProfile(profileName: string): Promise<void> {
    if (profileName !== 'default' && !this.config.profiles[profileName]) {
      throw new Error(`cmdRunner: Profile "${profileName}" not found.`);
    }
    const previous = this.activeProfileName;
    this.activeProfileName = profileName;
    this.auditLogger.log('profile_switched', { profile: profileName });
    await vscode.window.showInformationMessage(
      `cmdRunner: Switched from "${previous}" to "${profileName}" profile.`,
    );
  }

  /**
   * Returns merged environment variables: globalEnv + active profile env.
   * Profile vars override global vars of the same name.
   * @returns Merged environment variable record.
   */
  public getMergedEnv(): Record<string, string> {
    const global = this.config.globalEnv ?? {};
    const profile = this.getActiveProfile();
    return {
      ...global,
      ...(profile?.env ?? {}),
    };
  }

  /**
   * Updates the internal configuration (e.g., on hot reload).
   * @param newConfig - The new validated configuration object.
   */
  public updateConfig(newConfig: CmdRunnerConfig): void {
    this.config = newConfig;
    if (!this.config.profiles[this.activeProfileName] && this.activeProfileName !== 'default') {
      this.activeProfileName = newConfig.activeProfile;
    }
  }

  /**
   * Prompts the user to select a profile via a QuickPick UI.
   * @returns The selected profile name, or undefined if cancelled.
   */
  public async promptProfileSelection(): Promise<string | undefined> {
    const names = this.getProfileNames();
    if (names.length === 0) {
      await vscode.window.showInformationMessage('cmdRunner: No profiles defined.');
      return undefined;
    }
    const items = names.map((name) => {
      const profile = this.config.profiles[name];
      return {
        label: name,
        description: profile?.description ?? '',
        detail: name === this.activeProfileName ? '(active)' : '',
      };
    });
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a profile to activate',
      title: 'cmdRunner: Switch Profile',
    });
    return selected?.label;
  }
}
