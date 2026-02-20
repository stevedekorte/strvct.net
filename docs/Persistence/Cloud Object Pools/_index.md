# Cloud Object Pools

Cloud sync for object pools and collections using Firebase Storage.

## Overview

Strvct's local persistence stores serialized object graphs in IndexedDB via `PersistentObjectPool`. Cloud sync extends this with two complementary strategies depending on what is being synced:

- **Collection sync** — Individual items are synced as separate JSON files with a manifest. Items can be lazily loaded from stubs.
- **Pool sync** — Entire object graphs are synced as a single pool. A write-ahead log of small delta files makes updates fast and efficient — only changed records are uploaded, with periodic compaction back to a full snapshot.

Both strategies require the synced object graph to be **self-contained** — the rest of the system holds only a reference to the graph's root, and objects within the graph hold no persistent references to objects outside it. This isolation is what makes it possible to serialize, upload, and reconstruct the graph independently.

Both strategies use Firebase Storage as the backend and are coordinated by `SvCloudSyncSource`.

## Collection Sync

### How It Works

Each syncable collection maintains a folder in cloud storage at `/users/{userId}/{collectionName}/`. The folder contains one JSON file per item plus a manifest file that tracks ordering and metadata.

**Manifest structure:**

```json
{
  "subnodeIds": ["id1", "id2"],
  "items": {
    "id1": {
      "type": "MyItemClass",
      "title": "Item Title",
      "subtitle": "Item subtitle",
      "thumbnailUrl": "https://...",
      "lastModified": 1707123456789
    }
  }
}
```

The manifest enables lazy loading — the client can display item titles and thumbnails without downloading the full item data. Full item JSON is fetched on demand when the user navigates to an item.

Collections can be nested. `SvCloudSyncSource` supports a `subPath` slot, allowing hierarchical storage structures like `/users/{userId}/{collectionName}/{itemId}/{subCollectionName}/`.

### Sync Flow

**Push to cloud:**

1. Item serialized via `asCloudJson()` which calls `serializeToJson("Cloud", [])`
2. JSON uploaded to `/users/{userId}/{collectionName}/{itemId}.json`
3. Manifest updated with item metadata and re-uploaded

**Pull from cloud:**

1. Manifest fetched to discover available items
2. Stubs created locally for each item (title, subtitle, thumbnail from manifest)
3. Full item data fetched lazily when accessed
4. Local item populated via `deserializeFromJson()`

### Conflict Resolution

Collection sync uses a timestamp-based strategy:

- Each item tracks `cloudLastModified` and `localLastModified`
- If cloud is newer and local has no unsaved changes — update from cloud
- If cloud is newer but local has unsaved changes — keep local (re-upload on next sync)
- If local is newer — upload on next sync

This is a "local wins" strategy — local changes always take priority.

## Pool Sync

### How It Works

For complex object graphs where many interrelated objects need to be synced together, `SubObjectPool` serializes the entire pool as a single JSON document. The pool maps persistent unique IDs (puuids) to serialized object records:

```json
{
  "{puuid1}": "{serialized_object_json}",
  "{puuid2}": "{serialized_object_json}"
}
```

This is stored at `/users/{userId}/{collectionName}/{poolId}/pool.json`.

### Write Ahead Log

To avoid uploading the entire pool on every save, `SubObjectPool` tracks changes since the last sync and produces incremental deltas:

```json
{
  "timestamp": 1707123456789,
  "writes": {
    "{puuid1}": "{updated_object_json}",
    "{puuid3}": "{new_object_json}"
  },
  "deletes": ["{puuid2}"]
}
```

Deltas are stored as separate timestamped files alongside the main pool. On load, the client fetches `pool.json` and applies all deltas in order to reconstruct the current state.

**Upload strategy:**

- If changes affect less than 50% of records — upload a delta file
- If changes exceed 50% — upload the full pool (more efficient than a large delta)
- When delta count exceeds 20 — compact by uploading a full pool and deleting all deltas

### Concurrency Control

Pool sync uses lock-based concurrency to prevent simultaneous edits:

- `asyncAcquireOrRefreshLock()` acquires an exclusive lock before writing
- Locks are refreshed periodically (every 60 seconds) during active sessions
- `asyncReleaseLock()` releases the lock when the session ends
- Lock acquisition and release are handled via cloud function endpoints

## Key Classes

### SvCloudSyncSource

The primary cloud-aware sync class. Configured with a user ID, folder name, and Firebase Storage reference. Handles:

- Item upload and download
- Manifest management
- Thumbnail uploads to content-addressed storage
- Retry logic with exponential backoff
- Orphaned file cleanup

### SubObjectPool

An in-memory `ObjectPool` (not backed by IndexedDB) designed for cloud sync. Provides:

- `asyncSaveToCloud()` — saves with delta or full upload optimization
- `collectDelta()` — produces incremental changes vs. last synced snapshot
- `asyncCompactToCloud()` — consolidates deltas into a single pool file
- `fromCloudJson(json)` — reconstructs the pool from cloud data
- `asJson()` — serializes the complete pool for upload

### SvSyncCollectionSource

Abstract base class for collection syncing. Defines the interface for:

- `asyncSyncFromSource()` — pull from cloud
- `asyncLazySyncFromSource()` — create stubs for lazy loading
- `asyncSyncToSource()` — push to cloud

## Relationship to Local Persistence

| Component | Backing Store | Cloud Sync | Purpose |
|-----------|--------------|------------|---------|
| `PersistentObjectPool` | IndexedDB | No | Local app state (singleton, never synced directly) |
| `SubObjectPool` | In-memory | Yes | Session-level cloud sync with delta support |
| `SvCloudSyncSource` | Firebase Storage | Yes | Collection-level cloud sync with manifests |

The local `PersistentObjectPool` is the ground truth for the running application. Cloud sync operates alongside it — collections push individual items, while sessions create a `SubObjectPool` snapshot for upload.

## Auto-Sync Triggers

Cloud sync is triggered automatically on:

- Tab visibility change (switching back to the app)
- Browser `beforeunload` event
- Network online/offline transitions
- Manual save actions
