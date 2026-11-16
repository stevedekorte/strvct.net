# Naked Objects Issues

Known places where framework model classes still cross the model/view boundary — touching view classes, browser globals, or UI state — plus the framework gaps that force such crossings.

**Status:** in progress (2026-11-15). Environment info is on `SvPlatform`, five of the nine classes are moved, and the ratchet test is in. Left: the view actions (`SvFirebaseFile`, `SvOpenAiStyleTransfer`), `SvApp`'s use of `localStorage`, and deciding about the low-level platform utilities (below).

The target is the model/view separation and **Platform Abstraction** rules in the framework guide (see [App Lifecycle](../../Lifecycle/App%20Lifecycle/index.html)): a model (`SvNode` and subclasses) should never reach into `document` / `window` / `navigator` / `localStorage` or reference view classes, so it stays headless-clean and the UI platform stays swappable.

## Framework model classes still touching the platform

| Class | What it does | Fix |
| --- | --- | --- |
| `SvErrorReport` | Read `navigator.userAgent`, `window.location`, `document.referrer` for a report | **Done:** `SvPlatform.userAgent()`, `pageUrl()`, `referrer()` |
| `SvFirestoreNode` | Read `window.location.hostname` and set a `window.__uo_firestore_emulator_configured__` flag | **Done:** the host from `SvPlatform.pageUrl()`; the configured databases in a `WeakSet` on the class |
| `SvAiParsedResponseMessage_parsing` | `document.createElement("div")` to find tags in HTML content | **Done:** the code was already commented out; deleted |
| `SvFirebaseFile` | `window.open(url)` | A view action: the model exposes the URL |
| `SvOpenAiStyleTransfer` | Builds a file `<input>` to pick an image | A view action: the UI picks the file and hands the model a blob |
| `SvDefaultProxyServer` | Read `window.location` for its default config | **Done:** `configDictForPageUrl(SvPlatform.pageUrl())` |
| `SvApp.hardReloadForDataReset()` | `window.location.reload()` (guarded, no-op headless) | **Done:** the user interface's `reloadApp()` |
| `SvXhrRequest` | Read `window.location.protocol` to explain a failed request from `file:` | **Done:** `SvPlatform.pageUrl()` (null headless) |
| `SvgIconNode.svgIconView()` | Created an `SvgIconView` (its own TODO said so) | **Done:** it and `SvIconResources.iconWithName()` were unused — `SvgIconView.setIconName()` already finds the node; both deleted |
| `SvApp` | `localStorage` for the clear-on-boot flag, accepted reset epochs and boot store stats | The user interface's `deviceValue()`, reading the old keys once so a pending flag or an accepted epoch survives the change |
| `SvErrorImageResolver` | Read `window.location.origin` | **Done:** `SvPlatform.pageUrl()` |

`SvResourceManager` also reads `sessionStorage`, but it runs at boot, below the model layer, so it is outside this rule.

## Framework gaps to close

These abstractions would let model code — framework *and* app — stay on the right side of the boundary:

- **Environment info** — **done:** `SvPlatform.pageUrl()` (a `URL`, null headless), `userAgent()` and `referrer()`. On `SvPlatform` rather than the user interface: it lives in boot, so it is there before `SvApp` exists (an error report at boot needs it), and models already ask it `isOnline()`.
- **Platform-provided client/device id** — one environment accessor instead of each model reading `sessionStorage`.
- **View-layer actions** — open a URL, download, write to the clipboard, pick a file. A model exposes the data or asks through a notification; the UI performs it. Covers `SvFirebaseFile`, `SvOpenAiStyleTransfer` and downloads.
- **Reload** — **done:** the user interface's `reloadApp()` (it existed; `SvApp` now uses it).
- **Viewport accessor** — models that need size should receive it from the view rather than reading `window.innerWidth` / `devicePixelRatio`.
- **User alerts** — already available: post `onRequestUserAlert` and the UI presents it (panel in the browser, log headless). Models should use it instead of `window.alert`.

Closing these unblocks the same cleanups in any app built on STRVCT.

## Keeping it from coming back

**Done:** `tests/headless/TestPlatformGlobalsInModels.js` scans `source/library/` (skipping `view/`, `node_views/`, `node/app/ui/`, `browser-only/` and `_unused/`, and comments) for `window.`, `navigator.`, `localStorage`, `sessionStorage` and `document.` followed by a DOM member, so a local variable called `document` doesn't count. It fails on any use its baseline (`tests/headless/fixtures/platformGlobalsInModels.json`) doesn't list, and says when the baseline can shrink.

Besides the table's open rows, the baseline holds low-level platform utilities: canvas work in `Image_ideal`, `SvImageBorderRemover` and `SvImageMosaic`; `btoa` / `atob` and HTML escaping in `String_ideal`; `crypto` in `Object_puuid`; `AudioContext` in `SvSimpleSynth` and `SvWaContext`; `document.fonts` in `SvFont`; DOM output in `SvHtmlStreamReader`. These are not model code reading UI state, and most already guard for headless. Each needs a decision: a headless-safe equivalent (`globalThis.crypto`, `OffscreenCanvas`, Node's `Buffer`), a move to `browser-only/`, or staying in the baseline as allowed.
