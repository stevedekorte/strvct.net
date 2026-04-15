# Headless Execution

Running STRVCT applications in Node.js without a browser.

## Overview

STRVCT's model layer, persistence system, and boot sequence all work in Node.js. The same application code that runs in the browser can run headlessly — with the same storage behavior, the same object lifecycle, and the same slot system — just without a DOM or view layer. This is useful for testing, server-side processing, and CLI tools.

The key enabling design is that the model never references views. Views observe the model through notifications, but the model has no knowledge of views. Remove the view layer and everything else continues to work.

## Environment Detection

`SvPlatform.isNodePlatform()` is the primary environment check. It detects Node.js by testing for the presence of `process.versions.node`. The inverse, `SvPlatform.isBrowserPlatform()`, returns true when not in Node.js.

Framework code that needs to behave differently per environment uses this check at runtime:

```javascript
if (SvPlatform.isNodePlatform()) {
    // Node.js-specific behavior
} else {
    // Browser-specific behavior
}
```

However, most environment branching doesn't happen at the call site — it happens through the resource loading system, which selects the right implementation automatically.

## Environment-Specific Resources

STRVCT uses a path-based convention to include or exclude resources based on the runtime environment. Any directory named `browser-only` or `server-only` in a resource path triggers automatic filtering during the boot sequence.

### How It Works

During resource loading, `ResourceManager` calls `StrvctFile.canUseInCurrentEnv()` on each resource. This method splits the file path into components and checks for the convention directories:

- In **Node.js**: files with `browser-only` in their path are skipped.
- In the **browser**: files with `server-only` in their path are skipped.

All other files load in both environments.

### The Same-Name Class Pattern

The most important use of this convention is providing environment-specific implementations of the same class. For example, `SvIndexedDbFolder` exists in two locations:

```
source/boot/browser-only/SvIndexedDbFolder.js   # Uses native IndexedDB
source/boot/server-only/SvIndexedDbFolder.js     # Uses LevelDB via classic-level
```

Both define a class named `SvIndexedDbFolder` with the same API. In the browser, the browser-only version loads and the server-only version is skipped. In Node.js, the reverse happens. Code that depends on `SvIndexedDbFolder` doesn't need to know which implementation it's using — the interface is identical.

This pattern is also used in `external-libs/`. For example, `simple-peer` (a WebRTC library) lives in `external-libs/browser-only/simple-peer/` and is automatically excluded in Node.js where WebRTC isn't available.

### Directory Structure Examples

```
strvct/source/boot/
    browser-only/
        SvIndexedDbFolder.js     # IndexedDB implementation
    server-only/
        SvIndexedDbFolder.js     # LevelDB implementation

strvct/external-libs/
    browser-only/
        simple-peer/             # WebRTC — browser only
    pako/                        # Compression — both environments
    js-sha256/                   # Hashing — both environments
```

## Storage Abstraction

The persistence system works identically in both environments because the storage backend is abstracted behind `SvIndexedDbFolder`.

### The Layer Stack

```
Application code
    ↓
ObjectPool / PersistentObjectPool     — object cache, dirty tracking, GC
    ↓
PersistentAtomicMap                   — synchronous in-memory cache, batched writes
    ↓
SvIndexedDbFolder                     — environment-specific storage backend
    ↓
IndexedDB (browser) or LevelDB (Node.js)
```

### Why Everything Loads Into Memory

IndexedDB is entirely asynchronous — every read requires a callback or promise. But the object graph needs synchronous access: when a slot getter runs during deserialization or normal code, it can't `await` a database read. `PersistentAtomicMap` resolves this by loading the entire object store into a JavaScript `Map` on open. After that, all reads are synchronous map lookups and all writes go to an in-memory change set. On commit, changes are flushed to the underlying store in a single atomic transaction.

This design means the layers above `SvIndexedDbFolder` never make async storage calls during normal operation — the async boundary is only at open and commit time. The tradeoff is that the full object dataset must fit in memory, which is fine for typical object graphs (tens of megabytes) but wouldn't work for large binary data.

### Blob Storage Is Separate and Async

Binary data — images, audio, and other media — is stored separately in `SvBlobPool`, a content-addressable blob store that uses its own `SvIndexedDbFolder` instance (database name `defaultBlobStore`, separate from the object pool's `defaultDataStore`). Unlike the object pool, blob storage is fully asynchronous: blobs are read and written individually on demand, not loaded into memory all at once. This keeps memory usage proportional to what the application is actively using rather than the total size of all stored media.

`SvBlobPool` also works in headless mode — it uses the same `SvIndexedDbFolder` abstraction, so it gets the LevelDB backend automatically in Node.js. See [Local and Cloud Blob Storage](../../Persistence/Local%20and%20Cloud%20Blob%20Storage/index.html) for details on the blob system.

### Browser Backend

The browser implementation uses the native IndexedDB API. It opens a database, creates an object store, and provides `promiseAt()`, `promiseAtPut()`, and transaction methods that map directly to IndexedDB operations.

### Node.js Backend

The Node.js implementation uses [LevelDB](https://github.com/google/leveldb) via the `classic-level` npm package. It stores data in a filesystem directory (defaulting to `./data/leveldb/`). The same async API — `promiseAt()`, `promiseAtPut()`, transactions — is implemented on top of LevelDB's batch operations.

String values are stored with a byte marker prefix to distinguish them from binary data, since LevelDB's native format is binary buffers.

### What This Means in Practice

Application code — model classes, slot definitions, `setShouldStore(true)`, dirty tracking — is completely unaware of which backend is in use. The same `Contact` class with the same slot annotations stores to IndexedDB in Chrome and to LevelDB in Node.js, with identical serialization format and identical commit behavior. See [Local Object Pools](../../Persistence/Local%20Object%20Pools/index.html) for details on the persistence system itself.

## External Libraries

STRVCT vendors its external dependencies as source files in `external-libs/` rather than using npm. These libraries are declared in `_imports.json` files and go through the same CAM (Content-Addressable Memory) build process as framework code. At runtime, they're loaded and evaluated by the same `ResourceManager` that handles everything else.

This means external libraries automatically work in both environments — the resource loader evaluates them from the CAM bundle in the browser, or from the filesystem in Node.js. Libraries that are browser-specific (like `simple-peer` for WebRTC) use the `browser-only/` directory convention to be excluded in Node.js.

Current vendored libraries include: pako (compression), htmlparser2, jwt-decode, js-sha256, simple-peer (browser-only), and several JSON utilities (ajv, fast-json-patch, jsonrepair, jsondiffpatch).

## API Shims and Environment-Specific Implementations

Each environment lacks some APIs that the other provides natively. Rather than simulating a complete browser or Node.js environment, STRVCT provides minimal shims for specific APIs and uses environment-specific implementations where needed. Major DOM objects like `document` and `window` are **not** polyfilled — code that depends on the DOM should be in `browser-only/` directories or guarded by `SvPlatform.isBrowserPlatform()` checks.

### Browser API Shims for Node.js

These live in `source/library/ideal/categories/server-only/` and provide browser APIs that don't exist natively in Node.js:

| Shim | Browser API replaced | Node.js implementation |
|------|---------------------|----------------------|
| `XMLHttpRequestShim.js` | XMLHttpRequest | Wraps the `xhr2` package |
| `FileReaderShim.js` | FileReader | Reads Blobs and Buffers as text, data URLs, or ArrayBuffers |
| `RangeShim.js` | Range | Minimal stub (no actual DOM manipulation) |
| `ImageShim.js` | Image, HTMLCanvasElement | Uses the `canvas` package |
| `FontFaceShim.js` | FontFace | Stub that accepts font declarations without loading |

The boot sequence also sets up a minimal `performance` object (with `performance.now()` backed by `Date.now()`) if one isn't already available.

### Environment-Specific Implementations

Some functionality has different best-available implementations per environment. These use the same-name class pattern — matching files in `browser-only/` and `server-only/` with the same class name and API:

| File | Browser implementation | Node.js implementation |
|------|----------------------|----------------------|
| `Number_random.js` | `Math.random()` | Node.js `crypto` module |
| `SvIndexedDbFolder.js` | Native IndexedDB | LevelDB via `classic-level` |

### APIs Available Natively in Both

Several APIs that STRVCT uses are available in modern Node.js and don't need shims: `Blob` (v18+), `URL` (v10+), `TextEncoder`/`TextDecoder` (v11+), `crypto` (native module), and `ArrayBuffer` (native JavaScript).

## Practical Applications

Headless execution enables several workflows:

- **Automated testing** — run model-layer tests in Node.js without browser overhead
- **Server-side processing** — load and manipulate the same object graphs that the browser uses
- **CLI tools** — the STRVCT boot system itself (`ImportsIndexer`, `ResourceIndexer`) runs headlessly
- **Build pipelines** — static site generation and other build-time processing can use the full framework
