/**
 * @file walkthrough.ts
 * @description Registers the onboarding walkthrough for cmdRunner.
 * Creates the initial .cmdrunner file template for new users.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/** Default .cmdrunner template for new users */
const DEFAULT_CONFIG_TEMPLATE = `{
  // cmdRunner configuration file
  // See https://github.com/sharf-shawon/cmdrunner-vscode for full documentation
  "version": "1",
  "commands": [
    {
      "id": "example-build",
      "label": "Build",
      "command": "npm run build",
      "icon": "tools",
      "tooltip": "Run npm build",
      "cooldownMs": 1000
    },
    {
      "id": "example-test",
      "label": "Test",
      "command": "npm test",
      "icon": "beaker",
      "tooltip": "Run tests",
      "cooldownMs": 1000
    }
  ]
}
`;

/**
 * Registers the cmdRunner walkthrough and related commands.
 * @param context - The extension context for registering disposables.
 */
export function registerWalkthrough(context: vscode.ExtensionContext): void {
  const openWalkthroughCmd = vscode.commands.registerCommand(
    'cmdrunner.openWalkthrough',
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        await vscode.window.showErrorMessage('cmdRunner: No workspace folder is open.');
        return;
      }
      const folder = workspaceFolders[0];
      const configPath = path.join(folder.uri.fsPath, '.cmdrunner');
      if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, DEFAULT_CONFIG_TEMPLATE, 'utf8');
        const doc = await vscode.workspace.openTextDocument(configPath);
        await vscode.window.showTextDocument(doc);
        await vscode.window.showInformationMessage(
          'cmdRunner: Created .cmdrunner template. Edit it and reload with cmdRunner: Reload Configuration.',
        );
      } else {
        const doc = await vscode.workspace.openTextDocument(configPath);
        await vscode.window.showTextDocument(doc);
      }
    },
  );

  context.subscriptions.push(openWalkthroughCmd);
}
