# Cloud Object Pools

Cloud persistence for object pools: one record per row, a version per pool, and an atomic commit protocol.

## Overview

Every cloud document—a game session, a character sheet, a campaign catalog—is an **Object Pool**: a cyclic graph of records reachable from a single root record (`objectId == poolId`).

Locally, pool rows live in `SvLocalRecordStore` (IndexedDB). In the cloud, the **exact same rows** live in a cloud records collection (`SvCloudRecordStore`). There is no second format: a single mapper converts objects to rows on both sides, making cloud sync a simple operation of reading rows from one store and writing them into the other.

<svg viewBox="0 0 820 280" width="820" xmlns="http://www.w3.org/2000/svg">
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

  <rect class="box" x="25" y="20" width="240" height="220"/>
  <text x="40" y="42" class="b">Browser Client</text>

  <rect class="fill" x="40" y="60" width="210" height="45"/>
  <text x="55" y="80" class="b">SvObjectPool</text>
  <text x="55" y="95" class="dim">Live object graph in memory</text>

  <line class="flow" x1="145" y1="105" x2="145" y2="130" marker-end="url(#cop)"/>

  <rect class="fill" x="40" y="130" width="210" height="45"/>
  <text x="55" y="150" class="b">SvLocalRecordStore</text>
  <text x="55" y="165" class="dim">IndexedDB row cache</text>

  <text x="40" y="200" class="dim">Root row mirrors last</text>
  <text x="40" y="215" class="dim">acknowledged cloud version</text>

  <line class="flow" x1="265" y1="152" x2="290" y2="152" marker-end="url(#cop)"/>
  <line class="flow" x1="290" y1="168" x2="265" y2="168" marker-end="url(#cop)"/>

  <rect class="fill" x="290" y="20" width="240" height="220"/>
  <text x="305" y="42" class="b">SvCloudRecordStore</text>

  <rect class="box" x="305" y="60" width="210" height="70"/>
  <text x="320" y="80" class="b">Read Operations</text>
  <text x="320" y="98" class="dim">open · changes · children</text>
  <text x="320" y="116" class="dim">asyncScopeRootRows</text>

  <rect class="box" x="305" y="145" width="210" height="70"/>
  <text x="320" y="165" class="b">Commit Operation</text>
  <text x="320" y="183" class="dim">baseVersion → version</text>
  <text x="320" y="201" class="dim">Idempotent requestId check</text>

  <line class="flow" x1="530" y1="95" x2="555" y2="95" marker-end="url(#cop)"/>
  <line class="flow" x1="530" y1="180" x2="555" y2="180" marker-end="url(#cop)"/>

  <rect class="box" x="555" y="20" width="240" height="220"/>
  <text x="570" y="42" class="b">Cloud Backend (Firestore/DB)</text>

  <rect class="fill" x="570" y="60" width="210" height="70"/>
  <text x="585" y="80" class="b">records Collection</text>
  <text x="585" y="98" class="dim">One cloud doc per record row</text>
  <text x="585" y="116" class="dim">Root row holds pool version</text>

  <rect class="fill" x="570" y="145" width="210" height="70"/>
  <text x="585" y="165" class="b">blobs/&lt;sha256&gt;</text>
  <text x="585" y="183" class="dim">Content-addressed storage</text>
  <text x="585" y="201" class="dim">Lazy fetch on render</text>
</svg>

### The Cloud Model in Five Sentences:
1. **Root Row Identity:** A pool's ID is its root object's `puuid` (`objectId == poolId`).
2. **Server-Owned State:** The root row—and only the root row—carries server-owned columns: `version`, `state`, `parentId`, `orderKey`, and `owner`.
3. **Zero-List Folder Pools:** Folders are pools whose rows list placed children via root `parentId` references without storing explicit child lists.
4. **Far References (`{ "**": poolId }`):** The only way to point across pool boundaries. Following a far reference is asynchronous.
5. **Atomic Commit Protocol:** Edits reach the cloud through a single commit protocol that compares base versions and applies row deltas atomically.

---

## Scoped Pool Identifiers (`scopedPoolId`)

In the cloud, a pool is identified by its scoped ID:

```
<scopeId>:<localPoolId>
```

- **`scopeId`:** The sharing boundary (e.g., user account ID, multiplayer room ID, public catalog ID).
- **`localPoolId`:** The root object's `puuid` string.

Scoped pool IDs ensure that two accounts cloning the same template document never collide in cloud storage.

---

## Record Row Columns (`SvRecordRow`)

| Column | Root Row (`objectId == poolId`) | Child Row | Written By |
|---|---|---|---|
| `poolId`, `objectId` | Pool ID &amp; root object ID | Pool ID &amp; child object ID | Client |
| `parentId`, `orderKey` | Folder ID &amp; fractional sort key | Sort key for windowed collections | Client |
| `payloadJson` | Root object's slot record | Child object's slot record | Client (commit payload) |
| `version` | Monotonic content sequence number | — | Server (mirrored down) |
| `modifiedVersion`, `isDeleted` | Version that last updated row | Last modified version; tombstone flag | Server (mirrored down) |
| `scopeId`, `state`, `owner` | Sharing boundary &amp; lifecycle state | `scopeId` only | Server |

### Local-Only Slots:
A stored slot can be kept exclusively on the device: `slot.setIsInCloudRecord(false)` keeps it in the local IndexedDB record row but strips it when generating cloud commit payloads (`SvObjectPool.cloudPayloadFor`). Local view settings, scroll positions, and device sync timestamps use this mechanism to prevent triggering unnecessary cloud commits.

---

## The Record Store Protocol (`SvRecordStoreProtocol`)

Every backing implementation conforms to `SvRecordStoreProtocol`:

| Method | Answers / Action |
|---|---|
| `asyncOpen(poolId)` | `{ root, records, version, state }` — the entire pool, or `null`. |
| `asyncReadChanges(poolId, sinceVersion)` | `{ rows, tombstones, version, reloadRequired }` — modified rows since version. |
| `asyncChildren(nodeId, range)` | Rows placed under `nodeId` ordered by `(orderKey, objectId)`. |
| `asyncResolveFar(poolId)` | Opens the pool a far reference points to. |
| `asyncCommit({ poolId, baseVersion, requestId, writes, deletes })` | Atomic commit: returns `{ status: "committed", version }`, `"conflict"`, or `"refused"`. |

### Backing Implementations:
- **`SvLocalRecordStore`:** The device's IndexedDB store holding every local pool row. Accepts `asyncPut` / `asyncDelete`.
- **`SvMemoryRecordStore`:** Reference implementation of both sides (including commit protocol) used for headless testing and in-memory cloud caches.
- **`SvCloudRecordStore`:** The cloud backing executing `callFunction(name, args)` over HTTPS. Refuses direct writes; modified only via `asyncCommit`.

---

## Reading a Pool (Opening Decision Tree)

When opening a document, Strvct uses an optimized decision tree to minimize network bandwidth:

```
               [ User Opens Document ]
                          |
                          v
         Has Local In-Sync Version? (inSyncVersionOfPool)
                 /                 \
            YES /                   \ NO
               v                     v
    asyncReadChanges(sinceVersion)    asyncOpen(poolId)
            /             \          (Fetch Whole Pool)
     Normal /              \ reloadRequired=true
           v                v
   Import Deltas          Replace Local Copy
  (0 to 1 row download)   (Cloud Wins)
```

1. **In-Sync Version Check:** The opener queries `SvLocalRecordStore.inSyncVersionOfPool(poolId)`. If a local copy exists with no unsent local edits, it calls `asyncReadChanges(cloudPoolId, version)`. For returning users, this transfers **0 to 1 rows** instead of re-downloading the entire document.
2. **Whole-Pool Download:** If no local version exists, it calls `asyncOpen(poolId)` and imports the full pool (`asyncImportOpenedPool`).
3. **`reloadRequired` Handling:** If the server has pruned tombstones since `sinceVersion`, it returns `reloadRequired: true`, falling back to a full pool download.
4. **Atomic Snapshot Reading:** Readers accept only rows stamped at or below the root's `version`, ensuring a commit currently being written is never seen half-finished.

---

## Writing & Commit Protocol

Edits are saved locally first at the end of the event loop. Sending them to the cloud is a separate, debounced step: `SvObjectPool.asyncCommitToCloud()`:

1. **Flush Local Writes:** Flushes pending local IndexedDB writes and computes changed rows since the last acknowledged cloud snapshot (`cloudChanges()`).
2. **Post Commit Request:** Sends modified rows with the local root's `version` as `baseVersion` and a unique `requestId`.
3. **Idempotent Receipts:** The server records the `requestId`. If a network interruption causes the client to retry the request, the server returns the saved receipt without double-incrementing the pool version.
4. **Optimistic Concurrency Control:**
   - **`committed`**: The server's new `version` is stamped on local rows, and the snapshot advances.
   - **`conflict`**: Another client committed first. The caller invokes `holdsCommitContent(commit)` to check if its edits were included before reloading remote changes (`cloud wins`).
   - **`refused`**: The commit violated a rule (e.g. attempting to edit server-owned columns).

---

## Staged Commits (`SvStagedRecordCommit`)

For commits exceeding transaction limits (`maxOpsPerCommit()` 450 operations or 4 MB of payload), `SvStagedRecordCommit` stages the write:

1. **Begin:** Reserves the next pool version via a compare-and-set operation.
2. **Batch Writes:** Pushes row updates in sequential batches.
3. **Finalize:** Commits the root row, version, and request receipt in a final transaction.

While a stage is open, the pool answers **busy** to other readers/writers, and `SvCloudRecordStore` retries automatically (`busyRetryDelays`). If a stage is abandoned mid-way, the next access to the pool rolls back incomplete batches from saved pre-images.

---

## Zero-List Folder Membership (`SvCloudFolder`)

Folders (`SvCloudFolder`) declare `setSubnodesArePools(true)`. A folder **never stores a list of child IDs**:

- **Placement:** A document is in a folder because the document's root row sets its `parentId` to the folder's ID.
- **Scope Root Listings:** A folder queries scope root rows via `asyncScopeRootRows(scopeId)`. Each root row contains enough metadata (title, subtitle, thumbnail hash) to render placeholder tiles without opening child pool bodies.
- **Pruning & Tombstones:** If a complete scope listing omits a child, the local child is pruned. Deleting a child queues a tombstone descriptor (`pendingCloudDeletes`) that survives reloads until confirmed by the server.

---

## Far References (`{ "**": poolId }`)

A pointer across pool boundaries is stored as `{ "**": poolId }`, naming the target pool root rather than an individual object. It keeps nothing alive and grants no permissions: resolving it opens the target pool under the target's own permissions. A dangling far reference is a normal state to display in the UI rather than an error.

---

## Key Persistence Classes Matrix

| Class | Purpose |
|---|---|
| `SvObjectPool` | Manages live objects for a document; handles `asyncCommitToCloud` & `cloudChanges`. |
| `SvLocalRecordStore` | Manages local IndexedDB rows (`inSyncVersionOfPool`, `asyncImportOpenedPool`). |
| `SvCloudRecordStore` | Manages cloud record reads, commits, staged commits, and scope root listings. |
| `SvMemoryRecordStore` | Reference implementation of the record store protocol for headless tests. |
| `SvStagedRecordCommit` | Drives multi-batch commits for large payload transactions. |
| `SvRecordRow` | Defines the serialized row shape and column constraints. |
| `SvCloudFolder` | Manages document collections via root `parentId` references and scope listings. |
| `SvOrderKey` | Generates fractional sort keys for document order in collections. |

---

## Related Guides

- [Local Object Pools](../Local%20Object%20Pools/): Local IndexedDB persistence engine.
- [Local and Cloud Blob Storage](../Local%20and%20Cloud%20Blob%20Storage/): SHA-256 binary asset storage.
- [Technical Overview](../../Technical%20Overview/): High-level system architecture.
