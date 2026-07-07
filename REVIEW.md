# STRVCT Review Guide

Criteria for reviewing changes to the STRVCT framework (PRs and working diffs).
Apply these in addition to the conventions in `CLAUDE.md`. Framework code is
shared by every app view and model that rides through it — the bar is higher
than app code, and the blast radius of a subtle regression is the whole tree.

## Design elegance

- **Right altitude.** Is the change implemented at the level that owns the
  problem? A special case layered on shared infrastructure is a sign the fix
  isn't deep enough. If a base helper is broken (e.g. a mis-mapped CSS
  property), fix the helper — don't work around it at call sites and
  institutionalize the bug with a warning comment.
- **App-agnostic.** STRVCT is an independent framework. No app knowledge may
  leak in: no game/app class names, no app-specific strings, no assumptions
  about one adopter's shape. Litmus test: would the change read naturally in a
  different application?
- **Capability vs. state.** Behavior *gating* must key off a stable capability
  (protocol conformance, an explicit opt-in), never off live runtime data that
  can flip between syncs. A gate that re-decides the code path per sync from
  mutable state works only for adopters whose state happens to be constant —
  and silently breaks the second adopter.
- **Explicit state over boolean accumulation.** A lifecycle modeled as several
  nullable/boolean slots whose interactions are cross-checks scattered through
  independent setters will grow ordering dependencies ("caller must set X
  before Y"). Prefer one explicit state plus an idempotent render/apply pass —
  order-independent by construction.
- **Formal protocols.** Duck-typed method-name contracts get a `*Protocol`
  class (see `SvAudioClipProtocol`, `SvDragSourceProtocol`): one declaration,
  conformance checking, no silent typo-driven non-adoption. Keep protocols
  minimal — every method is API you must support forever; don't add methods
  with zero implementors. Data only: a protocol method returning a styling
  decision (blur radius, duration, color) is a model/view leak.

## Naked objects / model-view separation

- Models (`Sv*` node classes) never reference view classes or browser globals.
  Litmus test: could this model run headlessly under Node?
- Views are driven by observing model state (`syncFromNode`), never by the
  model imperatively pushing at views.
- All presentation decisions (blur, animation, timing, layout) live view-side;
  the model supplies data.
- **Views must tolerate re-creation at any time.** Tiles/views are created
  lazily and torn down freely (navigation, scrolling, re-sync). Any view whose
  correctness depends on having witnessed earlier states is broken. Corollary:
  **animate transitions the view witnessed, not states that already existed**
  — a reveal/fade must not replay for content that was already complete when
  the view was created (late data loads, scroll-back, reload).

## Persistence & lifecycle

- **New slot defaults apply retroactively.** Every stored record that predates
  a new slot deserializes with the default. The default must therefore
  reproduce the *legacy* behavior; opt-in happens by explicitly setting the
  new value going forward.
- **Transient state needs a reload story.** For any `shouldStoreSlot(false)`
  slot, ask: what does an instance look like after reload, and does every code
  path that reads the slot behave sensibly with the default? Flags that are
  persisted mid-operation (e.g. "working") need a resume, timeout, or
  teardown path — otherwise a crash mid-operation persists a state nothing
  will ever complete.
- **Relationships re-established in `finalInit`.** Delegates, owners, and
  back-references excluded from serialization must be re-wired after
  deserialization — for *every* mechanism the instance depends on, not just
  the ones that existed when `finalInit` was last touched. `notifyOwners`
  hooks whose ownership is wired only in a start method die silently on
  rehydrated instances.

## Backwards compatibility

- **Opt-in means the else-path is untouched.** When adding an opt-in
  capability to a shared class, the non-adopter path must be byte-for-byte
  preserved — and the review must actually verify that path, including every
  existing consumer of the class (fields, tiles, inspectors).
- Check what DOM/output shape changes imply for users: replacing an `<img>`
  with a CSS `background-image` silently removes right-click-save, drag-out,
  and long-press — output-mechanism changes are product changes.

## Async & timing hazards

- Fire-and-forget async (unawaited handlers, `asyncSyncFromNode` without
  await) needs guards: check completion/error state after every `await` before
  applying results, or use an epoch/sequence token. Two overlapping passes
  must not interleave into a state neither would produce alone.
- Timers that mutate shared state must be cancellable (named
  `addWeakTimeout`) or must re-validate their premise when they fire — an
  anonymous timer captured against one generation of state will fire against
  the next.
- Never await `requestAnimationFrame` without a timeout race — rAF never
  fires in background tabs or headless containers.
- Event listeners, observers, and timers added by a view must be cleaned up in
  `prepareToRetire`.

## Reuse

- Before adding a helper or idiom, grep for the existing one: animation/fade
  helpers (`SvDomView_animations`), once-only CSS installation
  (`SvBadgeView.setupCss`, `SvCssAnimation`), notification/delegate patterns,
  promise utilities. Two implementations of the same idiom will drift.
- Extract shared sequences within a class (two methods repeating the same
  fetch/configure steps) into one helper both call.

## Efficiency

- Prefer object URLs (`URL.createObjectURL` + revoke) over base64 data URLs
  for blob-backed images; never hold multi-MB base64 strings in long-lived
  slots or compare them for equality per sync.
- Memoize expensive derivations by content hash; don't recompute per
  `syncFromNode` call — syncs are frequent.
- Animate compositor-friendly properties (`transform`, `opacity`), not
  paint-triggering ones (`background-position`, `filter` on large areas) for
  long-running/infinite animations.
- Setters with side effects need change-guards (`if (v === this._x) return`).
- Independent awaits run under `Promise.all`; only application order should be
  serialized.

## Conventions (see CLAUDE.md for the full list)

- Space before function parens; 4-space indent; semicolons; `Sv` prefix;
  JSDoc with `@description`/`@category`; no `debugger`.
- Ivars (`_x`) are accessed only by their own accessors — no reading another
  slot's ivar from an unrelated method. If a slot's generated setter is being
  shadowed with heavy side effects, consider a plain method or a
  `didUpdateSlot` hook instead of a slot.
- Method names never start with `_`. Boolean getters read as predicates.

## Evidence bar

- "I read the code and it looks right" is a hypothesis. For behavior changes,
  drive the affected flow (headless node test, Playwright, or live browser)
  and say which you did. Claims of "byte-for-byte unchanged" or "degrades
  gracefully" must be demonstrated, not asserted.
- For each fix, name the class of bug and sweep the tree for siblings before
  closing.
