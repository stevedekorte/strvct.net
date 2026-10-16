# Local Object Pools

IndexedDB-backed persistence for domain object graphs using dirty tracking, the local record store (`SvLocalRecordStore`), and atomic event-loop commits.

## Overview

Strvct's persistence engine is **local-first**: application state is stored directly in the browser's IndexedDB. Rather than requiring developers to write explicit SQL/ORM queries or API save calls, the framework monitors slot mutations automatically, serializes dirty domain objects into **Record Rows** (`SvRecordRow`), and commits them to IndexedDB at the end of each browser event loop.

```
+-------------------------------------------------------------------------+
|                       Local Record Store Architecture                   |
+-------------------------------------------------------------------------+
|  1. Slot Setter  -->  2. Object Pool Dirty Set  -->  3. Serializer      |
|  4. SvRecordRow  -->  5. SvLocalRecordStore     -->  6. IndexedDB Commit |
+-------------------------------------------------------------------------+
```

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

  <rect class="box" x="25" y="20" width="240" height="50"/>
  <text x="40" y="40" class="b">SvStorableNode</text>
  <text x="40" y="58" class="dim">Slot setter marks dirty</text>

  <line class="flow" x1="265" y1="45" x2="290" y2="45" marker-end="url(#alp)"/>

  <rect class="fill" x="290" y="20" width="240" height="50"/>
  <text x="305" y="40" class="b">SvObjectPool &amp; Row Serializer</text>
  <text x="305" y="58" class="dim">Encapsulates state as SvRecordRow</text>

  <line class="flow" x1="530" y1="45" x2="555" y2="45" marker-end="url(#alp)"/>

  <rect class="fill" x="555" y="20" width="240" height="50"/>
  <text x="570" y="40" class="b">SvLocalRecordStore</text>
  <text x="570" y="58" class="dim">Atomic IndexedDB transaction</text>

  <text x="410" y="110" text-anchor="middle" class="dim">Mutations post dirty-node notifications; SvObjectPool batches write operations into an atomic IndexedDB transaction at the end of the event loop.</text>
</svg>

---

## The Record Store Pattern (`SvLocalRecordStore`)

Strvct organizes persistence around the **Record Store pattern**. Instead of legacy JSON snapshots with write-ahead log (`WAL`) files, every domain object is serialized as an independent record row stored in `SvLocalRecordStore`:

- **Pool Root (`objectId == poolId`):** The primary object of a document owns the pool. Its `puuid` serves as `poolId`.
- **Near References (`{ "*": puuid }`):** References between objects within the same pool store local persistent UUID pointers.
- **Far References (`{ "**": poolId }`):** Pointers to objects in other document pools store external pool IDs and are loaded asynchronously on demand.

### Record Row Schema (`SvRecordRow`):

```json
{
    "poolId": "u-88491",
    "objectId": "u-88491",
    "parentId": "folder-12",
    "orderKey": "a0",
    "payloadJson": {
        "type": "Character",
        "slots": {
            "name": "Thorin Oakenshield",
            "level": 12,
            "inventory": { "*": "u-99210" }
        }
    }
}
```

---

## Local-Only Slots

A slot marked for persistence can be kept on the device without being synced to cloud storage:

```javascript
slot.setIsInCloudRecord(false);
```

Local-only slots are serialized into the local IndexedDB record row payload, but stripped when generating cloud commit payloads (`SvObjectPool.cloudPayloadFor`). Device-specific state, local view settings, and sync timestamps use this mechanism to prevent triggering unnecessary cloud commits.

---

## Garbage Collection

`SvObjectPool` automatically manages local storage cleanup using mark-and-sweep tracing:

1. **Mark Phase:** Traces reachable node references starting from the pool's root object (`objectId == poolId`), following `{ "*": puuid }` pointers.
2. **Sweep Phase:** Any record in IndexedDB belonging to the `poolId` that was not visited during the trace is purged.

---

## Class Name Conversions (`ClassRenames.json`)

When refactoring or renaming a domain class in JavaScript, existing stored IndexedDB records contain the old class name. Strvct handles class migrations via `ClassRenames.json`:

```json
{
    "OldCharacterClass": "Character"
}
```

During deserialization, `SvLocalRecordStore` consults the conversion map, instantiating the new class while preserving existing data on disk.

---

## Related Guides

- [Cloud Object Pools](../Cloud%20Object%20Pools/): Versioned cloud record store synchronization and commits.
- [Local and Cloud Blob Storage](../Local%20and%20Cloud%20Blob%20Storage/): Content-addressable binary asset storage.
- [Technical Overview](../../Technical%20Overview/): High-level architecture and local-first triad.
