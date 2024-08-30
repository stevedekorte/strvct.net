<head>
  <title>Strvct Documentation</title>
</head>

<div style="color: yellow; margin-bottom: 5em; width:100%; text-align: center; border: 1px solid yellow; padding: 1em; border-radius: 1em;">incomplete draft</div>

## Getting Started

### For New Repos:

To set up the STRVCT submodule, run the following command from within your project folder:

```
git submodule add https://github.com/stevedekorte/strvct.net.git strvct
```

If you plan to deploy your app on GitHub Pages, add a `.nojekyll` file to your root folder.

### Setup

The build system is currently configured for Visual Studio Code (VSCode). To open the project, open the root source folder in VSCode.

1. Start the local HTTPS web server by running:

   ```
   node local-web-server/main.js
   ```

   in the root source folder.

2. Use the "launch local HTTPS" run option in VSCode to launch the app. It will open Chrome, and you'll need to ignore the SSL warning the first time (as we're using a local server).

### Recommended VSCode Extensions

To facilitate debugging and coding, install these VSCode extensions:

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

## Project Framework Overview

This project required the development of several custom frameworks:

- Meta object framework (slots)
- Extensive OO extensions to common classes
- Desktop-like web OO UI framework
- Architecture and protocol for model-to-view naked object UI, standard field components
- Miller column-inspired stacking UI framework
- Notifications system
- Auto-syncing system/protocol between model and views
- Integrated theming system
- Client-side object persistence / object pool framework
- Gesture recognition framework
- Package builder & boot and client-side caching system
- Auto resource management, loading, and caching system
- Common protocol for resources (fonts, sounds, images, icons, JSON data files)
- Transparent mutation observers for common classes
  -->

[1]: http://downloads.nakedobjects.net/resources/Pawson%20thesis.pdf "Pawson, R., & Matthews, R. (2000). Naked Objects (Technical Report)"
