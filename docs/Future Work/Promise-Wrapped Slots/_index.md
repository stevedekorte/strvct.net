# Promise-Wrapped Slots

Automatic async getter generation with promise caching and dependency-driven invalidation.

## Context

Many slots need to compute their value asynchronously — fetching a URL, querying a database, calling an API. The naive approach is to write a one-off async getter for each such slot, but this leads to repeated boilerplate and easy-to-miss edge cases: what if multiple callers request the value before the first computation finishes? What if a dependency changes and the cached value is stale?

Promise-wrapped slots formalize these patterns at the slot level, so that any slot can opt into async computation with built-in promise deduplication and dependency invalidation.

## The Idea

Mark a slot as promise-wrapped:

```javascript
{
    const slot = this.newSlot("publicUrl", null);
    slot.setIsPromiseWrapped(true);
    slot.setPromiseResetsOnChangeOfSlotName("dataUrl");
}
```

This generates:

- **`asyncPublicUrl()`** — an async getter that callers use instead of `publicUrl()`. Returns the cached value if available, or the in-flight promise if a computation is already underway, or kicks off a new computation.
- **`asyncComputePublicUrl()`** — a method the class must implement, containing the actual async logic. Called at most once per computation cycle.
- **`_publicUrlPromise`** — a private property holding the in-flight `Promise.clone()` instance, ensuring concurrent callers share a single computation.
- **`didUpdateSlotDataUrl()`** — an auto-generated hook that resets both the cached value and the promise when the `dataUrl` slot changes, so the next call to `asyncPublicUrl()` recomputes.

## Existing Scaffolding

The implementation lives in `Slot_promiseWrapper.js`, a category on `Slot`:

- **`isPromiseWrapped`** — boolean flag on `Slot`, registered in `Slot.js` (line 135). When true, `setupPromiseWrapperIfNeeded()` installs the async getter during slot setup.

- **`promiseResetsOnChangeOfSlotName`** — optional string naming a dependency slot. When set, `setupPromiseResetMethodIfNeeded()` installs a `didUpdateSlot{Name}` method that nulls both the cached value and the in-flight promise.

- **`newAsyncPromiseWrappedGetter()`** — generates the async getter function. The logic:
  1. If the private value is non-null, return it immediately (synchronous fast path).
  2. If `_slotNamePromise` already exists, return it (promise deduplication).
  3. Otherwise, call `asyncCompute{SlotName}()`, set the value via the normal setter on success, and resolve/reject the promise.

- **`newPromiseResetMethod()`** — generates the dependency reset function. If the in-flight promise hasn't completed when a reset fires, it rejects the promise with an error before nulling everything.

- **Integration point** — `Slot.setupGetter()` calls `setupPromiseWrapperIfNeeded()` after installing the normal getter, so the async getter is available on the prototype alongside the synchronous one.

The pattern relies on STRVCT's extended `Promise` class (`Promise_ideal.js`), which adds `callResolveFunc()`, `callRejectFunc()`, `isCompleted()`, and timeout support to native promises via `Promise.clone()`.

## Current Usage

- **`SvActorMessage`** — uses `setIsPromiseWrapped(true)` on its `resultPromise` slot so external callers can `await message.asyncResult()` without duplicating the resolution logic.
- **`SvImageNode`** — has commented-out promise wrapping on `publicUrl` and related slots, suggesting the pattern was tested there but not yet production-ready.

## Challenges to Solve

### Null as Sentinel

The current fast path treats `null` as "not yet computed" — if the slot's value is legitimately `null`, the async getter will recompute on every call. A dedicated sentinel value (e.g., `Slot.UNCOMPUTED`) would be more robust, but adds complexity to the slot value contract.

### Error Recovery

When `asyncCompute{Name}()` throws, the promise is rejected and the error propagates to all current awaiters. But the cached promise is not reset — subsequent callers will receive the rejected promise rather than retrying. A retry policy (reset on rejection, optional backoff) would make the pattern more resilient.

### Interaction with View Sync

Views that display a promise-wrapped slot's value need to handle three states: no value yet, loading, and loaded. The current view sync system triggers on `didUpdateSlot`, which fires when the setter is called after successful computation — so views update correctly on success. But there's no notification for "computation started" or "computation failed," making loading indicators and error states harder to implement.

### Ordering with Persistence

If a promise-wrapped slot is also stored (`setShouldStoreSlot(true)`), the persistence system may serialize `null` (the pre-computation value) to storage. On reload, the slot starts as `null` and recomputes — which may be correct (the value is derived) or wasteful (the value could have been cached). There's no current mechanism to distinguish "not yet computed" from "computed and found to be null" in the stored record.

### Cascading Dependencies

`promiseResetsOnChangeOfSlotName` handles one level of dependency. If slot A depends on slot B which depends on slot C, changes to C don't automatically propagate to A. A chain or graph of dependencies would be more general but significantly more complex.

## Relationship to Lazy Slots

Promise-wrapped slots and [lazy slots](../Lazy%20Slots/index.html) solve different halves of the async slot problem:

- **Lazy slots** defer *loading* an already-persisted object until first access.
- **Promise-wrapped slots** defer *computing* a derived value, with caching and invalidation.

A slot could potentially be both: lazy-loaded from storage, with a promise wrapper that handles the async load and caches the result. The two mechanisms would need to coordinate on what "not yet loaded" means and who owns the async getter.

## Open Questions

- Should the promise wrapper support configurable retry on failure?
- Is `null` the right sentinel for "not yet computed," or should a dedicated symbol be used?
- Should there be a synchronous `hasComputedPublicUrl()` predicate so views can check without triggering computation?
- How should promise-wrapped slots interact with JSON serialization — should derived values be excluded from `serializeToJson()` by default?
- Could the dependency system be extended to handle multiple dependencies or dependency chains?
