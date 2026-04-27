# Cleanup Notes

Areas of the codebase that work but could benefit from simplification, documentation, or restructuring.

## View Compaction Algorithm

The column compaction system (`updateCompactionChain()` on `SvStackView`, `collapse()` / `uncollapse()` on `SvNavView`) is spread across multiple classes with mutual callbacks. It works, but the protocol between the classes is implicit and hard to follow.

Opportunities:

- **Extract a compaction coordinator**: The logic for measuring available width, deciding which columns to collapse, and triggering collapse/uncollapse could live in a dedicated object rather than being distributed across `SvStackView` and `SvNavView`.
- **Clarify the compaction protocol**: Document the contract — what triggers compaction, what order columns are compacted in, how a column signals that it can't compact further, and how expansion reverses the process.
- **Support compaction priorities**: Currently all columns compact uniformly. A priority system (some columns resist compaction longer than others) would be useful for auxiliary views (see [Browser Cleanup](../Browser%20Cleanup/)) and for nodes that consider their content more important than their siblings.
- **Animation**: Column collapse/expand is instant. Animating the transitions would make the responsive behavior feel more polished and help the user track what moved.

## Notification Naming Conventions

The framework uses string-based notification names (e.g., `onStackViewPathChangeNote`, `onRequestNavigateToNode`). These are scattered across the codebase as string literals. A cleanup pass could:

- Collect notification names as constants on the classes that post them.
- Document which classes post and which observe each notification.
- Identify notifications that are no longer used.

## View Class Discovery

The naming-convention approach to view discovery (`ClassName` → `ClassNameView`) is elegant but can be surprising when it doesn't find a match. Logging or tooling that shows which view class was selected for a given node — and why — would help debugging.

## Slot Hooks

`Slot.js` (1,962 lines) has a TODO in the source: "hooks code is a mess, need to cleanup and modularize." The hook system (`onWillGet`, `onDidUpdate`, `onUndefinedGet`, etc.) is set up and torn down across scattered code paths that are hard to trace. The file also bundles storage configuration, inspector settings, and validation logic alongside the hooks.

The category pattern could help here — splitting into `Slot_hooks.js`, `Slot_storage.js`, `Slot_inspection.js` would separate concerns without changing the public API.

## SvCssDomView

`SvCssDomView.js` (3,125 lines) contains 100+ CSS property getter/setter methods plus commented-out code for a push/pop attribute stack pattern that appears to be an incomplete refactoring.

Opportunities:

- **Generate or group CSS accessors**: The property methods are repetitive. They could be generated from a property list or grouped into categories (`SvCssDomView_layout.js`, `SvCssDomView_typography.js`, etc.).
- **Remove or finish the push/pop code**: The commented-out sections should either be completed or removed to reduce noise.

## Notification Center Indexing

`SvNotificationCenter.js` has TODO comments about adding dictionary indexes for observation lookup. The current implementation searches through all observations for each notification post — O(n) in the number of active observations. Adding an index by notification name (and optionally by target) would improve performance as the number of observers grows.

## Theme Value Generation

`SvThemeState.js` generates value arrays (letter spacing, line height, padding, colors) on every access with no caching. Methods like `validLetterSpacingValues()` allocate 50+ strings per call. Caching the generated arrays as class-level properties would eliminate repeated allocations.

## Boot Loader Ordering

`SvBootLoader.js` loads 39 files in a hardcoded array where ordering is critical — dependencies between files are documented only by comments like "important that this be after SvIndexedDbFolder/Tx so it can be used." Adding or reordering files requires understanding implicit dependencies across the entire list.

A more robust approach could be an explicit dependency manifest or topological sort, so the boot system validates its own ordering rather than relying on array position.

## Unused File Sprawl

The framework has 71 files across 34 `_unused/` directories scattered throughout the source tree. While the `_unused/` convention keeps dead code out of the build, the files add cognitive overhead when exploring the codebase. Consolidating them into a single archive directory (or removing them entirely, since git history preserves them) would reduce noise.

## ObjectPool Recursive GC

`SvObjectPool.markPid()` uses recursion to walk the object graph during garbage collection. Deep object hierarchies (a long chain of parent→child relationships) could overflow the stack. The code has a TODO acknowledging this: "rewrite to not use recursion in order to avoid stack depth limit." Converting to an iterative depth-first search with an explicit stack would eliminate the risk.

A related TODO at line 1574 notes an uninvestigated issue: "investigate why isInTx() is still true after promiseCommit()." This could indicate a transaction state leak in edge cases.

## Schema Migration

The persistence system supports class renames via `classNameConversionMap()` but has no support for slot type changes (e.g., a slot that was a `String` becoming a `Number`), custom migration logic, or schema versioning. When a stored record has a slot that no longer exists on the class, it's silently dropped and the object is re-saved — safe, but one-directional.

Adding optional version metadata to records and a migration hook (e.g., `migrateRecord(record, fromVersion)`) would make schema evolution more predictable, especially for cloud-synced data where old clients might encounter records from newer schemas.

## IndexedDB Browser/Server Duplication

`SvIndexedDbFolder.js` exists in both `browser-only/` (851 lines) and `server-only/` (423 lines), as does `SvIndexedDbTx.js` (418 and 433 lines respectively). Much of the interface and logic is shared. Extracting a common base class or shared module would reduce the maintenance surface and ensure behavioral consistency across environments.

## Model/View Separation

A few model-layer classes contain view-specific code. `SvgIconNode.js` has a TODO: "this view stuff probably shouldn't be in the model." Keeping view logic out of model classes is core to the naked objects pattern — the framework should generate views from model declarations, not have models manipulate views directly.

A cleanup pass to identify and extract view code from model classes would reinforce the architecture's clean separation.

## Commented-Out Code

Several files contain substantial blocks of commented-out code that should be either completed or removed:

- `SvJsonGroup.js` — 50 lines of commented-out lazy loading infrastructure (`hasBeenLoaded` slot, deferred initialization). Either finish the feature or remove the scaffolding.
- `SvCssDomView.js` — push/pop attribute stack pattern (noted above).
- `SvResourceManager.js` — alternative parallel loading approach.
- `SvNode.js` — multiple "TODO: remove after debugging" comments marking leftover debug code.

Git history preserves these experiments. Removing them from the working tree reduces noise for developers reading the code.

## Error Handling Consistency

Error handling varies across the codebase with no unified strategy:

- Some code uses `console.error()` with emoji prefixes.
- Some augments errors with context properties (e.g., `evalError.evalPath = path`).
- Some throws custom error types (`SvJsonPatchError`).
- Some silently catches and logs.

A consistent pattern — whether that's a framework error class, a standard augmentation approach, or a centralized error handler — would make errors more predictable and easier to trace in production.

## Resource Manager Concerns

`SvResourceManager.js` mixes resource loading orchestration with UI progress updates. Methods like `promiseLoadCamIfNeeded()` and `evalIndexResources()` directly call into `SvBootLoadingView` for progress bars and status messages. These UI updates could be notifications instead, letting the loading view observe progress without the resource manager knowing about it.

## Stale TODOs

The codebase has ~170 TODO/FIXME comments. Many are useful markers for future work, but some appear stale:

- **Resolved patterns**: Several TODOs ask "hasOwnProperty?" in `Slot.js` — the project standard is `Object.hasOwn()`, which the code already uses. These TODOs can be removed.
- **Debug leftovers**: `SvNode.js` has multiple "remove after debugging" TODOs marking commented-out assertions and `cleanSubnodes()` calls.
- **Incomplete markers**: Several files have bare `// TODO:` with no description. These should either be filled in with context or removed.

A pass through the TODO list to resolve stale items and add context to vague ones would make the remaining TODOs more useful as a work backlog.
