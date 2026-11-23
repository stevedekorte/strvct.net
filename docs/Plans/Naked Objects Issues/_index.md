# Naked Objects Issues

Known places where framework model classes still cross the model/view boundary — touching view classes, browser globals, or UI state — plus the framework gaps that force such crossings.

**Status:** done for framework model code (2026-11-15): every class below is moved, and the ratchet test's baseline is empty. Two gaps remain open (a viewport accessor, a platform client id); close them when a model needs them. App class names were taken out of framework code on 2026-11-18 ([below](#app-names-in-framework-code)); `TestUndefinedClassNames` keeps them out (2026-11-23); a prompt example is left, waiting on a decision (the [Meta Plan](../Meta%20Plan/)'s next step 2). The browser-side changes were seen working in the app on 2026-11-19 (Meta Plan, step A).

The target is the model/view separation and **Platform Abstraction** rules in the framework guide (see [App Lifecycle](../../Lifecycle/App%20Lifecycle/index.html)): a model (`SvNode` and subclasses) should never reach into `document` / `window` / `navigator` / `localStorage` or reference view classes, so it stays headless-clean and the UI platform stays swappable.

## Framework model classes still touching the platform

| Class | What it does | Fix |
| --- | --- | --- |
| `SvErrorReport` | Read `navigator.userAgent`, `window.location`, `document.referrer` for a report | **Done:** `SvPlatform.userAgent()`, `pageUrl()`, `referrer()` |
| `SvFirestoreNode` | Read `window.location.hostname` and set a `window.__uo_firestore_emulator_configured__` flag | **Done:** the host from `SvPlatform.pageUrl()`; the configured databases in a `WeakSet` on the class |
| `SvAiParsedResponseMessage_parsing` | `document.createElement("div")` to find tags in HTML content | **Done:** the code was already commented out; deleted |
| `SvFirebaseFile` | `window.open(url)` | **Done:** posts `onRequestOpenUrl({ url })`; the user interface's `openUrl()` opens it (headless logs it) |
| `SvOpenAiStyleTransfer` | Built a file `<input>` to pick an image | **Done:** `await userInterface().asyncPickFile({ accept })` — a `File`, or null when the user cancels (the old code never settled on cancel) |
| `SvDefaultProxyServer` | Read `window.location` for its default config | **Done:** `configDictForPageUrl(SvPlatform.pageUrl())` |
| `SvApp.hardReloadForDataReset()` | `window.location.reload()` (guarded, no-op headless) | **Done:** the user interface's `reloadApp()` |
| `SvXhrRequest` | Read `window.location.protocol` to explain a failed request from `file:` | **Done:** `SvPlatform.pageUrl()` (null headless) |
| `SvgIconNode.svgIconView()` | Created an `SvgIconView` (its own TODO said so) | **Done:** it and `SvIconResources.iconWithName()` were unused — `SvgIconView.setIconName()` already finds the node; both deleted |
| `SvApp` | `localStorage` for the clear-on-boot flag, accepted reset epochs and boot store stats | **Done:** the user interface's `deviceValue()`. The web UI adopts a value still stored under its bare key (the old format) and moves it, so a pending flag or an accepted epoch survives; `tests/headless/TestDeviceValues.js` covers it |
| `SvErrorImageResolver` | Read `window.location.origin` | **Done:** `SvPlatform.pageUrl()` |

`SvResourceManager` also reads `sessionStorage`, but it runs at boot, below the model layer, so it is outside this rule.

## Framework gaps to close

These abstractions would let model code — framework *and* app — stay on the right side of the boundary:

- **Environment info** — **done:** `SvPlatform.pageUrl()` (a `URL`, null headless), `userAgent()` and `referrer()`. On `SvPlatform` rather than the user interface: it lives in boot, so it is there before `SvApp` exists (an error report at boot needs it), and models already ask it `isOnline()`.
- **Platform-provided client/device id** — one environment accessor instead of each model reading `sessionStorage`.
- **View-layer actions** — **done:** open a URL (`onRequestOpenUrl` note → `openUrl()`), pick a file (`asyncPickFile()`), write to the clipboard (`asyncCopyText()`, already there). A download is an open URL until something needs more.
- **Reload** — **done:** the user interface's `reloadApp()` (it existed; `SvApp` now uses it).
- **Viewport accessor** — models that need size should receive it from the view rather than reading `window.innerWidth` / `devicePixelRatio`.
- **User alerts** — already available: post `onRequestUserAlert` and the UI presents it (panel in the browser, log headless). Models should use it instead of `window.alert`.

Closing these unblocks the same cleanups in any app built on STRVCT.

## Keeping it from coming back

**Done:** `tests/headless/TestPlatformGlobalsInModels.js` scans `source/library/` (skipping `view/`, `node_views/`, `node/app/ui/`, `browser-only/` and `_unused/`, and comments) for `window.`, `navigator.`, `localStorage`, `sessionStorage` and `document.` followed by a DOM member, so a local variable called `document` doesn't count. It fails on any use its baseline (`tests/headless/fixtures/platformGlobalsInModels.json`) doesn't list, and says when the baseline can shrink.

Low-level platform utilities are not model code reading UI state, and the test's `ALLOWED` table lists them with a reason each: canvas work in `Image_ideal`, `SvImageBorderRemover` and `SvImageMosaic`; HTML parsing in `String_ideal`; `AudioContext` in `SvSimpleSynth` and `SvWaContext`; `document.fonts` in `SvFont`; DOM output in `SvHtmlStreamReader`. Two had a native global that works in both environments and moved to it: `Object_puuid` uses `globalThis.crypto` and `String_ideal` uses `btoa` / `atob` (which threw headless before). Nothing was reimplemented.

## App names in framework code

The same boundary seen from the other side: the framework must not know the app built on it. An audit on 2026-11-18 found app class names in framework code. Fixed in strvct `9bf3aadd`:

- `SvAiParsedResponseMessage_voiceNarration.session()` looked up the app's global `UoSession`, a ReferenceError under any other app or headless. Nothing called it, and the app's response message defines its own; removed.
- `SvAiParsedResponseMessage` set the app's `UoChatInputTile` as its tile. Removed; it inherits `SvChatMessageTile`, which behaves the same for it (the app tile's one addition, applying `cssVariableDict()`, does nothing for a node that returns none). The app's response message still sets its own tile.
- `SvFirebaseStorageService` kept a commented-out `UoBuildEnv` block, and its missing-bucket error named it (and said "found" for not found).
- About 30 comments, and the record-store test fixture's type names, used app classes as examples; they now use generic ones.

**Left, pending a decision:** the tool instructions every AI conversation receives (`SvToolDefinitions`, "How to Use These Definitions") use the app's `rollRequest` tool and `#/definitions/UoRollRequestMessage` as the worked example. Changing it changes the game's prompt. Either a neutral example, or one built from the conversation's first real tool definition (always accurate, but the prompt then varies with the tool list).

**The ratchet test — built 2026-11-23.** `tests/headless/TestUndefinedClassNames.js` fails on any name framework code uses as a class (`extends X`, `new X(`, `instanceof X`, `X.clone()` / `X.shared()` / `X.prototype`, `setSlotType("X")`, `SvGlobals.get("X")`, `setFinalInitProto(X)`) that no framework file defines and that is not a platform API. It names no app prefix, so it would catch another app's names as well as this one's. It has no baseline: its first run found no app names, and two real faults, both fixed (an audio file read through `SvResourceFile` made an `SvSoundResource`, a class that never existed; a slot type was spelled `"NumbeStringr"`). Comments and prose in strings are not read, so the prompt example above is left to the decision, and comments to review.
