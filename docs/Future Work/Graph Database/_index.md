# Graph Database

Long-term direction: replacing the current cloud storage backend with a native graph database.

## Context

STRVCT's domain model is a cyclic graph of objects connected by typed references. Locally, this graph is stored in IndexedDB as a flat key-value map of serialized records, with object references represented as persistent unique IDs (puuids). Cloud sync currently uses Firebase Storage, with two strategies: per-item JSON files for collections, and whole-pool snapshots with write-ahead log deltas for interconnected object graphs (see [Cloud Object Pools](../../Persistence/Cloud%20Object%20Pools/index.html)).

This works, but there's a fundamental mismatch: the domain model is a graph, while the storage and sync layers treat it as either a bag of independent documents (collection sync) or a monolithic blob (pool sync). Neither representation natively understands the structure of the data it's storing.

## Why a Graph Database

A graph database would store nodes and edges as first-class entities, directly mirroring how the domain model already works internally:

**Structural alignment.** Each domain object becomes a node in the database. Each slot that references another object becomes an edge. The database's structure matches the application's structure — no serialization/deserialization impedance mismatch.

**Granular sync.** Changes to a single node or edge can be synced independently without uploading an entire pool snapshot or maintaining a separate delta log. A single property change on one object doesn't require re-uploading the entire object graph.

**Lazy traversal.** The database can serve subgraphs on demand — fetch a node and its immediate neighbors, then expand as the user navigates. This is the graph-native version of what collection sync's manifest stubs approximate with per-item lazy loading.

**Query by structure.** "Find all nodes of type X connected to this node" or "show me every node reachable from this root" become native graph traversals rather than full-table scans or application-level filtering.

**Conflict resolution at the edge level.** When two clients modify different parts of the same graph concurrently, a graph-aware system can merge at the node/edge level rather than the document level, reducing false conflicts.

## Prior Art

[vertex.js](https://github.com/stevedekorte/vertex.js) is an earlier graph database implementation by the framework author. It stores a persistent graph of nodes with named slots (key-value pairs), where values can be primitives or references to other nodes. The data model is close to what STRVCT's domain objects already look like:

- Nodes have unique IDs and named properties
- Properties can hold primitive values or references to other nodes
- The graph supports cycles and bidirectional traversal
- Queries walk the graph by following named edges

The concepts from vertex.js — persistent graph nodes with slot-based properties, structural traversal, and path-based addressing — map directly onto STRVCT's existing object model.

## What This Would Replace

The current cloud sync stack has several layers that a graph database would subsume:

| Current | Graph DB equivalent |
|---|---|
| JSON serialization of object records | Direct node/edge storage |
| puuid-based references between objects | Native graph edges |
| Pool snapshots + delta files | Per-node/per-edge mutations |
| Manifest-based lazy loading | Subgraph traversal |
| Write-ahead log for incremental sync | Change feed on individual nodes/edges |
| Lock-based concurrency for pools | Node-level or edge-level conflict resolution |

The local IndexedDB layer would likely remain as a client-side cache, but the canonical store would be the graph database rather than Firebase Storage.

## Challenges

### Scalability

A hosted graph database must handle concurrent reads and writes from many clients, with low latency for the interactive traversals that drive STRVCT's navigation-based UI. This is a harder operational problem than serving static JSON files from cloud storage.

### Partial sync and offline-first

STRVCT applications work offline with local data, syncing when connectivity returns. A graph database sync protocol needs to handle:

- Efficient diffing: which nodes/edges changed since last sync?
- Subgraph boundaries: which parts of the graph does this client care about?
- Conflict resolution: two clients modified the same node offline — how to merge?

### Migration

Existing applications store data in Firebase Storage. A migration path is needed — likely a period where both backends coexist, with the graph database gradually taking over as the primary store.

### Hosting and operations

Firebase Storage is a managed service with minimal operational overhead. A graph database requires either a managed graph DB service (e.g., Neo4j Aura, Amazon Neptune) or self-hosted infrastructure with its own scaling, backup, and monitoring concerns.

## Object Sub-Pools

One concept from the current architecture that should carry forward is the **object sub-pool** — a self-contained subgraph where outside nodes may point to the root, but all internal objects hold no hard references to objects outside the subgraph. These sub-pools can be nested and are the natural unit of ownership, sync, and access control.

In practice, sub-pools correspond to the coarse-grained "documents" of an application: a user profile, a project, a collaborative session, an app's settings. Each is a self-contained graph that can be:

- **Synced independently** — upload or download a sub-pool without touching the rest of the graph
- **Garbage collected** — objects reachable only within the sub-pool can be collected together
- **Access controlled** — permissions can be scoped to a sub-pool (e.g., a user owns their own data but has read access to a shared project)
- **Migrated or archived** — move a sub-pool to cold storage or a different backend without breaking references

A graph database backend should preserve this sub-pool structure as a first-class concept — not flatten everything into a single global graph. The sub-pool boundary is what makes it practical to sync, permission, and reason about parts of the graph independently, even though the database itself supports arbitrary cross-references.

## Relationship to Current Architecture

This is envisioned as a backend replacement, not a framework rewrite. The domain model, slot system, persistence API, and view layer would remain unchanged. The swap would happen below the `SvCloudSyncSource` abstraction:

- `SvPersistentObjectPool` continues to manage local IndexedDB storage
- `SvCloudSyncSource` (or a new sibling) would speak to a graph database API instead of Firebase Storage
- The serialization format would change from JSON documents to node/edge mutations
- The sync protocol would change from snapshot+delta to a graph-aware change feed
- Object sub-pools remain the unit of sync — the graph database stores the full graph, but sync, permissions, and lifecycle operate at the sub-pool level

The domain model already *is* a graph — the change is making the storage layer acknowledge that.

## Timeline

This is a long-term architectural direction, not near-term work. The current Firebase-based cloud sync is functional and sufficient for the application's current scale. A graph database backend would become compelling when:

- The object graph grows large enough that pool-level sync becomes a bottleneck
- Multi-user collaborative editing requires finer-grained conflict resolution than document-level merging
- Query patterns emerge that are awkward to express without structural graph traversal
