# Create a .cmdrunner Configuration File

Add a `.cmdrunner` file to your workspace root to define your terminal commands.

## Example

```json
{
  "version": "1",
  "commands": [
    {
      "id": "build",
      "label": "Build",
      "command": "npm run build",
      "icon": "tools"
    }
  ]
}
```

After creating the file, use **cmdRunner: Reload Configuration** (`Ctrl+Shift+P` → `cmdRunner: Reload`) to load it.
