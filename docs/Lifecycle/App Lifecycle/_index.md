# App Lifecycle

`SvApp` singleton initialization sequence, extension points, runtime environment hooks, user alert routing, and UI readiness promises.

## Overview

`SvApp` is the application singleton. It owns the persistent object pool, root model object graph, and top-level user interface (`SvUserInterface`). Subclasses override a small set of hook methods to initialize application models and user interfaces in a clean, predictable order.

<svg viewBox="0 0 820 280" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="alc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="fill" x="25" y="20" width="240" height="50"/>
  <text x="40" y="40" class="b">1. setupModel()</text>
  <text x="40" y="58" class="dim">Store open, root object exists</text>

  <line class="flow" x1="265" y1="45" x2="290" y2="45" marker-end="url(#alc)"/>

  <rect class="fill" x="290" y="20" width="240" height="50"/>
  <text x="305" y="40" class="b">2. setupUi()</text>
  <text x="305" y="58" class="dim">Model ready; UI instantiated</text>

  <line class="flow" x1="530" y1="45" x2="555" y2="45" marker-end="url(#alc)"/>

  <rect class="fill" x="555" y="20" width="240" height="50"/>
  <text x="570" y="40" class="b">3. appDidInit()</text>
  <text x="570" y="58" class="dim">Posts "appDidInit" note</text>

  <line class="flow" x1="675" y1="70" x2="675" y2="85"/>
  <line class="flow" x1="410" y1="85" x2="675" y2="85"/>
  <line class="flow" x1="410" y1="85" x2="410" y2="100" marker-end="url(#alc)"/>

  <rect class="fill" x="290" y="100" width="240" height="50"/>
  <text x="305" y="120" class="b">4. afterAppUiDidInit()</text>
  <text x="305" y="138" class="dim">UI visible; processes URL params</text>

  <text x="410" y="185" text-anchor="middle" class="dim">Model initialization is fully separated from UI rendering; app runs identically in browser or headless Node.js.</text>
</svg>

---

## Extension Point Hook Methods

| Hook Method | When Executed | Purpose & Usage |
|---|---|---|
| `setupModel()` | Object pool store is open; root model exists. | Initialize application data models; create or fetch top-level subnodes. |
| `setupUi()` | Model object graph is ready. | Customize top-level UI presentation and window settings. |
| `appDidInit()` | Everything is wired up and live. | Post-initialization tasks; posts `"appDidInit"` notification. |
| `afterAppUiDidInit()` | UI elements are mounted and visible. | Parse URL search parameters via `handleSearchParams(params)`. |
| `handleSearchParams(params)` | Called automatically from `afterAppUiDidInit()`. | Process URL query parameters for deep-linking. |

### Top-Level Root Subnode Persistence (`rootSubnodeWithTitleForProto`):
To instantiate top-level application root nodes safely across reloads:

```javascript
setupModel () {
    super.setupModel();
    // Creates on first run; reuses from storage on subsequent loads
    this._tasksNode = this.rootSubnodeWithTitleForProto("Tasks", TaskManagerNode);
}
```

---

## Waiting for Initialization & UI Readiness

### 1. App Initialization Promise (`didInitPromise`)
Code that needs to wait for complete application setup awaits `didInitPromise()`:

```javascript
await SvApp.shared().didInitPromise();
// App is now fully initialized and live
```

### 2. UI Readiness Promise (`promiseUserInterfaceReady`)
UI-dependent code (e.g. sending navigation selection requests) awaits `promiseUserInterfaceReady()`:

```javascript
const ui = await SvApp.shared().promiseUserInterfaceReady();
if (ui.providesNavigation()) {
    // Safe to send navigation requests
    this.postNoteNamed("onRequestSelectNodePath", { path: ["Workspace", "Tasks"] });
}
```

---

## Runtime Environment Event Hooks

`SvApp` captures environment lifecycle signals and translates them into environment-agnostic hooks on `SvModel`:

| Model Hook Method (`SvModel`) | Browser Signal Event | Headless Signal Event | Purpose & Action |
|---|---|---|---|
| `onAppDidGoOnline()` | `online` event | — | Network connectivity restored |
| `onAppDidGoOffline()` | `offline` event | — | Network connectivity lost |
| `onAppWillSuspend()` | `visibilitychange` (hidden) | — | App backgrounded; flush volatile state |
| `onAppWillTerminate()` | `beforeunload` (sync) | `SIGTERM` / `SIGINT` | Shutdown/unload cleanup. Return `true` to block unload. |

---

## Model User Alerts (`onRequestUserAlert`)

Domain models request user notifications without referencing UI or DOM classes:

```javascript
this.postNoteNamed("onRequestUserAlert", {
    name: "syncFailure",
    title: "Sync Error",
    message: "Failed to sync changes with cloud store.",
    level: "error" // "info" | "warning" | "error"
});
```

`SvUserInterface` observes `onRequestUserAlert`. In the browser (`SvWebUserInterface`), it opens an `SvPanelView` overlay; in headless Node.js, it logs the alert to console.

---

## Related Guides

- [Headless Execution](../Headless%20Execution/index.html): Running applications under Node.js.
- [Boot Sequence](../Boot%20Sequence/index.html): CAM resource loading and script evaluation.
