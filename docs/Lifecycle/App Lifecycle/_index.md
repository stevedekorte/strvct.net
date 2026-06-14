# App Lifecycle

SvApp initialization, extension points, and readiness signaling.

## Overview

`SvApp` is the application singleton. It owns the persistent store, the root model object, and the top-level UI. Subclasses override a small number of hook methods to set up their model and UI without needing to manage the initialization order themselves.

## Extension Points

| Method | When it runs | What to do here |
|--------|-------------|-----------------|
| `setupModel()` | Store is open, root object exists | Initialize your data model, add top-level nodes |
| `setupUi()` | Model is ready | Customize the UI setup |
| `appDidInit()` | Everything is wired up | Post-init work, the app is now live |
| `afterAppUiDidInit()` | UI is visible | Handle URL parameters, trigger initial navigation |
| `handleSearchParams(params)` | Called from `afterAppUiDidInit` | Process URL query parameters |

Use `rootSubnodeWithTitleForProto(title, proto)` to add top-level objects — it creates them on first run and reuses them from storage on subsequent loads.

## Waiting for Readiness

The app exposes a promise for code that needs to wait:

```javascript
await SvApp.shared().didInitPromise();
// App is now fully initialized
```

For synchronous checks:

```javascript
if (SvApp.hasShared() && SvApp.shared().hasDoneAppInit()) {
    // Safe to interact with app
}
```

## Notifications

- **`"appDidInit"`** — Posted when initialization is complete. Useful for observers that need to run setup code after the app is ready.
- **`"onAppDeveloperModeChangedNote"`** — Posted when developer mode is toggled.

## Runtime Lifecycle Events

Beyond startup, the app reacts to environment events at runtime. These arrive as **environment-agnostic hooks on `SvModel`** (default no-ops — override in your model), routed through `SvApp`. The environment layer translates concrete signals into them, so the same overrides work in a browser and headless. A model implementing these never touches the DOM, `window`, or any view class, so it stays headless-testable.

| Hook (on `SvModel`) | Browser source | Headless source | Purpose |
|--------|----------------|-----------------|---------|
| `onAppDidGoOnline()` | `online` event | — | Connectivity restored |
| `onAppDidGoOffline()` | `offline` event | — | Connectivity lost |
| `onAppWillSuspend()` | `visibilitychange` (hidden) | — | App backgrounded — flush volatile state |
| `onAppWillTerminate() → Boolean` | `beforeunload` | `SIGTERM` / `SIGINT` | Shutdown/unload — do synchronous cleanup; return `true` to request a block (e.g. the browser's unsaved-changes prompt) |

Routing and translation:

- `SvApp.onApp*` fans each event out to `this.model()` — and is the natural place to notify other participants later.
- **Browser:** `SvWebUserInterface` owns an `SvWindowListener` + `SvDocumentListener` (delegate = itself) via the event system and maps the DOM events. `beforeunload` is delivered **synchronously** to its delegate method, which returns `false` to drive the framework's `preventDefault()` — so `onAppWillTerminate()` returning `true` produces the prompt, and the cleanup runs in time (a queued notification would fire too late).
- **Headless:** `SvHeadlessUserInterface` maps process termination signals to `onAppWillTerminate()`.

## User Alerts

Any model can ask that a message be shown to the user — without referencing views, the DOM, or the concept of a user. It posts a notification; the UI layer presents it (or logs it, headless):

```javascript
this.postNoteNamed("onRequestUserAlert", {
    name: "someMachineId",   // for logs/telemetry — not shown to the user
    title: "Heading",         // optional
    message: "The text shown to the user.",
    level: "error"            // "info" | "warning" | "error"
});
```

`SvUserInterface` observes `onRequestUserAlert` and calls `presentUserAlert(info)`. `SvWebUserInterface` opens an `SvPanelView`; the base (headless) implementation logs it. The presenting view reference stays in the UI layer, never in the model that posted the alert.
