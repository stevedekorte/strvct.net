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
