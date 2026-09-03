# STRVCT Framework Guide

STRVCT is a naked-objects framework for JavaScript: you write annotated domain
model classes (nodes with slots), and the framework derives the UI, persistence,
navigation, and model↔view synchronization from them. `README.md` has the pitch;
`docs/` has the depth. This file holds the rules and the lessons.

When **reviewing changes or PRs** to this framework, also read `REVIEW.md`
(repo root): design altitude, capability-vs-state gating, retroactive slot
defaults, view re-creation tolerance, async/timing hazards, and the evidence
bar for framework changes.

## Orientation

### Repository layout

```
source/boot/            Boot loader, resource manager, index builder (see source/boot/CLAUDE.md)
source/library/ideal/   Base runtime: ProtoClass, slots, protocols, categories on JS builtins
source/library/node/    Model layer: SvNode, SvStorableNode, fields, node_views, storage (object pools)
source/library/view/    View layer: SvDomView hierarchy (view/dom), events, geometry, webbrowser
source/library/notification/  SvNotificationCenter, SvBroadcaster, SvSyncScheduler
source/library/storage/ SvPersistentAtomicMap / SvPersistentAsyncMap (IndexedDB-backed key-value layers)
source/library/cloudfs/ Cloud file system sync (Firebase Storage backend, write-ahead log)
source/library/services/  AI providers (Anthropic, Gemini, …), Firebase, media, proxies
source/library/orm/     Server-only SQL ORM (see source/library/orm/CLAUDE.md)
source/library/{i18n,errors,credentials,resources,image,audio,media,cli}/
external-libs/          Vendored third-party source, loaded via _imports.json
docs/                   Generated site (edit _index.md, not index.html); colvmn/ is the generator
tests/headless/         Standalone Node.js tests, one file per test
webserver/              Minimal HTTPS dev server
build/                  Generated _index.json / _cam.json.zip — never hand-edit
npm-pkg/                Bootstrap package so external build systems can load strvct; not the framework
```

### Version control

This directory is a **git submodule of the app repo** (`.git` here is a gitdir
pointer into the parent's `.git/`). Run git commands from the strvct root, not
the parent. A framework change ships as a strvct commit plus a submodule pin
bump in the app repo, in the same release — see "Important" at the end.

### Commands

```bash
# Rebuild the resource index (required after adding/removing files or editing _imports.json;
# headless tests boot from build/_index.json and fail confusingly if it is stale)
node source/boot/index-builder/ImportsIndexer.js

# Headless tests: no runner — each file is a standalone script. `npm test` is a stub.
node tests/headless/TestCategorySlots.js

# Lint (eslint.config.js; see Coding Style)
npx eslint source tests

# Regenerate docs/ HTML, sitemap.xml, llms.txt, llms-full.txt after editing any _index.md/_index.json
node colvmn/static-gen.js

# Class hierarchy → docs/class-hierarchy-tree.txt
just class-tree
```

If a headless boot fails with `Image is not defined`, the `canvas` native module
in `node_modules/` was built for another platform — run `npm install`.

### Where to read more

`docs/` covers: Naked Objects (design essay), Technical Overview, Implementation
Overview, Getting Started, Comparing to React, Lifecycle (Boot, Node, App,
Persistence, View Synchronization, Headless Execution), Notifications, Persistence
(Local Object Pools, Cloud Object Pools, Local and Cloud Blob Storage), Views,
Slots, Nodes, Events and Gestures, Services, Programming Idioms (Async Patterns,
Categories, Protocols, Style Guide), Accessibility, Internationalization,
Inspectors and Debugging, Reference, Future Work. When the docs cover a topic in
more detail than this file, prefer the docs.

## Model / View Separation (CRITICAL)

STRVCT is a **naked objects** framework. The entire UI is auto-generated from the model node graph, and the view layer observes models via the notification system. Crossing this boundary in the wrong direction breaks the pattern, makes models harder to test (they pull in browser globals), and produces views that can't be re-skinned.

**Models (`SvNode` and subclasses) MUST NOT:**

- Reference view classes (`SvDomView`, `SvTile`, `SvBrowserView`, `SvNavView`, `SvStackView`, etc.).
- Reach into browser globals: `document`, `window`, `navigator`, `localStorage`, `IndexedDB` directly.
- Use `SvWebBrowserWindow` or any class under `library/view/`.
- Inspect viewport size, touch state, focus, hover, or any UI state.
- Drive layout, animation, or scrolling decisions.

**Views (`SvDomView` subclasses, `SvTile`, `SvNavView`, etc.) DO:**

- Observe model nodes via notifications (`didUpdateSlot*`, `setSyncsToView`, etc.).
- Read viewport / device state and decide layout, gestures, animations.
- Translate user interactions (taps, drags, key presses) into model action method calls.
- Make navigation/compaction/responsive decisions based on viewport.

**When a model needs UI-state-dependent behavior**, the view passes state in via a method call or argument. Example: instead of a node calling `SvWebBrowserWindow.shared().width()` to decide whether to auto-collapse on selection, the view layer (which already knows the viewport) does that decision and tells the node what to do, or the view itself performs the navigation.

**Allowed model-side notifications**: posting domain events (`postOnRequestNavigateToNode`, custom `SvNotification`s) is fine — the model is announcing facts, not querying UI state. The view layer subscribes and decides what to do.

This boundary is load-bearing for the framework's automatic-UI claim. Treat any model file `import` or reference that touches view classes / browser globals as a bug.

## Platform Abstraction (swappable UIs)

Use the naked-objects pattern as much as possible, and keep STRVCT **between the app and the UI platform** — so the same app can run under different UIs (a web DOM UI, a terminal UI, or headless) by swapping the user-interface implementation, not the app. Keep platform assumptions out of app and model code:

- **App code targets STRVCT, not the browser.** Reach the UI platform only through framework abstractions (`SvUserInterface` / `SvWebUserInterface` / `SvHeadlessUserInterface`, `SvDomView`, `SvWebBrowserWindow`, …) so an alternate UI (e.g. terminal) can be dropped in. Don't hardcode platform behavior where the framework provides an abstraction.
- **Consume platform events through the STRVCT event system — never raw listeners.** DOM / window / document / mouse / keyboard and app-lifecycle events flow through the framework's event listeners (`SvWindowListener`, `SvDocumentListener`, `SvMouseListener`, …), which dispatch synchronously to delegate methods and/or post notifications. Do **not** call `addEventListener` directly in app or model code — that bypasses the abstraction and pins the app to one platform.
- **React to app lifecycle via environment-agnostic hooks.** Models override `SvModel` lifecycle hooks (`onAppDidGoOnline` / `onAppDidGoOffline`, `onAppWillSuspend`, `onAppWillTerminate`) routed through `SvApp`; the environment layer translates concrete signals (browser events, headless `SIGTERM`/`SIGINT`) into them. The same model code then works under any UI and headless. See `docs/Lifecycle/App Lifecycle`.
- **Wait on UI readiness — don't poll.** When model code needs the UI ready (e.g. to post a navigation request), `await SvApp.shared().promiseUserInterfaceReady()` and check `ui.providesNavigation()`. Never poll the DOM or retry. Headless resolves with a non-navigable UI, so the code cleanly skips UI-only work.

## Classes

### Definition pattern

Every class is an ES6 class inside an IIFE that registers itself:

```javascript
(class MyClass extends ParentClass {

    static jsonSchemaDescription () {
        return "One sentence: what an instance represents.";
    }

    initPrototypeSlots () {
        // slot declarations — see Slots
    }

    initPrototype () {
        // class-wide configuration: setShouldStore, setTitle, setNodeCanAddSubnode, …
    }

    init () {
        super.init();
        // primitives only
        return this;
    }

    finalInit () {
        super.finalInit();
        // child objects and relationships
        return this;
    }

}.initThisClass());
```

- Model classes always include `static jsonSchemaDescription()`.
- **`initPrototypeSlots()` and `initPrototype()` NEVER call `super`.** The framework calls them on every class in the hierarchy, base to derived. `init()`, `finalInit()`, `afterInit()` DO call `super`.
- Return `this` from initialization methods.
- Singletons expose `static shared()`. Class-level properties use `this.newClassSlot()`.
- Framework classes carry the `Sv` prefix (categories on JS builtins and `external-libs/` are exempt).

### Categories

A category extends an existing class with more methods from a separate file, using `.initThisCategory()` instead of `.initThisClass()`:

```javascript
(class SvJsonGroup_patches extends SvJsonGroup {
    applyJsonPatches (patches) { /* … */ }
}.initThisCategory());
```

- File and class name: `BaseClass_categoryName` (`SvJsonGroup_patches.js`). The name should say what the category adds.
- **Loading order is a hard requirement**: the base class must appear before its categories in `_imports.json`.
- A category may declare its own slots and setup via `initPrototypeSlots_<categoryName>()` and `initPrototype_<categoryName>()` (e.g. `initPrototypeSlots_errorRecovery`). The framework installs them when the category is initialized; `tests/headless/TestCategorySlots.js` guards this.
- Use categories to keep base classes focused and to separate concerns (patches, client state, streaming, …), not to hide app-specific logic in the framework.

### Protocols

Interfaces are `Protocol` subclasses named `NameProtocol`; conformance is verified at runtime. See `docs/Programming Idioms/Protocols`.

## Slots

Declare instance properties in `initPrototypeSlots()`, one block scope per slot:

```javascript
{
    const slot = this.newSlot("propertyName", defaultValue);
    slot.setSlotType("String");           // type; used for validation and editor selection
    slot.setShouldStoreSlot(true);        // persist
    slot.setCanEditInspection(true);      // editable in the inspector
    slot.setSyncsToView(true);            // re-sync the view when it changes
}
```

Other common configuration:

- `setFinalInitProto(SomeClass)` — create an instance during `finalInit()` **unless one was loaded from storage**. This is how child objects get defaults without a separate "restored" code path.
- `setIsSubnode(true)` — the slot's value is also a child in `subnodes`, so it appears in navigation.
- `setIsSubnodeField(true)` — show the slot as a navigable field tile; the data stays in the slot.
- `this.newSubnodeFieldSlot("name", SomeClass)` (on `SvJsonGroup` subclasses) — declares a stored, JSON-archived, view-synced slot with `setFinalInitProto(SomeClass)` in one call.
- `setLabel("…")` — display label (translated at the model→view boundary).

### Subnodes vs. subnode fields

Two ways to hold child objects; pick one per class:

1. **Stored subnodes** (`setIsSubnode(true)` on a slot, or a collection with `setShouldStoreSubnodes(true)`): a real parent–child relationship; the children live in the `subnodes` array. Use for collections of similar objects — typically classes extending `SvJsonArrayNode`.
2. **Subnode fields** (`setIsSubnodeField(true)`): temporary tiles for UI navigation; the data stays in the parent's slots and the field objects are not stored. Use for structured objects with named properties — typically `SvStorableNode` subclasses with `setShouldStoreSubnodes(false)`.

**Do not combine them.** A node that uses subnode field slots must not call `setShouldStoreSubnodes(true)`; field tiles are UI organization, not data. If you need stored children, make them real node types.

## Instance Lifecycle

Three phases, identical for new and deserialized objects:

1. `init()` — primitives and slot defaults.
2. `finalInit()` — complex child objects and relationships. `setFinalInitProto` slots are filled here, only if not already loaded.
3. `afterInit()` — the object graph is complete.

- New instances: `SomeClass.clone()` runs all three.
- From storage: `instanceFromRecordInStore()` allocates and runs `init()`; `loadFromRecord()` fills stored slots (references resolved by puuid); then `finalInit()` and, once the whole graph is loaded, `afterInit()`.
- Schema evolution follows from the above: a **new slot** on an old record gets its default; a **removed slot** in a record is dropped with a console warning and the object is re-saved; a stored value the setter **rejects** is logged and the default kept; a record whose **class no longer exists** loads as `null`. **Renames** look like remove+add and lose data unless the old slot is kept declared long enough to copy it in `finalInit()`. There is no versioned migration system.

## Notifications

The reactivity backbone. Components: `SvNotification` (name, sender, info), `SvNotificationCenter` (global dispatcher), `SvObservation` (a subscription; held weakly, so there is no unsubscribe step), `SvBroadcaster`, and `SvSyncScheduler` (batches and dedupes sync actions at the end of the event loop and detects sync loops).

Common hooks on nodes: `didUpdateSlot(aSlot, oldValue, newValue)` for any slot; `didUpdateSlot<SlotName>(oldValue, newValue)` for one slot (e.g. `didUpdateSlotAxis`) — the framework calls it by name, so declaring the method is the subscription; `didChangeSubnodeList()` when children are added, removed, or reordered; `scheduleSyncToView()` to coalesce a view refresh into the end of the event loop.

```javascript
// post
SvNotificationCenter.shared().post(this, "myNotificationName", { extraInfo: value });

// observe
const observation = SvNotificationCenter.shared().newObservation()
    .setObserver(this)
    .setName("myNotificationName")
    .setTarget(targetObject)
    .setAction("handleNotification");
```

Communication pattern: model → view by notification (push); view → model by calling action methods on nodes (command); model ↔ model through the notification center (publish/subscribe). See `docs/Notifications/`.

## Views

The UI is **not precompiled, templated, or code-generated**. Views are created lazily at runtime as the user navigates — a node gets a view only when it becomes visible — and the view tree is a live projection of the model: adding/removing subnodes or changing slots is reflected immediately through notifications.

- `SvNodeView` connects a node to its DOM representation; `SvViewableNode` is the node-side base; `SvTileContainer` and the column/stack views manage layout.
- **View discovery is by naming convention with superclass fallback.** For a node class `Contact`, a list looks for `ContactTile` and a selected node looks for `ContactView`; if neither exists the search walks up the node's superclass chain (`firstAncestorClassWithPostfix`) to the framework defaults. Nodes can override with `nodeViewClassName` / `nodeTileClassName` or `nodeViewClass()`.
- View hierarchy mirrors node hierarchy. `setNodeIsVertical(true/false)` sets a node's subnode layout direction.
- Styling is programmatic (`setBackgroundColor()`, …) with themes as swappable dictionaries; nodes can define CSS variables that views apply.
- Views never modify model internals; they call action methods the model defines.

The `SvDomView` hierarchy, one capability per layer:
`SvElementDomView → SvCssDomView → SvSubviewsDomView → SvListenerDomView → SvVisibleDomView → SvGesturableDomView → SvResponderDomView → SvControlDomView → SvSelectableDomView → SvEditableDomView → SvDomView → SvFlexDomView → SvStyledDomView → SvNodeView`

See `docs/Views/`, `docs/Lifecycle/View Synchronization/`, and `docs/Naked Objects/`.

## DOM Reads and Writes: never interleave them (CRITICAL for view code)

Reading geometry after writing to the DOM, in the same synchronous block, forces
the browser to lay out immediately. Do it a few times in one event handler and a
keystroke costs hundreds of milliseconds.

This has bitten us for real: typing in a multiplayer client became unusable, with
**eight Forced Layouts inside a single Key Up event (637ms)**. The cause was
`SvScrollView.applyScrollIntent()` — reached from a ResizeObserver, so it ran when
typing resized the chat input — reading `scrollHeight` / `clientHeight` /
`scrollTop` / a computed `padding-bottom`, then writing `scrollTop`, then reading
all of it again to decide a button's visibility, then writing that button's
`display`.

### The rules

1. **Snapshot, then write.** Take every measurement you need up front, into
   locals or a small object, then perform the writes. Never call a method that
   measures after you have written. If a helper needs geometry, give it the
   snapshot — add a `(geometry)` parameter rather than letting it measure again.
2. **Never measure a value you own.** If this view is the only writer of a style,
   track what it set. `anchorPaddingPx()` used to read back a `padding-bottom`
   that the scroll view itself had written — a `getComputedStyle` call, four times
   per invocation, for a number it already knew.
3. **Know what counts as a read.** Not just `element().scrollTop` — the framework
   accessors (`clientHeight()`, `offsetTop()`, `scrollHeight()`,
   `boundingClientRect()`) all measure, and so does anything routed through
   `getCssProperty()` (`paddingBottom()`, `display()`, …) because that calls
   `getComputedStyle`. `getAttribute()` measures too.
4. **A log line that mentions geometry IS a read.** Building the string measures,
   whether or not the message ends up printed. Gate the whole statement:

   ```javascript
   if (this.isScrollDebugging()) {                    // gate FIRST
       console.log("scrollTop " + e.scrollTop);       // read only when logging
   }
   ```

   And prefer values already in hand over re-measuring for the message.
5. **Treat ResizeObserver, scroll and input handlers as hot paths.** They fire per
   frame or per keystroke. A write inside a ResizeObserver callback that changes
   size re-triggers the observer — check for that feedback loop.
6. **Diagnostics are not exempt, and rewrites reinstate them.** The ScrollDebug
   logs were made opt-in on 2026-07-16 and came back ungated in the 2026-07-29
   rewrite of the same file. When you rewrite a file, re-check the fixes that were
   already applied to it.

### Verifying

`SvThrashDetector` is wired into the DOM read/write accessors. Load any page with
**`?thrash=1`** (anywhere in the url — after the hash is fine) and it reports,
once per animation frame, every write-then-read pair with the reading code's stack.
It `console.warn`s that it is ON when it arms, and heartbeats every 5s with either
"no forced layouts — clean" or a count, so a quiet console is a RESULT rather than
an ambiguity about whether it is running. Use it
before claiming a reflow fix works — reasoning about this from source is
unreliable, which is exactly how the regression above shipped.

Note the detector only sees reads that go through the framework accessors. Direct
`element().scrollTop` style access bypasses it, so prefer the accessors in new
code.

## Persistence

Object graphs persist through `SvPersistentObjectPool` over a `SvPersistentAtomicMap` cache layer, on IndexedDB in the browser and on an IndexedDB shim (`node-indexeddb-lmdb`) in Node.

- Opt in per class with `this.setShouldStore(true)` and per slot with `slot.setShouldStoreSlot(true)`; collections add `setShouldStoreSubnodes(true)`.
- Objects are referenced by persistent unique ids (puuids). Slot changes call `didMutate()`, which marks the object dirty; dirty objects commit in a batch at the end of the event loop. Unreachable objects are garbage-collected.
- Serialization hooks, if you must customize them: `recordForStore(aStore)`, `loadFromRecord(aRecord, aStore)`, `instanceFromRecordInStore(aRecord, aStore)`, `refValue(v)` / `unrefValue(v)`.
- Load order is the lifecycle above: allocate + `init()` → `loadFromRecord()` → `finalInit()` → `afterInit()`.
- Pools can additionally sync to Firebase Storage through a write-ahead log of delta files (`source/library/cloudfs/`). See `docs/Persistence/`.

**Storage serialization is not JSON exchange.** `serializeToJson()` / `deserializeFromJson()` / `asJson()` / `setJson()` / `applyJsonPatches()` produce a human-readable representation for clients, AI services, import/export, and clipboard; they omit system metadata and are independent of what the store records.

### Blobs

Binary data goes through `SvBlobPool` (content-addressed by SHA-256, separate database, deduplicated, weak in-memory cache), not into object records:

- Objects store the **hash string**, never the `Blob`: `const hash = await SvBlobPool.shared().asyncStoreBlob(blob); this.setImageHash(hash);` and later `await SvBlobPool.shared().asyncGetBlob(this.imageHash())`.
- Implement `referencedBlobHashesSet()` on any class that holds blob hashes; the object pool's GC uses it to collect orphaned blobs.

Full API and metadata format: `docs/Persistence/Local and Cloud Blob Storage`.

## Resource Loading

**STRVCT does not use npm or ES modules in the browser.** Do not convert framework files to `import`/`require`. Every browser-side dependency is vendored as source in `external-libs/`. The root `package.json` holds Node-only dependencies (canvas, level, node-indexeddb-lmdb, xhr2, yargs) for headless execution and tooling. `npm-pkg/` is a bootstrap shim for external build systems, not the framework.

- Each directory declares its files, in load order, in `_imports.json`; a base class precedes its categories.
- `ImportsIndexer` walks the `_imports.json` tree and writes `build/_index.json` (paths + SHA-256 hashes) and `build/_cam.json.zip` (compressed content-addressable bundle). At runtime `SvResourceManager` loads the small index, serves hits from `SvHashCache`, downloads the bundle only on a miss, then evals CSS in declaration order and JS in dependency order. Each resource is evaluated once.
- Path components `browser-only` / `server-only` exclude a resource from the other environment automatically (`StrvctFile.canUseInCurrentEnv()`).

Build details and how to add resource types: `source/boot/CLAUDE.md`.

## Node.js Headless Execution

The model layer, persistence, and boot all run in Node.js. Use `SvPlatform.isNodePlatform()` for the rare runtime branch; prefer `browser-only` / `server-only` directory placement so the resource loader selects the right file.

- Shims for the few browser APIs the framework needs live in `source/library/ideal/categories/server-only/` (`RangeShim`, `FileReaderShim`, `FontFaceShim`, `ImageShim`, `XMLHttpRequestShim`). Guard each with `if (typeof SomeAPI === "undefined")`.
- **Do not** polyfill `document`, `window`, or otherwise simulate a browser. Add a minimal shim only for a specific API the framework cannot do without.

See `docs/Lifecycle/Headless Execution`.

## Debugging

Code is eval'd at runtime, so every evaluated chunk must end with a sourceURL comment for DevTools and editors to map it:

```javascript
//# sourceURL=strvct/path/to/file.js
```

- No leading slash; `encodeURI()` paths with spaces; no quotes; relative to the served web root.
- The boot system emits these in `source/boot/SvHelpers.js` (`evalStringFromSourceUrl()`), `source/boot/SvUrlResource.js` (`evalDataAsJS()` / `evalDataAsCss()`), and `source/boot/SvBootLoader.js`.
- VSCode: use the Chrome debugger with `"pathMapping": { "/": "${webRoot}/" }` and `webRoot` set to the directory you serve; do **not** enable `sourceMaps`. Trust the dev certificate in the system keychain (Chrome no longer honors `--ignore-certificate-errors`) or use HTTP locally.

Runtime inspection: `?thrash=1` (above) for forced layouts; sync-loop detection in `SvSyncScheduler` reports the cycle rather than hanging. See `docs/Inspectors and Debugging`.

## Coding Style

ESLint (`eslint.config.js`, `no-undef` disabled because of dynamic evaluation):

- **Space before function parentheses**, everywhere: `initPrototype () {`, `async function loadData () {`, `methodName () {`.
- 4-space indent, semicolons, no `debugger` in committed code.

Conventions:

- `Sv` prefix on framework classes. `Map` instead of plain-object dictionaries.
- Ivars (`_x`) are touched only by their own accessors; method names never start with `_`; boolean getters read as predicates.
- JSDoc on classes and methods: `@description`, `@param`, `@returns`, `@category` (groups related members), `@private`, `@deprecated`. Implementation notes as `// NOTE: …`.

```javascript
/**
 * @description Calculates the ability modifier for a score.
 * @param {Number} score - The ability score value
 * @returns {Number} The modifier
 * @category Ability Scores
 */
```

## Docs

`docs/` pages are **generated** from `_index.md` / `_index.json` by the `colvmn` layout engine. Never edit `index.html`; edit the source, then `node colvmn/static-gen.js` (also rewrites `sitemap.xml`, `llms.txt`, `llms-full.txt`). Details: `colvmn/CLAUDE.md`.

## Important

- **Keep strvct's CODE general — no app-specific knowledge.** It is a framework, and it should stay one: nothing in here should know about characters, sessions, campaigns, or how undreamedof.ai happens to be built. When the app needs framework behavior that depends on app facts, the app supplies them — through a node hint (`nodeContentMaxWidth()`, `nodeShowsScrollbar()`), a protocol, a token, or a delegate. Those indirections are worth their cost.

- **Treat strvct as part of THIS PROJECT for version control.** It is not an external dependency to be worked around or waited on. Change it in the same breath as the app code that needs it, and ship the two together: a strvct commit plus a pin bump in the app repo, in the same release. Do not contort app code to avoid touching the framework, and do not leave a needed framework fix unmade because it lives in another repo.

  The distinction matters and is easy to collapse (2026-08-12): *general in its code, integrated in its history*. Being free to change strvct is not licence to put Uo in it.
