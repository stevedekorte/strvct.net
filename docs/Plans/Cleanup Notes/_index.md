# Cleanup Notes

Areas of the codebase that work but could benefit from simplification, documentation, or restructuring.

**Status:** open; checked against the source 2026-11-13. Done since the first draft: Notification Center indexing (`tests/headless/TestNotificationIndexes.js`) and the `isInTx()` question in the object pool. Moved: view compaction to [Browser Cleanup](../Browser%20Cleanup/), model/view items to [Naked Objects Issues](../Naked%20Objects%20Issues/), schema migration to its own entry in the [Meta Plan](../Meta%20Plan/).

The items are in order: the first can fail at runtime; the rest are for when a file is being changed anyway. When rewriting a file, re-check the fixes already applied to it (see the framework guide on diagnostics coming back in rewrites).

## Can Fail at Runtime

### ObjectPool Recursive GC

`markPid()` (`SvObjectPool_collection.js`) marks reachable records by recursion, so a long enough chain of references overflows the stack during GC. Its own TODO says so. Convert it to an iterative walk with an explicit stack; a headless test with a chain deeper than the stack limit shows the difference.

### Promise-Wrapped Slot Errors

A failed computation stays cached, so a promise-wrapped slot never retries. See [Promise-Wrapped Slots](../Promise-Wrapped%20Slots/#error-recovery).

## Structure

### Slot Hooks

`Slot.js` (2,295 lines) has a TODO: "hooks code is a mess, need to cleanup and modularize." The hook system (`onWillGet`, `onDidUpdate`, `onUndefinedGet`, …) is set up across scattered code paths, and the file also holds storage configuration, inspector settings, validation, JSON Schema and lazy loading.

Splitting it into categories (`Slot_hooks.js`, `Slot_storage.js`, `Slot_inspection.js`, `Slot_lazy.js`) would separate concerns without changing the public API; `Slot_promiseWrapper.js` already shows the shape.

### SvCssDomView

`SvCssDomView.js` (2,993 lines) holds 100+ CSS property accessors, plus commented-out code: a push/pop attribute stack and an `applyCSS` helper.

- **Group the accessors** into categories (`SvCssDomView_layout.js`, `SvCssDomView_typography.js`, …), or generate the repetitive ones from a property list.
- **Remove the commented-out code.** Git keeps it.

### Notification Names

Notification names (`onStackViewPathChangeNote`, `onRequestNavigateToNode`, …) are string literals scattered through the code. A pass could:

- Collect them as constants on the classes that post them.
- Document which classes post and which observe each.
- Find the ones no longer posted or observed.

### View Class Discovery

Discovery by naming convention (`Contact` → `ContactTile`) is surprising when it doesn't find a match. A debug log, or an inspector field, showing which view class was chosen for a node and why would help.

### Boot Loader Ordering

`SvBootLoader.js` loads its files from a hardcoded array whose order matters, with the dependencies recorded only in comments ("important that this be after SvIndexedDbFolder/Tx"). An explicit dependency list or a check at boot would let it validate its own order.

### IndexedDB Browser/Server Duplication

`SvIndexedDbFolder.js` exists in `browser-only/` (871 lines) and `server-only/` (483), as does `SvIndexedDbTx.js` (445 and 438). A shared base would shrink the surface and keep the two consistent.

### Resource Manager and the Loading View

`SvResourceManager.js` calls `SvBootLoadingView` directly to update progress. Posting progress notifications instead would let the loading view observe them, and keep the loader free of UI.

### Error Handling

Errors are reported in several ways: `console.error()` with emoji prefixes, context added to error objects (`evalError.evalPath = path`), custom error classes (`SvJsonPatchError`, `SvMissingSlotError`, the AI request errors), and catch-and-log. A convention for which to use when would make errors easier to trace.

### Theme Value Generation

`SvThemeState`'s value lists (`validLetterSpacingValues()` and its siblings) are rebuilt on every call, 50+ strings each. Compute them once per class.

## Noise

### Commented-Out Code

- `SvJsonGroup.js`: the `hasBeenLoaded` slot and lazy-loading scaffolding, superseded by [Lazy Slots](../Lazy%20Slots/).
- `SvStorableNode.js`: the commented-out `setIsLazy(true)` ("no point in using this until we have coroutines"), also superseded.
- `SvCssDomView.js`: the push/pop attribute stack (above).
- `SvResourceManager.js`: an alternative parallel loading approach.
- `SvNode_subnodes.js`: two "TODO: remove after debugging" lines.

### Unused Files

107 files sit in 33 `_unused/` folders across the source tree. They're out of the build, but they turn up in every search. Delete them (git keeps them) or move them to one archive folder.

### Stale TODOs

There are 140 TODO/FIXME comments in `source/` (not counting `_unused/` and `external-libs/`). Some are stale: "hasOwnProperty?" questions in `Slot.js` that `Object.hasOwn()` already answers, debug leftovers, and bare `// TODO:` with no description. A pass to resolve or explain them would make the rest useful as a backlog.
