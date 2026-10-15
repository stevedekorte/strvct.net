# Local Object Pools

IndexedDB-backed persistence for domain object graphs using dirty tracking, local object pools, and atomic commits.

## Overview

Strvct's persistence engine is **local-first**: application state is stored directly in the browser's IndexedDB. Rather than requiring developers to write explicit SQL/ORM queries or API save calls, the framework monitors slot mutations automatically and commits dirty objects at the end of each browser event loop.

<svg viewBox="0 0 820 180" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="alp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <!-- 4 Uniform Boxes (w: 170, h: 50) -->
  <rect class="box" x="20" y="20" width="170" height="50"/>
  <text x="35" y="40" class="b">SvStorableNode</text>
  <text x="35" y="58" class="dim">Slot setter marks dirty</text>

  <line class="flow" x1="190" y1="45" x2="220" y2="45" marker-end="url(#alp)"/>

  <rect class="fill" x="220" y="20" width="170" height="50"/>
  <text x="235" y="40" class="b">SvObjectPool</text>
  <text x="235" y="58" class="dim">In-memory dirty cache</text>

  <line class="flow" x1="390" y1="45" x2="420" y2="45" marker-end="url(#alp)"/>

  <rect class="fill" x="420" y="20" width="170" height="50"/>
  <text x="435" y="40" class="b">SvLocalRecordStore</text>
  <text x="435" y="58" class="dim">JSON row serializer</text>

  <line class="flow" x1="590" y1="45" x2="620" y2="45" marker-end="url(#alp)"/>

  <rect class="box" x="620" y="20" width="180" height="50"/>
  <text x="635" y="40" class="b">IndexedDB</text>
  <text x="635" y="58" class="dim">Atomic key-value store</text>

  <!-- Footnote -->
  <text x="410" y="110" text-anchor="middle" class="dim">Mutations post dirty-node notifications; SvObjectPool batches write operations into an atomic IndexedDB transaction at the end of the event loop.</text>
</svg>

---

## The Object Pool Concept (`SvObjectPool`)

In Strvct, persistence is organized into **Object Pools**. Each document or aggregate root object owns a pool identified by a `poolId`:

- **Pool Isolation:** All domain objects within a document belong to the same `SvObjectPool`.
- **In-Pool References (`{ "*": puuid }`):** Object relationships within the same pool store local persistent UUID pointers.
- **Cross-Pool References (`{ "**": poolId }`):** References to objects in other document pools store external pool pointers, loaded asynchronously on demand.

### Record Row Schema:
Every object in a pool serializes into a clean JSON record row:

```json
{
    "poolId": "p-10023",
    "puuid": "u-88491",
    "type": "Character",
    "slots": {
        "name": "Thorin Oakenshield",
        "level": 12,
        "inventory": { "*": "u-99210" }
    }
}
```

---

## Dirty Tracking & Event Loop Commits

Persistence operates with zero manual `save()` calls:

1. **Setter Trigger:** Calling a slot setter marked `setShouldStoreSlot(true)` updates slot state and invokes `didMutate()`.
2. **Dirty Set Registration:** `didMutate()` notifies the node's `SvObjectPool`, adding the object's `puuid` to the in-memory dirty set.
3. **Coalesced Transaction:** At the end of the browser event loop, `SvObjectPool` iterates over dirty objects, serializes them to JSON records, and writes them to IndexedDB in a single **atomic transaction**.

```javascript
(class Character extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true); // Automatically registers with object pool dirty tracking
        }
    }

    initPrototype () {
        this.setShouldStore(true);
    }

}.initThisClass());
```

---

## Garbage Collection & Object Pool Lifecycle

`SvObjectPool` automatically manages local storage cleanup:

1. **Mark & Sweep Tracing:** The object pool traces reachable node references starting from the pool root object.
2. **Unreachable Deletion:** Stored records that are no longer reachable from the root object are automatically purged from IndexedDB during pool maintenance passes.
3. **Zero Dangling Pointers:** Deleting a parent node cleans up its child subnode subtree without leaving orphan records in local storage.

---

## Related Guides

- [Cloud Object Pools](../Cloud%20Object%20Pools/): Versioned cloud synchronization and conflict detection.
- [Local and Cloud Blob Storage](../Local%20and%20Cloud%20Blob%20Storage/): SHA-256 content-addressable binary asset storage.
- [Technical Overview](../../Technical%20Overview/): High-level system architecture and local-first philosophy.
