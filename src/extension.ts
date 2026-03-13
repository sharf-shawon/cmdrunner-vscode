/**
 * @file extension.ts
 * @description Main activation entry point for the cmdRunner VS Code extension.
 * Wires together all modules and handles the complete extension lifecycle.
 */

import * as vscode from 'vscode';
import { loadConfig, resolveConfigPath } from './configLoader';
import { SecurityManager } from './security';
import { AuditLogger } from './auditLog';
import { StatusBarManager } from './statusBar';
import { TerminalRunner } from './terminalRunner';
import { StartupRunner } from './startupRunner';
import { ProfileManager } from './profileManager';
import { VariableResolver } from './variableResolver';
import { CmdRunnerTaskProvider } from './taskBridge';
import { registerWalkthrough } from './walkthrough';
import type { Command } from './types';

/** Singleton audit logger shared across the extension */
let auditLogger: AuditLogger;
/** Singleton status bar manager */
let statusBarManager: StatusBarManager | undefined;
/** Singleton profile manager */
let profileManager: ProfileManager | undefined;
/** Singleton terminal runner */
let terminalRunner: TerminalRunner | undefined;
/** File watcher for .cmdrunner hot reload */
let fileWatcher: vscode.FileSystemWatcher | undefined;
/** Task provider registration */
let taskProviderRegistration: vscode.Disposable | undefined;

/**
 * Activates the cmdRunner extension.
 * Called by VS Code when the extension is first activated.
 * @param context - The extension context provided by VS Code.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  auditLogger = new AuditLogger();
  auditLogger.log('extension_activated');

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return;
  }

  // Register walkthrough commands
  registerWalkthrough(context);

  // Load configuration for the first workspace folder
  const workspaceFolder = workspaceFolders[0];
  const configFilePath = resolveConfigPath(workspaceFolder.uri);

  await loadExtensionForWorkspace(context, workspaceFolder, configFilePath);

  // Set up hot reload file watcher
  fileWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(workspaceFolder, '.cmdrunner'),
  );

  fileWatcher.onDidChange(async () => {
    await reloadConfig(workspaceFolder, configFilePath);
  });
  fileWatcher.onDidCreate(async () => {
    await reloadConfig(workspaceFolder, configFilePath);
  });
  fileWatcher.onDidDelete(() => {
    statusBarManager?.dispose();
    statusBarManager = undefined;
  });

  context.subscriptions.push(fileWatcher);

  // Register commands
  const reloadCmd = vscode.commands.registerCommand('cmdrunner.reload', async () => {
    await reloadConfig(workspaceFolder, configFilePath);
    await vscode.window.showInformationMessage('cmdRunner: Configuration reloaded.');
  });

  const switchProfileCmd = vscode.commands.registerCommand('cmdrunner.switchProfile', async () => {
    if (!profileManager) {
      await vscode.window.showWarningMessage('cmdRunner: Not yet initialized.');
      return;
    }
    const selected = await profileManager.promptProfileSelection();
    if (selected) {
      await profileManager.switchProfile(selected);
      statusBarManager?.refresh(profileManager.getActiveProfileName());
    }
  });

  const showAuditLogCmd = vscode.commands.registerCommand('cmdrunner.showAuditLog', async () => {
    const logPath = auditLogger.getLogPath();
    try {
      const doc = await vscode.workspace.openTextDocument(logPath);
      await vscode.window.showTextDocument(doc, { preview: true });
    } catch {
      await vscode.window.showWarningMessage(`cmdRunner: Audit log not found at ${logPath}`);
    }
  });

  context.subscriptions.push(reloadCmd, switchProfileCmd, showAuditLogCmd);
}

/**
 * Loads the extension for a specific workspace folder.
 * @param context - Extension context.
 * @param workspaceFolder - The workspace folder to load for.
 * @param configFilePath - Absolute path to the config file.
 */
async function loadExtensionForWorkspace(
  context: vscode.ExtensionContext,
  workspaceFolder: vscode.WorkspaceFolder,
  configFilePath: string,
): Promise<void> {
  let loadedConfig;
  try {
    loadedConfig = loadConfig(configFilePath);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await vscode.window.showErrorMessage(msg);
    return;
  }

  const { config } = loadedConfig;
  // Reconfigure audit logger with settings from the loaded config
  auditLogger = new AuditLogger(config.audit);
  auditLogger.log('config_loaded', { workspaceFolder: workspaceFolder.uri.fsPath });

  const securityManager = new SecurityManager(
    config.security ?? {
      blockedPatterns: [],
      requireWorkspaceTrust: true,
      checksums: {},
      maskSecrets: true,
    },
  );

  try {
    securityManager.assertWorkspaceTrusted();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await vscode.window.showErrorMessage(msg);
    return;
  }

  const resolver = new VariableResolver(workspaceFolder.uri.fsPath);

  profileManager = new ProfileManager(config, auditLogger);
  statusBarManager = new StatusBarManager(config);
  terminalRunner = new TerminalRunner(auditLogger, securityManager, resolver, statusBarManager);

  // Register per-command run commands
  for (const cmd of config.commands) {
    registerCommandRunner(context, cmd);
  }

  statusBarManager.refresh(profileManager.getActiveProfileName());

  // Set up task bridge
  const taskProvider = new CmdRunnerTaskProvider(config, resolver);
  taskProviderRegistration?.dispose();
  taskProviderRegistration = vscode.tasks.registerTaskProvider('cmdrunner', taskProvider);
  context.subscriptions.push(taskProviderRegistration);

  // Run startup commands
  const startupRunner = new StartupRunner(config, terminalRunner, auditLogger);
  await startupRunner.run(profileManager.getMergedEnv());
}

/**
 * Registers a run command for a single cmdRunner command.
 * @param context - Extension context for subscription tracking.
 * @param cmd - The command to register.
 */
function registerCommandRunner(context: vscode.ExtensionContext, cmd: Command): void {
  const disposable = vscode.commands.registerCommand(`cmdrunner.run.${cmd.id}`, async () => {
    if (!terminalRunner || !profileManager) {
      return;
    }
    try {
      await terminalRunner.run(cmd, { env: profileManager.getMergedEnv() });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await vscode.window.showErrorMessage(msg);
    }
  });
  context.subscriptions.push(disposable);
}

/**
 * Reloads the configuration and updates all managers.
 * @param workspaceFolder - The workspace folder to reload for.
 * @param configFilePath - Absolute path to the config file.
 */
async function reloadConfig(
  workspaceFolder: vscode.WorkspaceFolder,
  configFilePath: string,
): Promise<void> {
  let loadedConfig;
  try {
    loadedConfig = loadConfig(configFilePath);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await vscode.window.showErrorMessage(msg);
    return;
  }

  const { config } = loadedConfig;
  auditLogger.log('config_loaded', { workspaceFolder: workspaceFolder.uri.fsPath });

  if (statusBarManager) {
    statusBarManager.updateConfig(config, profileManager?.getActiveProfileName() ?? 'default');
  }
  if (profileManager) {
    profileManager.updateConfig(config);
  }
}

/**
 * Deactivates the cmdRunner extension.
 * Called by VS Code when the extension is deactivated.
 */
export function deactivate(): void {
  auditLogger?.log('extension_deactivated');
  statusBarManager?.dispose();
  terminalRunner?.dispose();
  fileWatcher?.dispose();
  taskProviderRegistration?.dispose();
}
