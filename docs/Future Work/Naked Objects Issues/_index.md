# Naked Objects Issues

Known places where framework model classes still cross the model/view boundary — touching view classes, browser globals, or UI state — plus the framework gaps that force such crossings.

The target is the model/view separation and **Platform Abstraction** rules in the framework guide (see [App Lifecycle](../Lifecycle/App%20Lifecycle/index.html)): a model (`SvNode` and subclasses) should never reach into `document` / `window` / `navigator` / `localStorage` or reference view classes, so it stays headless-clean and the UI platform stays swappable.

## Framework model classes still touching the platform

- **`SvErrorReport`** (`SvTitledNode`) reads `navigator.userAgent`, `window.location.*`, and `document.referrer` to build a report. Error reports genuinely need this environment context, but a model shouldn't read browser globals directly — the platform layer should supply them.
- **`SvSubObjectPool`** reads/writes `sessionStorage` for a client id. A persistent client/device id is environment state that should be injected, not read from a browser global inside a storage model.
- **`SvFirestoreNode`** uses a `window.__…__` global flag to guard emulator configuration.
- **`SvAiParsedResponseMessage`** (parsing) calls `document.createElement` for HTML handling — DOM in a message model.
- Media services (`SvYouTubeAudioPlayer`, `SvYouTubePlayerFrame`, `SvLeonardoRefImage`) touch the DOM / clipboard directly; several are view-adjacent and some siblings are unused.

## Framework gaps to close

These abstractions would let model code — framework *and* app — stay on the right side of the boundary:

- **Platform-provided client/device id** — one environment accessor instead of each model reading `sessionStorage`.
- **Environment info for error reports** — the platform / UI layer injects user-agent, URL, and referrer so `SvErrorReport` doesn't read them.
- **View-layer download & clipboard actions** — a model exposes the data; the UI performs the download / clipboard write (currently done with `document.createElement("a")` / `navigator.clipboard` inside models).
- **Viewport accessor** — models that need size should receive it from the view rather than reading `window.innerWidth` / `devicePixelRatio`.
- **User alerts** — already available: post `onRequestUserAlert` and the UI presents it (panel in the browser, log headless). Models should use it instead of `window.alert`.

Closing these unblocks the same cleanups in any app built on STRVCT.
