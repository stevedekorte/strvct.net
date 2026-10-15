# Cloud Object Pools

Versioned cloud persistence, delta synchronizations, and deterministic conflict resolution for Strvct object pools.

## Overview

While local object pools store data in IndexedDB for instant, zero-latency local-first execution, **Cloud Object Pools** (`SvCloudRecordStore`) synchronize object pool records across devices and cloud stores.

```
+-------------------------------------------------------------------------+
|                       Cloud Sync Architecture                           |
+-------------------------------------------------------------------------+
|  Local IndexedDB Pool  -->  Compute Delta Rows  -->  Versioned Commit   |
|  Cloud Record Store    -->  Conflict Check      -->  Atomic Push/Pull   |
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
    <marker id="acp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="box" x="25" y="20" width="240" height="50"/>
  <text x="40" y="40" class="b">Local IndexedDB Pool</text>
  <text x="40" y="58" class="dim">Dirty nodes &amp; local version</text>

  <line class="flow" x1="265" y1="45" x2="290" y2="45" marker-end="url(#acp)"/>

  <rect class="fill" x="290" y="20" width="240" height="50"/>
  <text x="305" y="40" class="b">SvCloudRecordStore</text>
  <text x="305" y="58" class="dim">Computes modified row deltas</text>

  <line class="flow" x1="530" y1="45" x2="555" y2="45" marker-end="url(#acp)"/>

  <rect class="box" x="555" y="20" width="240" height="50"/>
  <text x="570" y="40" class="b">Cloud Storage / Backend</text>
  <text x="570" y="58" class="dim">Versioned atomic pool commits</text>

  <text x="410" y="110" text-anchor="middle" class="dim">Shared row format across local IndexedDB and cloud backends enables zero-transform delta synchronization.</text>
</svg>

---

## Unified Record Format & Backend Protocol

Strvct uses the exact same record row format locally and in the cloud. A cloud record store implements four fundamental operations:

1. **`open(poolId)`**: Opens or initializes a cloud object pool.
2. **`changes(poolId, sinceVersion)`**: Retrieves modified record rows updated since a specific pool version number.
3. **`children(poolId, parentPuuid)`**: Fetches child node records for lazy loading large subtrees.
4. **`commit(poolId, expectedVersion, deltaRows)`**: Posts an atomic batch of modified rows.

---

## Versioning & Conflict Resolution

- **Monotonic Pool Versions:** Every cloud object pool maintains an incrementing integer version number (`poolVersion`).
- **Delta Transmissions:** Commits send only records modified since the last acknowledged cloud version, minimizing network payload sizes.
- **Optimistic Concurrency Control:** When posting a commit, `expectedVersion` must match the server's current pool version. If another client committed changes in the interim, the commit is rejected, prompting the client to pull remote changes and merge before re-committing.

---

## Related Guides

- [Local Object Pools](../Local%20Object%20Pools/): Local IndexedDB persistence engine.
- [Local and Cloud Blob Storage](../Local%20and%20Cloud%20Blob%20Storage/): SHA-256 binary asset storage.
