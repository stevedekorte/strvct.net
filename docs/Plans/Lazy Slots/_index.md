# Lazy Slots

Deferring object loading until first access, so large object graphs don't pay for what they don't touch.

**Status:** shipped (2026-07), with a few items left (below). In use by app collections and character sheet sections; `tests/headless/TestLazyMaterializationNeutrality.js` and `TestPendingMaterialization.js` cover it.

## What Shipped

A stored slot marked lazy isn't loaded with its owner. It holds a placeholder until something reads it:

```javascript
{
    const slot = this.newSlot("locations", null);
    slot.setShouldStoreSlot(true);
    slot.setIsLazy(true);
}
```

- **Loading leaves a placeholder.** `loadFromRecord` puts an `SvStoreRef` (the record's pid) in the slot instead of instantiating the object and everything it reaches.
- **The getter is synchronous.** The record store reads a pool's records into memory when it opens, so turning a pid into an object needs no I/O, and the first getter call does it in place: `onInstanceMaterializeLazySlot` loads the object through the pool (whose identity map keeps one instance per pid) and writes it through the setter, so slot hooks and view sync fire as for any other change. No caller awaits anything. The objection in `SvStorableNode` ("no point in using this until we have coroutines") no longer applies.
- **Loading is not editing.** A write that replaces an `SvStoreRef` is a load, so it marks nothing dirty and touches no timestamps. Hooks can tell: `oldValue instanceof SvStoreRef` means "there was no previous live value". `Slot.isMaterializingAnyLazySlot()` covers the one consumer that can't see the old value.
- **Untouched subtrees round-trip.** Serializing a slot that still holds its `SvStoreRef` writes the pid back without loading it.
- **Lazy collections.** Laziness is per slot, not per array element: a collection is lazy as a whole (`subnodes` included), and a deep tree gets a lazy boundary at each level.
- **A default for lazy slots with a proto.** A lazy slot with no stored value creates its `finalInitProto` default on first access rather than at load (`onInstanceMaterializeLazyDefault`).
- **JSON too.** Reading JSON into a node parks the JSON for a lazy slot in an `SvLazyJsonRef`, so importing a large object doesn't build subtrees nobody looks at.
- **Failure.** If the record is missing, the getter returns null or the owner's `onFailedLazyLoadSlot<Name>()` fallback. The `SvStoreRef` stays in the slot, so the next access retries (rate-limited by a negative cache on the ref), and a fallback written by the hook is a load, not a repair, so it isn't stored. An exception while deserializing propagates; it is a bug, not a missing record.
- **GC.** Store GC marks reachable records by walking records, not instances, so unloaded subtrees stay reachable. Blob GC scans records for hashes for the same reason.

The design and its measurements (boot went from 12.5 s to 8.3 s, with two-thirds of a mature store left unloaded) are in undreamedof.ai's "Slot Lazy Loading" plan.

## What Changes for Code in a Lazy Subtree

- `finalInit()` and `afterInit()` of a lazily held object run when it loads, not at boot. Nothing outside the subtree may rely on them having run.
- Observers inside the subtree don't exist until it loads, so the subtree registers its own when it wakes.
- `duplicate()` loads the value: copying is an explicit "I need it" moment.

## What Remains

- **Why records go missing.** The failure handling is containment; the cause of the missing records it was built for hasn't been found.
- **Docs.** This belongs in the Persistence docs (Local Object Pools) as a description, with this page reduced to the remaining items.
- **Old scaffolding.** The commented-out `setIsLazy(true)` in `SvStorableNode` and its comment, and the commented-out `hasBeenLoaded` slot in `SvJsonGroup`, predate this design and can go.
- **Choosing what to make lazy.** Today it's per slot, chosen from a histogram of records by class. A framework default (for example, lazy subnodes for every windowed or pool-backed collection) hasn't been considered.

## Relationship to Other Plans

- [Async Final Initialization](../Async%20Final%20Initialization/) was the other answer to "an object isn't ready yet". Synchronous materialization removed its main case.
- [Promise-Wrapped Slots](../Promise-Wrapped%20Slots/) cache values that are *computed* asynchronously; lazy slots defer *loading* stored ones. They don't overlap now that loading is synchronous.
- [Async Navigation](../Async%20Navigation/) assumed lazy loading would be async. It isn't, which removes one of its motivations.
