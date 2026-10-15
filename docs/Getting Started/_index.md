# Getting Started

Setup, integration, directory conventions, build pipeline, and running your first Strvct application.

## Overview

Strvct is designed to be integrated directly into your application codebase as a **Git submodule**. It runs as a client-side single-page application in the browser and requires no compile-step template transforms, virtual DOM bundlers, or complex build toolchains.

---

## Prerequisites

Before starting, ensure you have the following installed:
- **Git** (with submodule support)
- **Node.js** (v18+ recommended)
- **Cursor / VSCode** (for Chrome DevTools debugging support)

---

## Adding Strvct to Your Project

From your project's root directory, add Strvct as a Git submodule:

```bash
git submodule add https://github.com/stevedekorte/strvct.net.git strvct
```

If deploying your application to GitHub Pages or static hosts that run Jekyll by default, create a `.nojekyll` file in your root folder:

```bash
touch .nojekyll
```

---

## Directory Structure & Conventions

A standard Strvct application uses the following directory layout:

```
your-project/
├── strvct/              # Framework submodule
├── app/                 # Application domain models & source code
│   ├── _imports.json    # Declares app source files
│   └── Character.js     # Your domain classes
├── resources/           # Binary assets (icons, images, sounds)
├── build/               # Generated CAM artifacts (git-ignored)
│   ├── _index.json      # Resource metadata catalog with SHA-256 hashes
│   └── _cam.json.zip    # Zip bundle of hashed assets
├── _imports.json        # Root imports file (links strvct + app)
├── index.html           # HTML entry point
└── .nojekyll            # Prevents GitHub Pages Jekyll processing
```

---

## Declaring Imports (`_imports.json`)

Strvct uses `_imports.json` files to discover source files and manage dependency order instead of standard ES module imports. Every folder containing JavaScript or CSS resources specifies an `_imports.json` array:

```json
[
    "_css.css",
    "strvct/_imports.json",
    "app/_imports.json"
]
```

### Import Rules:
- Paths are relative to the directory containing the `_imports.json` file.
- Direct file paths (e.g., `"Character.js"`, `"_css.css"`) are included in order.
- Nested `_imports.json` paths (e.g., `"app/_imports.json"`) are resolved recursively.

---

## The Build Pipeline (Content-Addressable Memory)

Strvct uses a **Content-Addressable Memory (CAM)** build system. The build process scans the root `_imports.json` tree and generates runtime resource bundles in the `build/` directory.

<svg viewBox="0 0 820 170" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="ags" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="box" x="25" y="20" width="240" height="50"/>
  <text x="40" y="40" class="b">_imports.json Tree</text>
  <text x="40" y="58" class="dim">Root &amp; nested source imports</text>

  <line class="flow" x1="265" y1="45" x2="290" y2="45" marker-end="url(#ags)"/>

  <rect class="fill" x="290" y="20" width="240" height="50"/>
  <text x="305" y="40" class="b">ImportsIndexer</text>
  <text x="305" y="58" class="dim">Scans paths &amp; SHA-256 hashes</text>

  <line class="flow" x1="530" y1="45" x2="555" y2="45" marker-end="url(#ags)"/>

  <rect class="fill" x="555" y="20" width="240" height="50"/>
  <text x="570" y="40" class="b">build/ Catalog</text>
  <text x="570" y="58" class="dim">_index.json &amp; _cam.json.zip</text>

  <line class="flow" x1="675" y1="70" x2="675" y2="85"/>
  <line class="flow" x1="410" y1="85" x2="675" y2="85"/>
  <line class="flow" x1="410" y1="85" x2="410" y2="100" marker-end="url(#ags)"/>

  <rect class="box" x="290" y="100" width="240" height="50"/>
  <text x="305" y="120" class="b">Browser Runtime</text>
  <text x="305" y="138" class="dim">SvResourceManager &amp; HashCache</text>
</svg>

### Running the Build Command:
To run the source code indexer manually:

```bash
node ./strvct/source/boot/index-builder/ImportsIndexer.js
```

To index non-code media resources (icons, audio):

```bash
node ./strvct/source/boot/index-builder/SvResourceIndexer.js ./resources/icons ./resources/sounds
```

If your project includes a `justfile`, you can run:

```bash
just build
```

---

## Running Locally

Strvct includes a lightweight local HTTP/HTTPS web server (`CliWebServer.js`).

Start the development server:

```bash
node ./strvct/webserver/CliWebServer.js --port 8000 --secure false
```

### Command Flags:
- `--port <number>`: Sets the local server port (default: `8000`).
- `--secure <true|false>`: Enables HTTPS with self-signed certificates or HTTP mode.
- `--config <path>`: Optional server configuration file path.

Open `http://localhost:8000` in your browser to load the application.

---

## Chrome DevTools & Debugging

Because Strvct evaluates source files dynamically via the CAM loader, it appends `sourceURL` annotations to evaluated scripts. This enables full native browser debugging in Chrome DevTools or Cursor/VSCode:

- **Breakpoints:** Set breakpoints directly in your source JavaScript files in Chrome DevTools Sources tab.
- **Call Stacks:** Complete stack traces map directly back to original file paths and line numbers.

### Cursor / VSCode `launch.json` Configuration:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "chrome",
            "request": "launch",
            "name": "Debug Strvct App",
            "url": "http://localhost:8000",
            "webRoot": "${workspaceFolder}"
        }
    ]
}
```

---

## Creating Your First Annotated Node

Create your first domain model class inheriting from `SvStorableNode`:

```javascript
// app/Task.js
(class Task extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("title", "New Task");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);   // Persists to IndexedDB
            slot.setSyncsToView(true);       // Live UI updates
            slot.setCanEditInspection(true); // Editable in Property Inspector
        }
        {
            const slot = this.newSlot("isCompleted", false);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
        }
    }

    initPrototype () {
        this.setTitle("Task");
        this.setShouldStore(true);
    }

}.initThisClass());
```

Add `"app/Task.js"` to your `app/_imports.json`, run `just build`, and reload your browser. Strvct will automatically generate editable form tiles, handle local persistence, and make your task node navigable in the Miller column browser!

---

## Related Guides

- [Technical Overview](../Technical%20Overview/): High-level architecture and design philosophy.
- [Nodes](../Nodes/): Deep dive into `SvNode` inheritance and subnode management.
- [Slots](../Slots/): Complete guide to property declaration and metadata annotations.
