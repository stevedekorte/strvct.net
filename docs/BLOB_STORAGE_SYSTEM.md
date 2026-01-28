# SvCloudBlobNode and SvBlobPool System

## Motivation

The system addresses a fundamental challenge in web applications: **efficiently managing large binary data (images, audio, video) separately from structured object data**.

**Key problems solved:**

1. **Synchronous vs Async APIs**: The main `ObjectPool` persistence system uses synchronous operations for fast object loading. Binary blobs are large and require async I/O. Separating them prevents blocking.

2. **Deduplication**: Images or media might be referenced by multiple objects. Content-addressable storage (keyed by SHA-256 hash) means identical blobs are stored once.

3. **Lazy Loading**: Objects can be loaded quickly with just a hash reference. The actual blob data is fetched on-demand when needed.

4. **Cloud Sync**: `SvCloudBlobNode` extends local storage to support pushing/pulling blobs to Google Cloud Storage.

### Why Not Store Everything in Firebase Firestore?

Firebase Firestore has constraints that make it unsuitable for storing the complete object graph directly:

1. **Document Size Limit**: Firestore enforces a **1MB maximum document size**. Objects that serialize themselves along with their contained children can easily exceed this limit (e.g., a campaign with locations, NPCs, treasures, and session history).

2. **No Graph Traversal**: If we fully decomposed storage to one document per object, retrieving an object graph would require **many sequential round trips**. Firestore has no support for traversing a directed graph of references in a single request - each document fetch is independent.

3. **Batching Limits**: Storing each object as its own document hits Firestore's batching limits (500 operations per batch). This makes bulk operations slow and would require additional synchronization mechanisms to ensure consistency across related documents.

**The solution**: Store structured object data as larger, more self-contained documents locally (IndexedDB), and sync to cloud storage at a higher granularity. Binary blobs are separated out because they're the primary driver of document size, and content-addressable storage means they can be efficiently synced and deduplicated independently.

---

## Solution Summary

The solution uses a **dual-database architecture** with hash-based references between them:

| Component | Purpose | Storage |
|-----------|---------|---------|
| **ObjectPool** | Stores structured objects (characters, sessions, etc.) | IndexedDB (sync API) |
| **SvBlobPool** | Stores binary blobs (images, audio, video) | Separate IndexedDB (async API) |

**The key insight**: Objects don't store blobs directly. Instead, they store a SHA-256 hash that acts as a pointer to the blob in `SvBlobPool`. This provides:

- **Fast object loading** - Objects load synchronously with just a small hash string
- **Lazy blob fetching** - Actual binary data loads asynchronously when needed
- **Automatic deduplication** - Same content = same hash = stored once
- **Simple GC** - Collect all referenced hashes from objects, delete everything else from blob storage

**Three-layer class hierarchy**:

1. **SvBlobPool** - Low-level blob storage engine (store/retrieve by hash)
2. **SvBlobNode** - Node wrapper that manages a blob reference with lazy loading
3. **SvCloudBlobNode** - Adds cloud push/pull for cross-device sync

Media-specific classes like **SvImageNode** extend `SvCloudBlobNode` to add format-specific behavior (MIME type handling, thumbnails, etc.) while inheriting all the storage and sync capabilities.

---

## SvBlobPool - The Blob Storage Engine

**Location**: `strvct/source/library/node/storage/base/SvBlobPool.js`

**Core concept**: A singleton that provides content-addressable blob storage using IndexedDB.

### Key Implementation Details

1. **Storage Format**:
   - `{sha256-hash}` → ArrayBuffer (the actual blob data)
   - `{sha256-hash}/meta` → JSON metadata (contentType, size, timeCreated, customMetadata)

2. **Deduplication**: When storing a blob, it computes the SHA-256 hash. If that hash already exists, the store is skipped.

3. **Weak Reference Cache**: Uses `EnumerableWeakMap` for `activeBlobs` - blobs in memory are cached by hash, but can be garbage collected when not in use.

4. **Concurrency Control**: Tracks active read/write operations via `activeReadsMap` and `activeWritesMap` to prevent duplicate concurrent operations on the same hash.

5. **Garbage Collection**: The `asyncCollectUnreferencedKeySet()` method removes blobs not in a provided set of referenced hashes.

### API

```javascript
// Store - returns the SHA-256 hash
const hash = await SvBlobPool.shared().asyncStoreBlob(blob, {customMeta: "value"});

// Retrieve
const blob = await SvBlobPool.shared().asyncGetBlob(hash);

// Check existence
const exists = await SvBlobPool.shared().asyncHasBlob(hash);

// Metadata only (without loading blob data)
const meta = await SvBlobPool.shared().asyncGetMetadata(hash);
```

---

## SvBlobNode - The Node Wrapper

**Location**: `strvct/source/library/node/blobs/SvBlobNode.js`

**Core concept**: A storable node that holds a reference to a blob via its hash, with lazy loading.

### Key Slots

- `valueHash` (stored): The SHA-256 hash - persisted with the object
- `blobValue` (transient): The actual Blob object - not persisted, loaded on demand

### Key Behaviors

1. **Lazy Loading**: `asyncBlobValue()` checks if the blob is loaded; if not, fetches it from `SvBlobPool` using the stored hash.

2. **Auto-hashing**: When `blobValue` is set, `didUpdateSlotBlobValue()` automatically computes the hash and writes to local storage.

3. **GC Integration**: `referencedBlobHashesSet()` returns the hash for garbage collection coordination with `ObjectPool`.

---

## SvCloudBlobNode - Cloud Sync Extension

**Location**: `strvct/source/library/node/blobs/SvCloudBlobNode.js`

**Core concept**: Extends `SvBlobNode` with cloud storage push/pull capabilities.

### Additional Slots

- `hasInCloud`: Boolean flag indicating cloud presence
- `downloadUrl`: Public/private URL for cloud retrieval

### Key Methods

1. **Push to Cloud** (`asyncPushToCloud`):
   - Takes local blob, uploads to cloud storage via `SvApp.shared().asyncPublicUrlForBlob()`
   - Sets `downloadUrl` and `hasInCloud` flag

2. **Pull from Cloud** (`asyncPullFromCloudByHash`):
   - Uses stored hash to fetch blob from cloud: `SvApp.shared().asyncBlobForHash(hash)`
   - Caches the retrieved blob locally

3. **Smart Resolution** (`asyncBlobValue`):
   - First checks in-memory blob
   - Then tries local storage
   - Finally falls back to cloud

---

## Data Flow Examples

### Storing an Image

```
User uploads image
        ↓
SvImageNode.asyncSetBlobValue(blob)
        ↓
SvBlobNode computes SHA-256 hash
        ↓
SvBlobPool.asyncStoreBlob() stores ArrayBuffer + metadata
        ↓
SvBlobNode stores only the hash in ObjectPool
```

### Loading an Image

```
Object loads from ObjectPool (has valueHash: "abc123...")
        ↓
asyncBlobValue() called
        ↓
Check in-memory cache → miss
        ↓
SvBlobPool.asyncGetBlob("abc123...") → returns Blob
        ↓
Blob cached in activeBlobs for future access
```

---

## Garbage Collection Coordination

Since blobs and objects are stored in separate databases, garbage collection requires coordination between `ObjectPool` and `SvBlobPool` to prevent orphaned blobs from accumulating.

### How It Works

1. **Objects report their blob references**: Any object that holds blob references implements `referencedBlobHashesSet()`, which returns a `Set` of SHA-256 hashes it depends on.

2. **ObjectPool aggregates all references**: When GC runs, `ObjectPool.allBlobHashesSet()` iterates through all stored objects, calling `referencedBlobHashesSet()` on each, and combines them into a master set of referenced hashes.

3. **BlobPool removes orphans**: `ObjectPool.asyncCollectBlobs()` passes this master set to `SvBlobPool.asyncCollectUnreferencedKeySet()`, which:
   - Gets all keys currently in blob storage
   - Computes the difference (keys in storage but not in the reference set)
   - Deletes those orphaned blobs and their metadata

### Code Flow

```
ObjectPool.asyncCollectBlobs()
        ↓
ObjectPool.allBlobHashesSet()
        ↓
    ┌───────────────────────────────────────┐
    │  for each object in allObjects():     │
    │    if object.referencedBlobHashesSet: │
    │      hashesSet.addAll(object.referencedBlobHashesSet()) │
    └───────────────────────────────────────┘
        ↓
SvBlobPool.asyncCollectUnreferencedKeySet(hashesSet)
        ↓
    ┌───────────────────────────────────────┐
    │  allKeys = await idb.promiseAllKeys() │
    │  orphans = allKeys.difference(hashesSet) │
    │  await idb.promiseRemoveKeySet(orphans) │
    └───────────────────────────────────────┘
```

### Implementation Details

**In ObjectPool** (`ObjectPool.js`):
```javascript
allBlobHashesSet () {
    const hashesSet = new Set();
    this.allObjects().forEach(obj => {
        if (obj.referencedBlobHashesSet) {
            const objBlobHashes = obj.referencedBlobHashesSet();
            hashesSet.addAll(objBlobHashes);
        }
    });
    return hashesSet;
}

async asyncCollectBlobs () {
    const keySet = this.allBlobHashesSet();
    const removedCount = await this.blobPool().asyncCollectUnreferencedKeySet(keySet);
    return removedCount;
}
```

**In SvBlobNode** (`SvBlobNode.js`):
```javascript
referencedBlobHashesSet () {
    const hashesSet = new Set();
    const hash = this.valueHash();
    if (hash) {
        hashesSet.add(hash);
    }
    return hashesSet;
}
```

### Key Points

- **Mark-and-sweep style**: The approach mirrors classic GC - mark what's referenced, sweep the rest
- **Async-safe**: Blob GC is fully async and doesn't block the synchronous ObjectPool operations
- **Metadata cleanup**: When a blob is removed, its `/meta` key is also deleted
- **Deduplication preserved**: If multiple objects reference the same hash, the blob stays until all references are gone

---

## Design Strengths

1. **Separation of concerns**: Objects remain lightweight; blobs handled separately
2. **Efficient caching**: Content-addressable means natural deduplication
3. **Progressive loading**: UI can show objects immediately, load media lazily
4. **Cloud-ready**: Clean extension point for cloud sync without changing base storage
5. **GC-aware**: Hash-based references allow proper garbage collection across dual storage systems

---

## Future Plans

### Incremental Cloud Sync via JSON Patches

Currently, cloud sync uploads the entire document when changes occur. For large documents (approaching the 1MB Firestore limit), this is inefficient for small changes. The planned solution uses **queued JSON patches** to enable incremental sync.

#### Planned Cloud Functions

1. **`pushDocumentPatch`**: Accepts a JSON patch (RFC 6902 format) and queues it for a document

   **Arguments:**
   | Parameter | Type | Description |
   |-----------|------|-------------|
   | `documentPath` | string | Firestore document path (e.g., `users/{uid}/characters/{charId}`) |
   | `patch` | array | JSON Patch operations (RFC 6902 format) |
   | `baseVersionId` | string | Hash or version ID of the document state this patch applies to |
   | `timestamp` | number | Client timestamp for ordering and conflict detection |

   **Behavior:**
   - Client sends only the delta (patch), not the full document
   - Patches are stored in a subcollection or array field on the document
   - `baseVersionId` enables detection of conflicting patches (patches based on stale state)
   - Enables fast sync for small, frequent changes (e.g., updating a single character stat)

2. **`getDocument`** (enhanced): On read, applies any queued patches before returning

   **Arguments:**
   | Parameter | Type | Description |
   |-----------|------|-------------|
   | `documentPath` | string | Firestore document path |
   | `afterVersionId` | string? | Optional: only return if newer than this version (for polling) |

   **Returns:**
   | Field | Type | Description |
   |-------|------|-------------|
   | `document` | object | The consolidated document data |
   | `versionId` | string | Hash/version of the returned document (use as `baseVersionId` for patches) |
   | `patchesApplied` | number | How many queued patches were consolidated |

   **Behavior:**
   - Checks for pending patches
   - Applies patches to the base document in order
   - Saves the consolidated document and clears the patch queue
   - Returns the fully up-to-date document to the client

#### Benefits

- **Reduced bandwidth**: Small changes don't require uploading the entire document
- **Lower latency**: Patch uploads are fast; consolidation happens lazily on read
- **Conflict-friendly**: Patches can potentially be merged or rebased
- **Stays under size limit**: Frequent small syncs prevent document growth between full saves

#### Considerations

- Patch queue size needs a limit (consolidate after N patches or M bytes)
- Read-time consolidation adds latency to first read after many patches
- May need a background function to periodically consolidate dormant documents
- Patch ordering must be preserved for correctness
