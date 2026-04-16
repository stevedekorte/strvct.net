# Lazy Slots

Deferring object loading until first access, so large object graphs don't pay for what they don't touch.

## Context

STRVCT's persistence system loads every stored object eagerly on startup: each record in IndexedDB is deserialized, its `finalInit()` runs, and all slot values (including referenced child objects) are hydrated immediately. For moderate-sized object graphs this is fine. As the graph grows — hundreds of campaigns, thousands of characters, deeply nested location trees — startup cost grows linearly with the total number of stored objects, regardless of how many the user actually navigates to.

Lazy slots would allow a slot to hold a persistent reference (a puuid) rather than the object itself, deferring the actual load to the moment the getter is first called.

## The Idea

Mark a slot as lazy:

```javascript
{
    const slot = this.newSlot("locations", null);
    slot.setIsLazy(true);
    slot.setShouldStoreSlot(true);
}
```

At persistence time, the slot stores the referenced object's puuid instead of the object value. At runtime, the slot's getter recognizes that the value has not been loaded (represented by `undefined`) and fetches the object from the store on demand.

## Existing Scaffolding

Partial infrastructure for lazy slots already exists in the `Slot` class:

- **`isLazy` flag** — A boolean slot property. When true, `setAllowsUndefinedValue(true)` is set so that `undefined` can represent "not yet loaded" without triggering validation errors.

- **`privateNameLazyPid()`** — Returns a private property name (e.g., `_locationsLazyPid`) used to store the puuid alongside the slot value.

- **`autoLazyGetter()`** — A generated async getter that checks the lazy pid property and, if present, calls `this.defaultStore().asyncObjectForPid(pid)` to fetch the object.

- **`onInstanceSetValueRef()` / `onInstanceGetValueRef()`** — Store and retrieve a reference object in the instance's `lazyRefsMap`, a per-instance Map that tracks which slots have pending lazy references.

- **`onInstanceLoadRef()`** — Resolves a stored reference back to an object by calling `storeRef.unref()`, then applies it through the normal setter.

- **`copyValueFromInstanceTo()`** — Special-cases lazy slots to copy the lazy pid rather than forcing a load of the value.

- **Initialization guard** — During `onInstanceInitSlotValue()`, if `isLazy` is true, the lazy pid is set to `undefined` and an assertion prevents combining `isLazy` with `initProto` (which would defeat the purpose).

None of this machinery is currently activated in any class definition — `setIsLazy(true)` is never called outside of commented-out code.

## Challenges to Solve

### Async Getters in a Synchronous World

The core tension: `autoLazyGetter()` returns an `async function`, meaning every caller of that getter must `await` it. But the rest of the framework — view synchronization, persistence serialization, slot copying, notification dispatch — assumes getters are synchronous. Sprinkling `await` through the entire call graph is not practical.

Possible approaches:

- **Eager resolve on navigation.** When a node is about to be displayed, resolve all its lazy slots in a single async pass before handing it to the view system. The getter itself stays synchronous and returns `undefined` until the resolve pass runs. Views already need to handle `null` slot values; `undefined` just adds a "loading" state.
- **Synchronous unref from cache.** If the object pool already has the object in its in-memory cache (common after the first access), the lazy getter could return it synchronously. Only the cold-cache path would be async.
- **Coroutine-style getters.** JavaScript does not have transparent coroutines, but a future framework version could explore generator-based getters that yield on cache miss and resume when the object is available. This would require framework-level scheduling.

### Persistence Round-Trips

When a lazy slot's object is modified and persisted, the lazy slot on the parent still holds only the puuid. The dirty-tracking system needs to understand that a lazy slot's child can be dirty independently of the parent — the parent's record doesn't change just because the child was modified.

Conversely, when re-persisting the parent, the system must not force-load a lazy slot just to serialize it. The puuid is sufficient.

### Cascading Lazy Loads

If object A has a lazy slot pointing to object B, which itself has a lazy slot pointing to object C, a single user navigation can trigger a chain of async loads. Without care, this creates waterfall latency — each hop waits for the previous one.

Options include prefetching (load B and all of B's lazy references in one batch) or breadth-first resolution (resolve one level of the tree at a time).

### UI While Loading

Views that display a lazy slot's value will initially see `undefined`. The view layer needs a consistent pattern for:

- Showing a loading indicator or placeholder
- Re-rendering when the lazy load completes
- Handling the case where the load fails (network error, deleted object)

This is closely related to the [Async Final Initialization](../Async%20Final%20Initialization/index.html) problem — both require views to handle an "object not yet ready" state.

### Copying and Cloning

`copyValueFromInstanceTo()` already handles lazy slots by copying the pid rather than the value. But `duplicate()` — which creates a deep copy — would need to decide: duplicate the pid (creating a shared reference) or force-load the object and duplicate it (preserving deep-copy semantics). The right answer likely depends on the use case.

## Relationship to Async Final Initialization

Lazy slots and async final initialization address overlapping problems from different angles:

- **Async final init** asks: "What if an object needs async work before it's ready?"
- **Lazy slots** ask: "What if we don't load the object at all until someone asks for it?"

A lazy slot that resolves its value could trigger the loaded object's `asyncFinalInit` (if that feature existed), creating a clean two-phase deferred initialization. The two features are complementary.

## Open Questions

- Should lazy resolution be transparent (the getter handles it) or explicit (callers must call `await node.resolveLazySlot("name")`)?
- How does garbage collection interact with lazy slots? A lazy slot holds a puuid but not a strong reference to the object — does the GC need to trace through puuids to find reachable objects?
- Could the manifest-based metadata approach (storing title/subtitle in a lightweight manifest) reduce the need for lazy slots by giving stubs enough information to display without loading the full object?
- Is there a useful middle ground — "shallow load" — where the object is loaded but its own slots remain lazy?
