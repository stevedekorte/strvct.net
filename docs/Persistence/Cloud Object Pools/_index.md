# Cloud Object Pools

Cloud persistence for object pools: one record per row, a version per pool, and a commit protocol.

## Overview

Every cloud document — a game session, a character, a catalog campaign — is an object pool: a graph of records reachable from one root record. Locally the pool's rows live in the shared record store (see [Local Object Pools](../Local%20Object%20Pools/)); in the cloud the **same rows** live in a records collection, one cloud document per record. There is no second format: the local row is a subset of the cloud row, a single mapper turns objects into rows on both sides, and syncing is "read rows from one side, write them into the other".

<svg viewBox="0 0 820 300" width="820" xmlns="http://www.w3.org/2000/svg">
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
  <rect class="box" x="20" y="20" width="230" height="250"/>
  <text x="35" y="42" class="b">Browser</text>
  <rect class="fill" x="35" y="60" width="200" height="52"/>
  <text x="50" y="80" class="b">SvObjectPool</text>
  <text x="50" y="98" class="dim">one document's live objects</text>
  <line class="flow" x1="135" y1="112" x2="135" y2="140" marker-end="url(#cop)"/>
  <rect class="fill" x="35" y="140" width="200" height="52"/>
  <text x="50" y="160" class="b">SvLocalRecordStore</text>
  <text x="50" y="178" class="dim">every pool's rows (IndexedDB)</text>
  <text x="35" y="222" class="dim">the root row mirrors the</text>
  <text x="35" y="240" class="dim">last acknowledged version</text>
  <rect class="box" x="295" y="20" width="230" height="250"/>
  <text x="310" y="42" class="b">SvCloudRecordStore</text>
  <rect class="fill" x="310" y="60" width="200" height="52"/>
  <text x="325" y="80" class="b">reads</text>
  <text x="325" y="98" class="dim">open · changes · children · roots</text>
  <rect class="fill" x="310" y="140" width="200" height="52"/>
  <text x="325" y="160" class="b">commit</text>
  <text x="325" y="178" class="dim">baseVersion → version | conflict</text>
  <text x="310" y="222" class="dim">over the backend's</text>
  <text x="310" y="240" class="dim">callFunction(name, args)</text>
  <rect class="box" x="570" y="20" width="230" height="250"/>
  <text x="585" y="42" class="b">Cloud</text>
  <rect class="fill" x="585" y="60" width="200" height="88"/>
  <text x="600" y="80" class="b">records</text>
  <text x="600" y="98" class="dim">one document per record</text>
  <text x="600" y="116" class="dim">root row: version, state,</text>
  <text x="600" y="134" class="dim">parentId, orderKey, owner</text>
  <rect class="fill" x="585" y="168" width="200" height="52"/>
  <text x="600" y="188" class="b">blobs/&lt;sha256&gt;</text>
  <text x="600" y="206" class="dim">content-addressed, lazy</text>
  <text x="585" y="248" class="dim">scopes: owners and members</text>
  <line class="flow" x1="235" y1="160" x2="310" y2="160" marker-end="url(#cop)"/>
  <line class="flow" x1="310" y1="180" x2="235" y2="180" marker-end="url(#cop)"/>
  <text x="272" y="152" text-anchor="middle" class="dim">rows</text>
  <line class="flow" x1="510" y1="86" x2="585" y2="86" marker-end="url(#cop)"/>
  <line class="flow" x1="585" y1="104" x2="510" y2="104" marker-end="url(#cop)"/>
  <line class="flow" x1="510" y1="166" x2="585" y2="126" marker-end="url(#cop)"/>
</svg>

The model in five sentences:

1. **A pool's id is its root object's puuid**, so the root row is the one whose `objectId` equals its `poolId`.
2. That row — and only that row — also carries the pool's **server-owned state** (`version`, `state`) and its **place in the tree** (`parentId`, `orderKey`, owner).
3. **A folder is a pool too**, usually one whose only row is its root; folders never list their children — a folder's children are the root rows whose `parentId` names it.
4. A **far reference**, `{ "**": poolId }`, is the only way to point across a pool boundary, and following it is asynchronous.
5. Edits reach the cloud through one **commit protocol**: the records changed since the last acknowledged version, compared and applied atomically against that version.

In the cloud a pool is named by its scoped id, `"<scopeId>:<localPoolId>"` (`SvRecordRow.scopedPoolId`), so two accounts holding a copy of the same template never collide; the root record's object id is the local part.

## Rows

A row is one object's serialized record plus the columns the store needs to find, order and version it. `SvRecordRow` defines the shape and its checks.

| Column | Root row (`objectId = poolId`) | Any other row | Written by |
|--------|-------------------------------|---------------|-----------|
| `poolId`, `objectId` | the pool and the root object | the pool and the object | client |
| `parentId`, `orderKey` | the folder (or collection node) this pool is placed under, and its fractional sort key | set on placed elements of a windowed collection; otherwise null | client |
| `payloadJson` | the root object's record | the object's record | client — the only content a commit carries |
| `version` | the pool's content sequence, advanced by every commit | — | server, mirrored down |
| `modifiedVersion`, `isDeleted` | as any row | the version that last wrote the row; a tombstone | server, mirrored down |
| `scopeId`, `state`, owner | the pool's sharing boundary and lifecycle | `scopeId` only | server |

Only what the server writes is a column; everything about a document that the application cares about — title, subtitle, thumbnail hash, provenance — is ordinary slots on the root object, in its payload. A folder listing therefore needs nothing but root rows: each one carries enough to draw the document's tile without opening it.

**Local-only slots.** A stored slot can stay on the device: `slot.setIsInCloudRecord(false)` keeps it in the local row's payload and strips it from what a commit sends (`SvObjectPool.cloudPayloadFor`). Sync timestamps and other device bookkeeping use it, so a load or a view refresh never causes a commit.

**Blobs.** Records never inline binary data. An image or a spilled long string is a content hash in the payload; the bytes are a content-addressed blob in cloud storage, fetched when shown. The reference backend extracts each record's hashes on commit (`blobRefs`), so blob garbage collection is a set difference over rows, never a scan of payloads. See [Local and Cloud Blob Storage](../Local%20and%20Cloud%20Blob%20Storage/).

## The Store Protocol

`SvRecordStoreProtocol` is the one interface every backing implements; a single fixture-driven suite (`TestRecordStoreMemory`, `TestRecordStore`) pins them to the same behavior:

| Method | Answers |
|--------|---------|
| `asyncOpen(poolId)` | `{ root, records, version, state }` — the whole pool, or null |
| `asyncReadChanges(poolId, sinceVersion)` | `{ rows, tombstones, version, reloadRequired }` — what changed after a version |
| `asyncChildren(nodeId, range)` | the rows placed under a node, ordered by `(orderKey, objectId)` |
| `asyncResolveFar(poolId)` | the pool a far reference names |
| `asyncPut(rows)` / `asyncDelete(keys)` | mirror writes (local backings only) |
| `asyncCommit({ poolId, baseVersion, requestId, writes, deletes })` | `{ status: "committed", version }`, `"conflict"` or `"refused"` (cloud and memory backings) |

| Backing | Role |
|---------|------|
| `SvLocalRecordStore` | The device's mirror: every pool's rows in one database. Puts and deletes; no commit protocol. |
| `SvMemoryRecordStore` | The reference implementation of both sides, including the commit and staged-commit protocol; used by headless tests and as an in-memory cache of cloud pools. |
| `SvCloudRecordStore` | The cloud: reads and commits over a backend that answers `callFunction(name, args)`. Refuses `asyncPut` / `asyncDelete` — the cloud is written only through commits. |

## Reading a Pool

Opening a document from the cloud reads its rows and imports them into the local store, which opens the pool there:

1. **A device holding an in-sync copy asks only for changes.** `SvLocalRecordStore.inSyncVersionOfPool(poolId)` answers the cloud version the local copy reflects, when the copy has no edit made since it last synced. The opener then calls `asyncReadChanges(cloudPoolId, version)` and applies the answer with `asyncImportPoolChanges` — usually nothing changed, so a returning device opens a long session with one small read.
2. **Otherwise the whole pool is read** with `asyncOpen` and imported with `asyncImportOpenedPool`, replacing the local copy: the cloud wins.
3. **`reloadRequired`** — the cloud no longer remembers deletions that far back — falls back to the whole-pool read.

A reader takes the root's `version` first and accepts only rows stamped at or below it, so a large commit still being written is never seen half-done. Rows imported from the cloud are a load, not an edit: nothing is marked dirty and nothing is sent back.

## Writing a Pool

Edits are stored locally first, at the end of each event loop, exactly as for any pool. Sending them to the cloud is a separate, debounced step: `SvObjectPool.asyncCommitToCloud(cloudStore, options)`.

1. Flush pending local writes, then compute the **changes since the last synced snapshot** (`cloudChanges()`): records whose cloud payload differs, records that are gone, and placed rows whose placement moved.
2. Send them as one commit with the root row's mirrored `version` as `baseVersion` and a fresh `requestId`. The first commit of a new pool passes `create: { scopeId }`.
3. **Committed** — the server's new `version` and each written row's `modifiedVersion` are mirrored onto the local rows through the non-dirtying path, and the snapshot advances to what was sent.
4. **Conflict** — another writer's commit landed first. Nothing local changes; the caller reloads (the cloud wins) and can use `holdsCommitContent(commit)` to tell whether the refused commit lost anything.
5. **Refused** — the request broke a rule (a server-owned column, a row of another pool, deleting the root); the caller reports it.

On the server a commit is one transaction: check the request-id receipt (a retry returns the saved answer), read the root row, require `version == baseVersion`, advance it, stamp each written row and tombstone with the new version, write the receipt. Retries keep the original base version — they never adopt the newest and overwrite someone else. **There are no document locks.** Readers never conflict; writers conflict only at commit and are told.

### Large Commits

A commit over the backing's transaction limit (`maxOpsPerCommit()` 450 operations, or 4 MB of payload) is **staged** by `SvStagedRecordCommit`: begin (a compare-and-set that reserves the next version), write in batches, finalize (the root row, the version and the receipt in one transaction). While a stage is open the pool answers **busy** — opens, change reads and commits — and `SvCloudRecordStore` waits and retries (`busyRetryDelays`) rather than reading around it. A stage abandoned mid-way is rolled back by the next access that touches the pool, from the pre-images the batches saved.

## Folders

A folder whose children are documents declares `setSubnodesArePools(true)`, which every `SvCloudFolder` does. Its membership is not a list it stores: a document is in a folder because the document's root row is placed there.

- **Listing** — `asyncListedRootRows()` asks the record cloud for every root row in the folder's scope (`SvCloudRecordStore.asyncScopeRootRows(scopeId)`, one request per scope, shared by every folder that asks at the same time) and `applyRootRowListing` takes the rows placed under the folder's id. Each becomes a placeholder child built from the row's fields (`rowFieldsFromRecordPayload`): title, subtitle, thumbnail and the cloud version, without loading the document.
- **Pruning** — a complete listing is authoritative: a local child the cloud no longer lists is removed, and a deletion outranks a child's unsent edits. An incomplete listing never prunes.
- **The folder's own row** — a folder that is itself a pool answers `cloudFolderRow()` and, when the user may write it (`mayWriteFolderRow()`), writes its row after a complete listing that lacks it or holds an older one (`asyncPutRootRow`).
- **Saving** — `asyncSyncToCloud()` saves each dirty child document and flushes the folder's deletion queue.
- **Deleting** — removing a child queues a stored delete descriptor (`pendingCloudDeletes`) that survives reloads and retries on every pass until the cloud confirms. It doubles as a tombstone: no listing re-adds a child whose delete is pending. Deleting a pool in the cloud also deletes every pool placed beneath it.

An application binds a folder to its backend by overriding three hooks: `cloudFsScopeRootId()` (the scope it lists), `defaultFsBackend()` (scope operations and deletes) and `folderRecordStore()` (the `SvCloudRecordStore` it lists from).

## Far References

A reference to an object in another pool is stored as `{ "**": poolId }`, never as `{ "*": puuid }`. It names the pool, not a record, so the target can be republished, copied or moved without the reference changing. A far reference keeps nothing alive and grants nothing: resolving it opens the target under the target's own permissions, and a dangling far reference is a normal state to show, not an error. Crossing a pool boundary is a far reference (shared, read-only) or a copy (a new pool with fresh puuids), never a re-key.

## Scopes and Permissions

Every row carries the `scopeId` of its sharing boundary — an account's home, the public catalog, a multiplayer session — and every request is checked against that scope once: the caller is its owner, a member, or the scope is public. Permissions live in a small server-owned scope store (owners, members, invites), not in records, so no commit can change who may read or write a pool. The framework sees none of this beyond the scope id a folder supplies.

## Key Classes

| Class | Purpose |
|-------|---------|
| `SvObjectPool` | One document's live objects; `asyncCommitToCloud`, `cloudChanges`, `holdsCommitContent` |
| `SvLocalRecordStore` | The device's rows; `inSyncVersionOfPool`, `asyncImportOpenedPool`, `asyncImportPoolChanges` |
| `SvCloudRecordStore` | The record cloud: reads, commits, staged commits, busy retries, shared scope listings |
| `SvMemoryRecordStore` | The reference implementation of the protocol, for tests and in-memory caches of cloud pools |
| `SvStagedRecordCommit` | Drives a commit too large for one transaction |
| `SvRecordRow` / `SvRecordStoreProtocol` | The row shape and the store interface |
| `SvCloudFolder` | A folder of documents: lists from scope root rows, saves children, queues deletes |
| `SvOrderKey` | Fractional order keys for placement |

The older file-based collection sync (`SvCloudSyncSource`, `SvSyncCollectionSource`: one JSON file per item plus a manifest in cloud storage) is still in the framework, but no document class uses it; the record cloud replaced it, and the `pool.json` snapshot-plus-write-ahead-log format, its leases and its compaction were removed.
