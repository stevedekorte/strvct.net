<head>
  <title>Strvct: Getting Started Guide</title>
</head>

<div style="color: yellow; margin-bottom: 5em; width:100%; text-align: center; border: 1px solid yellow; padding: 1em; border-radius: 1em;">incomplete draft</div>

# Strvct: Getting Started Guide

## Introduction

Strvct is designed to be used as a submodule in new projects.

To set up the **Strvct** git submodule, run the following command from within your project folder:

```
git submodule add https://github.com/stevedekorte/strvct.net.git strvct
```

If you plan to deploy your app on GitHub Pages, add a `.nojekyll` file to your root folder.

### How to Build and Run with your project

The build system is currently configured for Visual Studio Code (VSCode) or forks of VSCode, such as [Cursor](https://cursor.sh/). To open the project, open the root source folder in VSCode.

#### Start the Local Web Server

1. Start the local HTTPS web server by running:

   ```
   node local-web-server/main.js
   ```

   in the root source folder.

#### Launch the App

2. Use the "launch local HTTPS" run option in VSCode to launch the app. It will open Chrome, and you'll need to ignore the SSL warning the first time (as we're using a local server).

### Recommended VSCode Extensions

To help with debugging and coding, install these VSCode extensions:

- ESLint (from Microsoft)
- JavaScript Debugger Nightly (from Microsoft)
- JSON (by ZainChen)

### Setting Up ESLint

If you don't have ESLint installed:

```
npm init @eslint/config -g
```

This installs it globally. For more information, visit: https://eslint.org/docs/latest/user-guide/getting-started

To use ESLint with ECMAScript 6 (ES6), add a `.eslintrc` configuration file to your home directory:

```json
{
  "env": {
    "es6": true
  }
}
```

If issues persist:

1. Verify this VSCode setting: `eslint.enable: true`
2. Run: `eslint init`
