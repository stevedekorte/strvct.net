<div style="color: yellow; margin-bottom: 5em; width:100%; text-align: center; border: 1px solid yellow; padding: 1em; border-radius: 1em;">incomplete draft</div>

# Strvct: Getting Started Guide (for developers)

[TOC]

## Introduction

Strvct is designed to be used as a submodule within your projects.

## Setup

### Strvct submodule

To set up the **Strvct** git submodule, run the following command from within your project folder:

```
git submodule add https://github.com/stevedekorte/strvct.net.git strvct
```

If you plan to deploy your app on GitHub Pages, add a `.nojekyll` file to your root folder.

### Build System

#### How it works

Strvct is designed to manage your project's resource loading and build system. You'll need to configure your project to use it. This involves adding '\_imports.json' files to each of your project's source folders which contain files you want to be loaded by Strvct. Strvct's VSCode build script will find these import files and:

- create an `build/index.json` file containing an ordered index of the imported files with entries recording each files path, size, and content hash
- create a `build/\_cam.json.zip` file containing a compressed version of a dictionary of file-hash:file-content entries

#### Setting up your build script

The build system is currently configured for Visual Studio Code (VSCode) or forks of VSCode, such as [Cursor](https://cursor.sh/). To open the project, open the root source folder in VSCode.

## Running / Debugging

#### Start the Local Web Server

1. Start the local HTTPS web server by running:

   ```
   node local-web-server/main.js
   ```

   in the root source folder.

#### Launch the App

2. Use the "launch local HTTPS" run option in VSCode to launch the app. It will open Chrome, and you'll need to ignore the SSL warning the first time (as we're using a local server).

## Recommended VSCode Extensions

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
