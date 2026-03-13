/**
 * @file variableResolver.ts
 * @description Variable interpolation for cmdRunner commands.
 * Supports ${workspaceFolder}, ${gitBranch}, ${env:VAR}, ${config:key}, and more.
 */

import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

/** Map of variable names to resolver functions */
type VariableResolverMap = Map<string, () => string>;

/**
 * Resolves variable placeholders in command strings.
 * Supports:
 * - ${workspaceFolder} - absolute path to the workspace folder
 * - ${workspaceFolderBasename} - basename of the workspace folder
 * - ${file} - currently open file
 * - ${fileBasename} - basename of the currently open file
 * - ${fileDirname} - directory of the currently open file
 * - ${fileExtname} - extension of the currently open file
 * - ${gitBranch} - current git branch name
 * - ${env:VAR_NAME} - environment variable
 * - ${date} - current date (YYYY-MM-DD)
 * - ${time} - current time (HH:MM:SS)
 * - ${datetime} - current datetime (ISO 8601)
 */
export class VariableResolver {
  private readonly workspaceFolder: string;
  private readonly resolvers: VariableResolverMap;

  /**
   * Creates a VariableResolver for the given workspace folder.
   * @param workspaceFolder - Absolute path to the workspace root.
   */
  constructor(workspaceFolder: string) {
    this.workspaceFolder = workspaceFolder;
    this.resolvers = this.buildResolvers();
  }

  /**
   * Builds the map of static variable resolvers.
   * @returns Map of variable names to resolver functions.
   */
  private buildResolvers(): VariableResolverMap {
    const map: VariableResolverMap = new Map();

    map.set('workspaceFolder', () => this.workspaceFolder);
    map.set('workspaceFolderBasename', () => path.basename(this.workspaceFolder));
    map.set('date', () => new Date().toISOString().slice(0, 10));
    map.set('time', () => new Date().toTimeString().slice(0, 8));
    map.set('datetime', () => new Date().toISOString());

    map.set('file', () => {
      const editor = vscode.window.activeTextEditor;
      return editor?.document.uri.fsPath ?? '';
    });

    map.set('fileBasename', () => {
      const editor = vscode.window.activeTextEditor;
      return editor ? path.basename(editor.document.uri.fsPath) : '';
    });

    map.set('fileDirname', () => {
      const editor = vscode.window.activeTextEditor;
      return editor ? path.dirname(editor.document.uri.fsPath) : '';
    });

    map.set('fileExtname', () => {
      const editor = vscode.window.activeTextEditor;
      return editor ? path.extname(editor.document.uri.fsPath) : '';
    });

    map.set('gitBranch', () => this.resolveGitBranch());

    return map;
  }

  /**
   * Resolves the current git branch by reading .git/HEAD.
   * @returns Current branch name or empty string if not in a git repo.
   */
  private resolveGitBranch(): string {
    try {
      const headPath = path.join(this.workspaceFolder, '.git', 'HEAD');
      if (!fs.existsSync(headPath)) {
        return '';
      }
      const headContent = fs.readFileSync(headPath, 'utf8').trim();
      const match = /^ref: refs\/heads\/(.+)$/.exec(headContent);
      return match?.[1] ?? headContent.slice(0, 7);
    } catch {
      return '';
    }
  }

  /**
   * Resolves an environment variable.
   * @param varName - Name of the environment variable.
   * @returns The variable value or empty string if not set.
   */
  private resolveEnvVar(varName: string): string {
    return process.env[varName] ?? '';
  }

  /**
   * Resolves a VS Code configuration value.
   * @param key - Dot-separated configuration key.
   * @returns The configuration value as string.
   */
  private resolveConfigVar(key: string): string {
    const parts = key.split('.');
    const section = parts.slice(0, -1).join('.');
    const property = parts[parts.length - 1] ?? '';
    const config = vscode.workspace.getConfiguration(section || undefined);
    const value: unknown = config.get(property);
    if (value === undefined || value === null) {
      return '';
    }
    return String(value);
  }

  /**
   * Resolves all variable placeholders in a command string.
   * @param command - The command string with possible variable placeholders.
   * @returns The command with all variables resolved.
   */
  public resolve(command: string): string {
    return command.replace(/\$\{([^}]+)\}/g, (_match, varExpr: string) => {
      if (varExpr.startsWith('env:')) {
        return this.resolveEnvVar(varExpr.slice(4));
      }
      if (varExpr.startsWith('config:')) {
        return this.resolveConfigVar(varExpr.slice(7));
      }
      const resolver = this.resolvers.get(varExpr);
      return resolver ? resolver() : _match;
    });
  }
}
