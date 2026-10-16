# Local Object Pools

IndexedDB-backed persistence for domain object graphs using dirty tracking, the local record store (`SvLocalRecordStore`), and atomic event-loop commits.

## Overview

Strvct's persistence engine is **local-first**: application state is stored directly in the browser's IndexedDB (or LevelDB under Node.js). Rather than requiring developers to write explicit SQL/ORM queries or API save calls, the framework monitors slot mutations automatically, serializes dirty domain objects into **Record Rows** (`SvRecordRow`), and commits them to IndexedDB at the end of each browser event loop.

<svg viewBox="0 0 820 480" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
    .edge { stroke: #888; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="alp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <!-- Node Graph Sketch Box -->
  <rect class="box" x="190" y="20" width="440" height="90"/>
  <text x="205" y="40" class="b">Domain Node Graph (SvNode)</text>
  <circle cx="250" cy="65" r="7" class="fill"/>
  <circle cx="320" cy="85" r="7" class="fill"/>
  <circle cx="390" cy="60" r="7" class="fill"/>
  <circle cx="410" cy="90" r="9" class="fill" stroke-width="2"/>
  <circle cx="480" cy="75" r="7" class="fill"/>
  <circle cx="560" cy="60" r="7" class="fill"/>
  <line class="edge" x1="250" y1="65" x2="320" y2="85"/>
  <line class="edge" x1="250" y1="65" x2="390" y2="60"/>
  <line class="edge" x1="320" y1="85" x2="410" y2="90"/>
  <line class="edge" x1="410" y1="90" x2="480" y2="75"/>
  <line class="edge" x1="480" y1="75" x2="560" y2="60"/>

  <line class="flow" x1="410" y1="110" x2="410" y2="135" marker-end="url(#alp)"/>

  <!-- Layer 1: SvStorableNode -->
  <rect class="fill" x="190" y="135" width="440" height="50"/>
  <text x="205" y="155" class="b">SvStorableNode</text>
  <text x="205" y="173" class="dim">Slot setters trigger didUpdateSlot &amp; mark object dirty</text>

  <line class="flow" x1="410" y1="185" x2="410" y2="210" marker-end="url(#alp)"/>

  <!-- Layer 2: SvObjectPool -->
  <rect class="fill" x="190" y="210" width="440" height="50"/>
  <text x="205" y="230" class="b">SvObjectPool</text>
  <text x="205" y="248" class="dim">In-memory dirty cache; serializes dirty nodes to SvRecordRow</text>

  <line class="flow" x1="410" y1="260" x2="410" y2="285" marker-end="url(#alp)"/>

  <!-- Layer 3: SvLocalRecordStore -->
  <rect class="fill" x="190" y="285" width="440" height="50"/>
  <text x="205" y="305" class="b">SvLocalRecordStore</text>
  <text x="205" y="323" class="dim">Row database holding all pool records (objectId == poolId)</text>

  <line class="flow" x1="410" y1="335" x2="410" y2="360" marker-end="url(#alp)"/>

  <!-- Layer 4: SvPersistentAtomicMap -->
  <rect class="fill" x="190" y="360" width="440" height="50"/>
  <text x="205" y="380" class="b">SvPersistentAtomicMap &amp; SvIndexedDbFolder</text>
  <text x="205" y="398" class="dim">Synchronous Map cache; batched writes on commit</text>

  <line class="flow" x1="410" y1="410" x2="410" y2="435" marker-end="url(#alp)"/>

  <!-- Storage Engine -->
  <rect class="box" x="190" y="435" width="440" height="35"/>
  <text x="205" y="457" class="b">IndexedDB (Browser) / LevelDB (Node.js Headless)</text>
</svg>

---

## Opting Into Persistence

Domain classes opt into local persistence by extending `SvStorableNode` and configuring storage flags:

```javascript
(class Task extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("title", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true); // Marks slot value for serialization
        }
        {
            const slot = this.newSlot("score", 0);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
        }
        {
            const slot = this.newSlot("transientCache", null);
            // Not stored — recomputed at runtime
        }
    }

    initPrototype () {
        this.setShouldStore(true);         // Enables persistence for this node
        this.setShouldStoreSubnodes(true); // Persists child subnodes array
    }

}.initThisClass());
```

### Storage Flags Breakdown:
- **`setShouldStore(true)`**: Called in `initPrototype()`. Enables persistence for instances of the node.
- **`setShouldStoreSlot(true)`**: Called in `initPrototypeSlots()`. Includes individual slot values in serialized JSON record rows.
- **`setShouldStoreSubnodes(true)`**: Persists the node's `subnodes` array. When false, subnodes are re-created dynamically on load (typically via `setFinalInitProto()` on `setIsSubnodeField(true)` slots).

---

## Inheritance Chain

Storage capabilities begin at `SvStorableNode` in the core node hierarchy:

```
SvNode -> SvTitledNode -> SvInspectableNode -> SvViewableNode -> SvStyledNode -> SvStorableNode
```

Classes above `SvStorableNode` cannot be persisted. Application domain models extend `SvStorableNode` or `SvSummaryNode`.

---

## Persistent Unique IDs (`puuid`)

Every stored object has a **puuid**—a 10-character random string generated via `crypto.getRandomValues()` and stored as `_puuid`.

Puuids serve two key roles:
1. **Record Row Key:** Combined with `poolId`, the `puuid` forms the object ID key in storage (`objectId`). For pool root objects, `objectId == poolId`.
2. **Object Pointers:**
   - **Near References (`{ "*": "puuid" }`):** References between objects within the same pool store local `puuid` pointers.
   - **Far References (`{ "**": "poolId" }`):** Pointers across pool boundaries store external pool IDs.

---

## Record Serialization & Local-Only Slots

Domain objects serialize to JSON record rows via `recordForStore(aStore)`:

```json
{
    "type": "Task",
    "entries": [
        ["title", "Buy Groceries"],
        ["score", 10],
        ["assignee", { "*": "u-99120" }]
    ]
}
```

### Local-Only Slots (`slot.setIsInCloudRecord(false)`):
A slot can be kept on the local device without being included in cloud sync commits:

```javascript
slot.setIsInCloudRecord(false);
```

Local-only slots are saved into local IndexedDB rows but stripped when generating cloud commit payloads (`SvObjectPool.cloudPayloadFor`). Local view states, scroll offsets, and sync timers use local-only slots.

---

## Mutation Tracking & Batched Commits

1. **Setter Invoked:** Setting a slot value calls `didUpdateSlot()`.
2. **Dirty Registration:** `didUpdateSlot()` calls `didMutate()`, notifying the `SvObjectPool` via a mutation observer.
3. **Coalesced Commit Pass:** `SvObjectPool` adds the object to its dirty set and schedules a deferred commit pass with `SvSyncScheduler`.
4. **Atomic Transaction:** At the end of the browser event loop, `commitStoreDirtyObjects()` serializes all dirty objects and writes them to IndexedDB in a single atomic transaction.

---

## `SvPersistentAtomicMap` & Multi-Backend Abstraction

`SvPersistentAtomicMap` wraps `SvIndexedDbFolder` with a synchronous in-memory `Map` cache:
- **Synchronous Reads:** Reads are served instantly from the in-memory cache without async IndexedDB latency.
- **Batched Writes:** Writes modify the in-memory write cache and are flushed to disk in atomic transactions during commit passes.
- **Environment Abstraction (`SvIndexedDbFolder`):** Uses native IndexedDB in the browser and LevelDB (`classic-level`) in Node.js, providing identical storage behavior for headless testing and browser execution.

---

## Opening Pools & Class Migrations (`ClassRenames.json`)

The application opens local object pools at boot:

```javascript
const pool = SvPersistentObjectPool.sharedPool();
await pool.promiseOpen();
const root = await pool.rootOrIfAbsentFromClosure(() => {
    return TaskRootNode.clone();
});
```

### Class Migrations:
When refactoring domain class names in code, existing stored records contain the old class name. Strvct maps old class names to new constructors via `ClassRenames.json`:

```json
{
    "OldTaskNode": "Task"
}
```

---

## Related Guides

- [Cloud Object Pools](../Cloud%20Object%20Pools/index.html): Versioned cloud record store synchronization and commits.
- [Local and Cloud Blob Storage](../Local%20and%20Cloud%20Blob%20Storage/index.html): Content-addressable binary asset storage.
- [Technical Overview](../../Technical%20Overview/index.html): High-level architecture and local-first triad.
