# Local and Cloud Blob Storage

SHA-256 content-addressable binary asset storage for images, audio, video, and files.

## Overview

While domain object properties are serialized into standard JSON record rows, large binary assets (images, audio files, PDFs) are managed by `SvBlobPool`.

Binary assets are stored using **Content-Addressable Storage (CAS)**:
- The key for any binary blob is its **SHA-256 hash digest** string.
- Object slots store hash reference strings (e.g., `"hash:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"`) rather than inline base64 data.
- Duplicate uploads of identical binary files automatically resolve to the same SHA-256 key, providing zero-effort binary deduplication.

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
    <marker id="abs" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="box" x="25" y="20" width="240" height="50"/>
  <text x="40" y="40" class="b">Binary Asset / Upload</text>
  <text x="40" y="58" class="dim">Image, audio, or PDF file</text>

  <line class="flow" x1="265" y1="45" x2="290" y2="45" marker-end="url(#abs)"/>

  <rect class="fill" x="290" y="20" width="240" height="50"/>
  <text x="305" y="40" class="b">SHA-256 Hash Digest</text>
  <text x="305" y="58" class="dim">Computes content key</text>

  <line class="flow" x1="530" y1="45" x2="555" y2="45" marker-end="url(#abs)"/>

  <rect class="fill" x="555" y="20" width="240" height="50"/>
  <text x="570" y="40" class="b">SvBlobPool / Cache</text>
  <text x="570" y="58" class="dim">IndexedDB &amp; Cloud Store</text>

  <text x="410" y="110" text-anchor="middle" class="dim">Domain node slots store only SHA-256 hash strings; binary content is fetched asynchronously on demand.</text>
</svg>

---

## Local & Cloud Sync Flow

1. **Local Writes:** When a binary file is added, `SvBlobPool` computes its SHA-256 hash asynchronously and stores the ArrayBuffer in a dedicated IndexedDB blob store.
2. **Lazy Cloud Fetching:** When rendering an image or playing an audio file, `SvBlobPool` checks local IndexedDB first. If missing, it fetches the raw binary from the cloud blob store using its SHA-256 key and caches it locally.
3. **Automatic Deduplication:** Two different domain nodes referencing the exact same image share a single binary record in storage.

---

## Related Guides

- [Local Object Pools](../Local%20Object%20Pools/): Domain object graph persistence.
- [Cloud Object Pools](../Cloud%20Object%20Pools/): Cloud record synchronization.
