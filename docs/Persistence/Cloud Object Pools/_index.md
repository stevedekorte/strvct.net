# Cloud Object Pools

Cloud persistence for object pools: one record per row, a version per pool, and a commit protocol.

## Overview

Every cloud document—a game session, a character sheet, a campaign catalog—is an **Object Pool**: a graph of records reachable from a single root record (`objectId == poolId`).

Locally, pool rows live in `SvLocalRecordStore` (IndexedDB). In the cloud, the **exact same rows** live in a cloud records collection (`SvCloudRecordStore`). There is no second format: a single mapper converts objects to rows on both sides, making cloud sync a simple operation of reading rows from one store and writing them into the other.

<svg viewBox="0 0 820 220" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="cop" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <!-- 3 Columns: Local, Cloud Record Store, Cloud Storage (w: 240, h: 50) -->
  <rect class="box" x="25" y="20" width="240" height="50"/>
  <text x="40" y="40" class="b">SvLocalRecordStore</text>
  <text x="40" y="58" class="dim">Local IndexedDB rows</text>

  <line class="flow" x1="265" y1="45" x2="290" y2="45" marker-end="url(#cop)"/>

  <rect class="fill" x="290" y="20" width="240" height="50"/>
  <text x="305" y="40" class="b">SvCloudRecordStore</text>
  <text x="305" y="58" class="dim">Reads changes &amp; commits deltas</text>

  <line class="flow" x1="530" y1="45" x2="555" y2="45" marker-end="url(#cop)"/>

  <rect class="box" x="555" y="20" width="240" height="50"/>
  <text x="570" y="40" class="b">Cloud Records Collection</text>
  <text x="570" y="58" class="dim">One cloud document per row</text>

  <text x="410" y="110" text-anchor="middle" class="dim">Commits check expected baseVersion and apply row deltas atomically without document locks.</text>
</svg>

### Core Rules of the Record Cloud:
1. **Root Row Identity:** A pool's ID is its root object's `puuid` (`objectId == poolId`).
2. **Server-Owned State:** The root row (and only the root row) carries server-owned columns: `version`, `state`, `parentId`, `orderKey`, and `owner`.
3. **Folder Pools:** Folders are pools whose rows list placed children via root `parentId` references without storing explicit child lists.
4. **Far References (`{ "**": poolId }`):** The only way to point across pool boundaries. Following a far reference is asynchronous.
5. **Atomic Commit Protocol:** Edits reach the cloud through a single commit protocol that compares base versions and applies row deltas.

---

## Record Row Columns (`SvRecordRow`)

| Column | Root Row (`objectId == poolId`) | Child Row | Written By |
|---|---|---|---|
| `poolId`, `objectId` | Identifies pool and root object | Identifies pool and child object | Client |
| `parentId`, `orderKey` | Identifies folder placement & fractional sort order | Fractional sort order for windowed collections | Client |
| `payloadJson` | Root object's slot record | Child object's slot record | Client (commit payload) |
| `version` | Monotonic content sequence number | — | Server (mirrored down) |
| `modifiedVersion`, `isDeleted` | Version that last updated row | Last modified version; tombstone flag | Server (mirrored down) |
| `scopeId`, `state`, `owner` | Sharing boundary & lifecycle state | `scopeId` only | Server |

---

## The Record Store Protocol (`SvRecordStoreProtocol`)

Every record store implementation conforms to `SvRecordStoreProtocol`:

- **`asyncOpen(poolId)`**: Returns `{ root, records, version, state }` for the entire pool.
- **`asyncReadChanges(poolId, sinceVersion)`**: Returns `{ rows, tombstones, version, reloadRequired }` updated after `sinceVersion`.
- **`asyncChildren(nodeId, range)`**: Returns root rows placed under `nodeId` ordered by `(orderKey, objectId)`.
- **`asyncCommit({ poolId, baseVersion, requestId, writes, deletes })`**: Posts an atomic transaction. Returns `{ status: "committed", version }`, `"conflict"`, or `"refused"`.

---

## Commit Mechanics & Conflict Resolution

Edits are saved locally first at the end of the event loop, and sent to the cloud via `SvObjectPool.asyncCommitToCloud()`:

1. **Compute Delta:** Flushes local writes and computes rows changed since the last synced snapshot (`cloudChanges()`).
2. **Post Commit:** Sends modified rows with the local root's `version` as `baseVersion` and a unique `requestId`.
3. **Optimistic Concurrency Control:**
   - **`committed`**: The server's new `version` is stamped on local rows, and the snapshot advances.
   - **`conflict`**: Another client committed first. The local pool reloads remote changes (`cloud wins`).
   - **`refused`**: The commit violated a rule (e.g. attempting to modify server-owned columns).

---

## Staged Commits for Large Payload Transactions

For commits exceeding server transaction limits (`maxOpsPerCommit()` 450 ops or 4MB payload), `SvStagedRecordCommit` stages the transaction:
1. **Begin:** Reserves the next version via a compare-and-set operation.
2. **Batch Writes:** Pushes row updates in sequential batches.
3. **Finalize:** Commits the root row, version, and request receipt in a final transaction.

If a stage is abandoned mid-way, the next access to the pool automatically rolls back incomplete batches from saved pre-images.

---

## Folders & Scope Root Listings (`SvCloudFolder`)

Folders (`SvCloudFolder`) manage collections of document pools via fractional order keys (`SvOrderKey`):
- **Root Row Scope Listing:** A folder queries scope root rows (`asyncScopeRootRows(scopeId)`). Each root row contains enough metadata (title, subtitle, thumbnail hash) to display placeholder tiles without opening child pools.
- **Tombstone Queues:** Deleting a document queues a pending delete descriptor (`pendingCloudDeletes`) that survives reloads until confirmed by the server.

---

## Related Guides

- [Local Object Pools](../Local%20Object%20Pools/): Local IndexedDB persistence engine.
- [Local and Cloud Blob Storage](../Local%20and%20Cloud%20Blob%20Storage/): SHA-256 content-addressable binary asset storage.
