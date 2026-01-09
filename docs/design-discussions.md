# STRVCT Design Discussions

This document captures design ideas, architectural discussions, and potential future improvements for the STRVCT framework. These are not plans - they're notes on approaches considered and their tradeoffs.

---

## Async Final Initialization (asyncFinalInit)

**Context:** When objects need async data during initialization (e.g., fetching from cloud storage, API calls), the current synchronous initialization flow (`init()` → `finalInit()` → `afterInit()`) doesn't accommodate this cleanly.

**The Idea:** Add an `asyncFinalInit()` phase that runs after synchronous initialization but before the object is considered "fully ready."

### Potential Benefits

- Clean architectural pattern - async initialization gets its own explicit phase
- Objects have a clear "fully ready" state
- Generalizes to many async initialization scenarios
- Could handle lazy-loaded cloud data, API-dependent initialization, etc.

### Challenges to Solve

1. **Initialization State Tracking**
   - Objects need an `isFullyInitialized` flag
   - Anything accessing them needs to check or wait for completion
   - Views need to handle "initializing" state gracefully (loading indicators, disabled interactions)

2. **Cascading Dependencies**
   - If object A's `asyncFinalInit` depends on object B's `asyncFinalInit`, ordering becomes complex
   - Need dependency resolution or explicit waiting mechanisms
   - Risk of deadlocks if dependencies are circular

3. **Validation Timing**
   - Current validation runs synchronously and may depend on async data
   - Options to consider:
     - Defer all validation until after `asyncFinalInit`
     - Add a `validationReady` state that skips validation when false
     - Make validation itself async-aware
   - Example: Options dropdown validation needs character names, but characters are lazy-loaded stubs

4. **Persistence Edge Cases**
   - What happens if object is accessed/modified before `asyncFinalInit` completes?
   - Should writes be queued? Rejected? Merged later?
   - How does this interact with the dirty tracking system?

5. **UI Synchronization**
   - Views may render before async data is ready
   - Need consistent pattern for showing loading states
   - Re-render triggers when `asyncFinalInit` completes

### Alternative Approaches Considered

**Manifest-Based Metadata:** For the specific case of lazy-loaded cloud objects, storing display metadata (title, subtitle) in a manifest allows stubs to display correctly without fetching full data. The data is synchronously available - just stored in a different place.

- Pros: No framework changes, uses existing infrastructure
- Cons: Only works when you control what metadata goes in the manifest

**Async Closures for Options:** Add `validItemsAsyncClosure` to slots/options that returns a Promise. The options node shows "Loading..." until the closure resolves.

- Pros: Localized to options, doesn't affect whole initialization flow
- Cons: Adds complexity to Slot and SvOptionsNode, may be over-engineering for limited use cases
- Note: This was implemented and then removed in favor of the manifest approach. See `docs/design-notes/async-options-closure-implementation.md` for the full implementation details.

### Open Questions

- How common is async initialization across the codebase? Is framework support warranted?
- Should `asyncFinalInit` be opt-in per class, or a universal phase?
- How would this interact with the persistence system's `loadFromRecord` flow?
- Could a simpler "initialization complete" event/notification pattern suffice?

### Related Patterns in Other Frameworks

- React's `useEffect` for async operations after render
- SwiftUI's `.task` modifier for async work tied to view lifecycle
- Android's `ViewModel` with `init` blocks and coroutine scopes

---

## (Template for Future Discussions)

**Context:** [What problem or opportunity prompted this discussion]

**The Idea:** [Brief description of the approach]

### Potential Benefits
- ...

### Challenges to Solve
1. ...

### Alternative Approaches Considered
- ...

### Open Questions
- ...
