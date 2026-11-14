# Naked Objects Issues

Known places where framework model classes still cross the model/view boundary — touching view classes, browser globals, or UI state — plus the framework gaps that force such crossings.

**Status:** open; list checked against the source 2026-11-13 (the YouTube and Leonardo media classes it used to name are gone). **Order:** add the platform accessors below, move each class onto them, then add a ratchet test so new crossings are noticed.

The target is the model/view separation and **Platform Abstraction** rules in the framework guide (see [App Lifecycle](../../Lifecycle/App%20Lifecycle/index.html)): a model (`SvNode` and subclasses) should never reach into `document` / `window` / `navigator` / `localStorage` or reference view classes, so it stays headless-clean and the UI platform stays swappable.

## Framework model classes still touching the platform

| Class | What it does | Fix |
| --- | --- | --- |
| `SvErrorReport` | Reads `navigator.userAgent`, `window.location`, `document.referrer` for a report | The UI layer supplies environment info |
| `SvFirestoreNode` | Reads `window.location.hostname` and sets a `window.__uo_firestore_emulator_configured__` flag | A class slot for "configured"; the host comes from the environment. The `uo` in the flag's name is app knowledge in the framework |
| `SvAiParsedResponseMessage_parsing` | `document.createElement("div")` to find tags in HTML content | Parse without the DOM (an HTML parser that also runs headless), or move tag extraction to the view |
| `SvFirebaseFile` | `window.open(url)` | A view action: the model exposes the URL |
| `SvOpenAiStyleTransfer` | Builds a file `<input>` to pick an image | A view action: the UI picks the file and hands the model a blob |
| `SvDefaultProxyServer` | Reads `window.location` for its default config | The environment supplies the origin |
| `SvApp.hardReloadForDataReset()` | `window.location.reload()` (guarded, no-op headless) | An environment action, alongside the lifecycle hooks |
| `SvXhrRequest` | Reads `window.location.protocol` to explain a failed request from `file:` | The environment supplies the origin |
| `SvgIconNode.svgIconView()` | Creates an `SvgIconView` (its own TODO says so) | View discovery: the icon view finds the node, not the reverse |

`SvResourceManager` also reads `sessionStorage`, but it runs at boot, below the model layer, so it is outside this rule.

## Framework gaps to close

These abstractions would let model code — framework *and* app — stay on the right side of the boundary:

- **Environment info** — origin (protocol, host, port), user agent and referrer, supplied by the UI layer (`SvWebUserInterface` in the browser, `SvHeadlessUserInterface` headless). Covers `SvErrorReport`, `SvDefaultProxyServer`, `SvXhrRequest` and `SvFirestoreNode`.
- **Platform-provided client/device id** — one environment accessor instead of each model reading `sessionStorage`.
- **View-layer actions** — open a URL, download, write to the clipboard, pick a file. A model exposes the data or asks through a notification; the UI performs it. Covers `SvFirebaseFile`, `SvOpenAiStyleTransfer` and downloads.
- **Reload** — an environment action next to the existing lifecycle hooks.
- **Viewport accessor** — models that need size should receive it from the view rather than reading `window.innerWidth` / `devicePixelRatio`.
- **User alerts** — already available: post `onRequestUserAlert` and the UI presents it (panel in the browser, log headless). Models should use it instead of `window.alert`.

Closing these unblocks the same cleanups in any app built on STRVCT.

## Keeping it from coming back

A headless test in the style of `tests/headless/TestDuckTypedChecks.js`: scan model and service code (`source/library/`, skipping `view/`, `node/node_views/`, `node/app/ui/`, `browser-only/` and `_unused/`) for `window.`, `navigator.`, `localStorage`, `sessionStorage` and `document.` followed by a DOM method or property (local variables called `document`, as in the Firestore classes, must not count). The baseline starts with the table above and fails on any new entry.
