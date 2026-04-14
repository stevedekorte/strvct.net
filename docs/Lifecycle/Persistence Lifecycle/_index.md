# Persistence Lifecycle

How objects are stored, loaded, and kept in sync with IndexedDB.

## Overview

Persistence in STRVCT is automatic. Objects marked as storable are tracked for changes, serialized at the end of each event loop, and written to IndexedDB. On reload, they're deserialized and re-initialized through the same three-phase lifecycle as new objects. The goal is transparency — a class shouldn't need different code paths for "new" and "loaded."

## Storing Objects

### Marking Dirty

When a storable slot changes, the framework automatically marks the object as dirty:

1. `didMutate()` is called from the slot's `didUpdateSlot()` hook.
2. The object is added to the store's dirty set.
3. At the end of the event loop, all dirty objects are auto-committed.

### Serialization

```
recordForStore(store)
  ├── Serialize slots marked with setShouldStoreSlot(true)
  ├── Convert object references to puuids
  └── Return JSON-compatible record
```

Only slots explicitly marked with `setShouldStoreSlot(true)` are persisted. Object references are stored as persistent unique IDs (puuids) rather than direct pointers, so the full object graph can be reconstructed on load.

## Loading Objects

Loading reverses the process in three steps:

### 1. Instance Creation

```
instanceFromRecordInStore(record, store)
  ├── Create blank instance
  ├── Call init()
  └── Return for population
```

### 2. Data Population

```
loadFromRecord(record, store)
  ├── Restore slot values
  ├── Resolve object references via puuids
  └── Skip slots with setFinalInitProto() (they'll be handled next)
```

### 3. Relationship Restoration

`finalInit()` re-establishes complex relationships. Slots configured with `setFinalInitProto()` only create default instances if the slot wasn't already populated from the store — this is the key mechanism that makes the three-phase lifecycle work for both new and loaded objects.

## Persistence-Aware Initialization

When you need initialization logic that only runs for newly created objects (not loaded ones):

```javascript
finalInit () {
    super.finalInit();
    if (!this.hasStoredData()) {
        this.randomizeValues();
    }
}
```

## Store Events

- `didLoadFromStore(store)` — Called after all objects have been loaded and initialized. Safe to access the full object graph.
- `willStore()` — Called just before serialization. Optional hook for pre-save cleanup.

## Clean Shutdown

```javascript
shutdown () {
    this.stopWatchingNode();
    this.subnodes().forEach(node => node.shutdown());
    this.removeFromParent();
}
```
