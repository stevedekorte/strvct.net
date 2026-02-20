# Local Object Pools

IndexedDB-backed persistence for object graphs using dirty tracking and automatic serialization.

## Overview

Strvct's persistence system stores object graphs in the browser's IndexedDB. Rather than requiring explicit save/load calls, it monitors slot changes and automatically commits dirty objects at the end of the event loop. The system is built from three layers:

- **`ObjectPool`** — Manages an in-memory cache of objects indexed by persistent unique IDs (puuids). Tracks dirty objects and handles serialization, deserialization, and garbage collection.
- **`PersistentAtomicMap`** — An IndexedDB wrapper that loads the entire database into memory on open, provides synchronous read/write to the cache, and batches writes into atomic IndexedDB transactions on commit.
- **`SvStorableNode`** — A node base class that hooks slot changes into the dirty tracking system.

## Opting Into Persistence

### Marking a Node as Storable

A node class opts into persistence by calling `setShouldStore(true)` in its `initPrototype()` method:

```javascript
(class MyNode extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
        }
        {
            const slot = this.newSlot("score", 0);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
        }
        {
            const slot = this.newSlot("cachedResult", null);
            // Not stored — transient, recomputed at runtime
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
    }

}.initThisClass());
```

### What Gets Stored

Two flags control what is persisted:

- **`setShouldStore(true)`** on the node — enables persistence for the node itself. Without this, the node and all its slots are ignored by the storage system.
- **`setShouldStoreSlot(true)`** on individual slots — marks that slot's value for inclusion in the serialized record. Slots without this flag are transient and will be lost on reload.

A third flag controls whether child nodes are stored:

- **`setShouldStoreSubnodes(true)`** — persists the node's `subnodes` array. Used for collection nodes where children are the primary data. When false, subnodes are transient and must be recreated on load (typically via `setFinalInitProto()` on slots with `setIsSubnodeField(true)`).

### Inheritance

Storage capability begins at `SvStorableNode` in the class hierarchy:

```
ProtoClass → SvNode → TitledNode → InspectableNode → ViewableNode → StyledNode → SvStorableNode
```

Classes above `SvStorableNode` cannot be stored. Application model classes typically extend `SvStorableNode` or one of its subclasses like `SvSummaryNode`.

## Persistent Unique IDs

Every stored object has a **puuid** — a 10-character random string (A-Za-z0-9) that serves as its key in the object pool. Puuids are generated on first access via `crypto.getRandomValues()` and stored as a non-enumerable `_puuid` property on the object.

Puuids serve two purposes:

1. **Storage key** — the puuid is the key under which the object's serialized record is stored in IndexedDB.
2. **Object references** — when one stored object references another, the reference is serialized as `{ "*": "puuid" }` rather than inlining the referenced object. This allows the storage system to trace the object graph for garbage collection.

## Serialization Format

Each stored object is serialized as a JSON record with a type field and an entries array:

```json
{
  "type": "MyNode",
  "entries": [
    ["name", "Alice"],
    ["score", 42],
    ["inventory", { "*": "aB3xK9mQ2p" }]
  ]
}
```

Primitive values (strings, numbers, booleans, null) are stored inline. Object references are stored as `{ "*": "puuid" }` pointers. The `type` field identifies the class so the correct constructor can be used on deserialization.

### Serialization Methods

- **`recordForStore(aStore)`** — iterates all slots with `shouldStoreSlot() == true`, calls `aStore.refValue()` on each value to handle object references, and returns the record.
- **`loadFromRecord(aRecord, aStore)`** — iterates the record's entries, calls `aStore.unrefValue()` to resolve references back to live objects, and sets each slot value.

## Dirty Tracking and Automatic Commits

The persistence system uses automatic dirty tracking so application code never needs to call save explicitly.

### The Mutation Flow

1. A slot value changes (via its setter method).
2. `SvStorableNode.didUpdateSlot()` checks whether the node and slot are both marked for storage.
3. If so, it calls `didMutate()`, which notifies the `ObjectPool` via a mutation observer.
4. The pool calls `addDirtyObject(obj)` to add the object to its dirty set.
5. `addDirtyObject()` calls `scheduleStore()`, which uses `SvSyncScheduler` to defer the commit.
6. At the end of the event loop, `commitStoreDirtyObjects()` runs, serializing all dirty objects and writing them to IndexedDB in a single atomic transaction.

Because the commit is deferred, multiple slot changes within the same event loop — even across different objects — are batched into a single IndexedDB transaction. This keeps persistence efficient even when many properties change in rapid succession.

### Commit Details

`commitStoreDirtyObjects()` begins an IndexedDB transaction via `PersistentAtomicMap`, then iterates the dirty set. For each dirty object, it calls `recordForStore()` to serialize it and writes the JSON string to the map keyed by puuid. After all objects are stored, the transaction is committed atomically. If any object becomes dirty again during the commit (because serialization triggers side effects), the cycle repeats until the dirty set is empty.

## PersistentAtomicMap

`PersistentAtomicMap` wraps IndexedDB with a synchronous in-memory cache. On open, it loads the entire database into a JavaScript Map. All reads are served from memory. Writes go to an in-memory write cache and are flushed to IndexedDB in batched transactions on commit.

This design means:

- **Reads are synchronous and fast** — no async IndexedDB calls during normal operation.
- **Writes are batched** — many changes are committed in a single IndexedDB transaction.
- **The full dataset is in memory** — suitable for object graphs that fit in browser memory (typically tens of megabytes).

### Transaction Model

1. `promiseBegin()` — snapshots the current state into a write cache.
2. Synchronous operations (`atPut`, `removeKey`) modify the write cache.
3. `promiseCommit()` — applies all changes to IndexedDB in a single transaction.

## Opening the Pool

The application opens the pool once at startup:

```javascript
const pool = PersistentObjectPool.sharedPool();
await pool.promiseOpen();
const root = await pool.rootOrIfAbsentFromClosure(() => {
    return MyRootNode.clone();
});
```

`promiseOpen()` opens the IndexedDB database, loads all records into memory, and runs garbage collection. `rootOrIfAbsentFromClosure()` loads the existing root object from storage, or creates a new one using the provided closure if no root exists yet.

### Loading Cascade

Loading the root object triggers a cascade: as each object is deserialized, its slot values that contain `{ "*": "puuid" }` references cause those referenced objects to be loaded in turn. After all objects in the reachable graph have been loaded, `finalInit()` is called on each to re-establish object relationships, followed by `afterInit()`.

## Garbage Collection

The pool uses mark-and-sweep garbage collection to remove unreachable objects:

1. **Mark** — starting from the root object's puuid, recursively walk all `{ "*": "puuid" }` references in stored records, marking each visited puuid.
2. **Sweep** — delete any stored records whose puuids were not marked.

Garbage collection runs automatically when the pool opens. It ensures that objects which are no longer reachable from the root — for example, nodes removed from a collection — are cleaned up from IndexedDB.

Blob garbage collection runs separately via `SvBlobPool` (see [Local and Cloud Blob Storage](../Local%20and%20Cloud%20Blob%20Storage/index.html)).

## SubObjectPool

`SubObjectPool` is an in-memory variant of `ObjectPool` used for cloud sync rather than local persistence. It uses a plain `AtomicMap` instead of `PersistentAtomicMap` (no IndexedDB) and does not auto-schedule commits. Instead, it provides explicit methods for cloud upload with delta optimization. See [Cloud Object Pools](../Cloud%20Object%20Pools/index.html) for details.

## Key Classes Summary

| Class | Purpose |
|-------|---------|
| `ObjectPool` | Base pool: object cache, dirty tracking, serialization, GC |
| `PersistentObjectPool` | Singleton `ObjectPool` backed by IndexedDB |
| `PersistentAtomicMap` | IndexedDB wrapper with synchronous in-memory cache |
| `SvStorableNode` | Node base class that hooks slot changes to dirty tracking |
| `SubObjectPool` | In-memory pool for cloud sync (no IndexedDB) |
