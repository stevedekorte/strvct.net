# Promise-Wrapped Slots

Automatic async getter generation with promise caching and dependency-driven invalidation.

**Status:** the core contract is done and tested (2026-11-15): one promise per value that every caller shares, a computed `null` is a value, a failure is retried, and a dependency change mid-computation hands the waiting callers the new value. Nothing uses it yet: no slot in the framework or the app sets `setIsPromiseWrapped(true)` (until that date the generated getter threw on its first call). View states, persistence and dependency chains, below, wait for a first adopter.

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

- **`asyncPublicUrl()`** — returns *the* promise for the value. The first call starts the computation; every later call, during the computation or after it, gets that same promise.
- **`asyncComputePublicUrl()`** — a method the class must implement, containing the actual async logic.
- **`_publicUrlPromise`** — a private property holding the shared `Promise.clone()` instance. The promise is the cache.
- **`didUpdateSlotDataUrl()`** — an auto-generated hook that resets the value when the `dataUrl` slot changes.

The contract:

- **A computed `null` is a value.** The promise, not a non-null value, says "computed", so `null` is not computed again.
- **A failure is forgotten.** The callers waiting on it are rejected; the next call computes again.
- **A reset while computing rejects nobody.** The stale computation's result is dropped, a new one starts, and the callers already waiting get the new value from the promise they hold. A reset after the computation clears the value, and the next call computes.
- **A value set with the setter is the value.** `asyncPublicUrl()` resolves to it without computing, so a loaded or assigned value is respected.

## Implementation

`Slot_promiseWrapper.js`, a category on `Slot`:

- **`isPromiseWrapped`** — boolean flag on `Slot`. When true, `setupPromiseWrapperIfNeeded()` (called from `Slot.setupGetter()`) installs the async getter beside the synchronous one.
- **`wrappedPromiseOn(instance)`** — what the async getter returns: the shared promise if it still stands (`wrappedPromiseIsCurrentOn()`: pending, or resolved to the value the slot holds now), else a new one, resolved at once when the value was set directly and otherwise computing.
- **`asyncComputeForWrappedPromise(instance, promise)`** — runs `asyncCompute{SlotName}()` and settles the promise. Each run takes a number (`_publicUrlRun`); a run that is no longer the latest when it finishes is ignored, result or error.
- **`resetWrappedPromiseOn(instance)`** — forgets the value. With a computation running it starts a new one for the same promise; otherwise it clears the promise.
- **`promiseResetsOnChangeOfSlotName`** — optional string naming a dependency slot; installs a `didUpdateSlot{Name}` method that calls the reset.

The pattern relies on STRVCT's extended `Promise` class (`Promise_ideal.js`), which adds `callResolveFunc()`, `callRejectFunc()` and `isCompleted()` to native promises via `Promise.clone()`. `tests/headless/TestPromiseWrappedSlots.js` checks each line of the contract.

## Current Usage

- **None.** An earlier version of this page named `SvActorMessage`; no such class exists.
- **`SvImageNode`** — has commented-out promise wrapping on `publicUrl` and related slots, suggesting the pattern was tested there but not yet production-ready.

## Challenges to Solve

### Null as Sentinel

**Solved (2026-11-15).** The promise is the cache, so a computed `null` is not computed again. One trace remains: a slot whose value is `null` and which has no promise is "not computed", so a `null` *assigned with the setter* still computes on the first call.

### Error Recovery

**Solved (2026-11-15).** A failed computation rejects the callers waiting on it and clears the promise, so the next call computes again. The first version of the fix found a worse bug underneath: the getter never created the promise it resolved, so every first call threw. A retry policy (backoff, attempt limits) can come later if a caller needs one.

### Reset While Computing

**Solved (2026-11-15).** It used to reject the waiting callers with "reset before completion", which made every caller write retry logic for a change it had not caused. Now the stale result is dropped and the same promise resolves with the value for the new dependency.

### Interaction with View Sync

Views that display a promise-wrapped slot's value need to handle three states: no value yet, loading, and loaded. The current view sync system triggers on `didUpdateSlot`, which fires when the setter is called after successful computation — so views update correctly on success. But there's no notification for "computation started" or "computation failed," making loading indicators and error states harder to implement.

### Ordering with Persistence

If a promise-wrapped slot is also stored (`setShouldStoreSlot(true)`), the persistence system may serialize `null` (the pre-computation value) to storage. On reload, the slot starts as `null` and recomputes — which may be correct (the value is derived) or wasteful (the value could have been cached). There's no current mechanism to distinguish "not yet computed" from "computed and found to be null" in the stored record.

### Cascading Dependencies

`promiseResetsOnChangeOfSlotName` handles one level of dependency. If slot A depends on slot B which depends on slot C, changes to C don't automatically propagate to A. A chain or graph of dependencies would be more general but significantly more complex.

## Relationship to Lazy Slots

[Lazy slots](../Lazy%20Slots/) defer *loading* a stored object; promise-wrapped slots defer *computing* a derived value. Lazy slots shipped with a synchronous getter (a pool's records are in memory), so the two no longer need to share an async getter, and a slot can be both without coordination.

## Open Questions

- Should the promise wrapper support configurable retry on failure?
- Should there be a synchronous `hasComputedPublicUrl()` predicate so views can check without triggering computation?
- How should promise-wrapped slots interact with JSON serialization — should derived values be excluded from `serializeToJson()` by default?
- Could the dependency system be extended to handle multiple dependencies or dependency chains?
- When the setter assigns a value while a computation is running, the computation's result replaces it. Should the assigned value win instead?
