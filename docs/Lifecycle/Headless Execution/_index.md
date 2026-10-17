# Headless Execution

Running STRVCT applications natively in Node.js without DOM or browser dependencies.

## Overview

STRVCT's domain model layer, persistence engine, and boot sequence execute natively in Node.js. The same application domain classes that run in the browser run headlessly under Node.js—with identical storage behavior, slot metadata annotations, and object lifecycles—just without DOM or view classes.

This enables ultra-fast unit/integration testing, server-side processing, batch simulations, and CLI tools.

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
    <marker id="ahe" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="box" x="25" y="20" width="240" height="50"/>
  <text x="40" y="40" class="b">Shared Domain Model</text>
  <text x="40" y="58" class="dim">SvStorableNode subclasses</text>

  <line class="flow" x1="265" y1="45" x2="290" y2="45" marker-end="url(#ahe)"/>

  <rect class="fill" x="290" y="20" width="240" height="50"/>
  <text x="305" y="40" class="b">Environment Filtering</text>
  <text x="305" y="58" class="dim">server-only / browser-only</text>

  <line class="flow" x1="530" y1="45" x2="555" y2="45" marker-end="url(#ahe)"/>

  <rect class="fill" x="555" y="20" width="240" height="50"/>
  <text x="570" y="40" class="b">LevelDB Storage Backend</text>
  <text x="570" y="58" class="dim">classic-level via SvIndexedDbFolder</text>

  <text x="410" y="110" text-anchor="middle" class="dim">Model code holds zero DOM references; views observe the model, but the model is completely unaware of views.</text>
</svg>

---

## Environment Detection (`SvPlatform`)

```javascript
// Environment checks
if (SvPlatform.isNodePlatform()) {
    // Node.js specific code
} else if (SvPlatform.isBrowserPlatform()) {
    // Browser specific code
}
```

---

## Directory Filtering Conventions (`browser-only` & `server-only`)

During boot resource discovery, `StrvctFile.canUseInCurrentEnv()` inspects path segments:
- In **Node.js**: Files in `browser-only/` paths are skipped.
- In **Browser**: Files in `server-only/` paths are skipped.

### The Same-Name Class Pattern:
This convention provides environment-specific implementations of the exact same class interface:

```
source/boot/browser-only/SvIndexedDbFolder.js   # Uses native IndexedDB
source/boot/server-only/SvIndexedDbFolder.js     # Uses LevelDB via classic-level
```

---

## Browser API Shims for Node.js (`server-only`)

In `source/library/ideal/categories/server-only/`:

| Shim File | Browser API Polyfilled | Node.js Implementation |
|---|---|---|
| `XMLHttpRequestShim.js` | `XMLHttpRequest` | Wraps `xhr2` package |
| `FileReaderShim.js` | `FileReader` | Reads ArrayBuffer and text from Blobs |
| `ImageShim.js` | `Image`, `HTMLCanvasElement` | Wraps `canvas` package |
| `FontFaceShim.js` | `FontFace` | Stub accepting font declarations |

---

## Storage Engine Parity

Storage works identically in both environments through `SvIndexedDbFolder`:
- **Browser:** Writes to native IndexedDB.
- **Node.js:** Writes to LevelDB (`classic-level`) in `./data/leveldb/`.

---

## Related Guides

- [App Lifecycle](../App%20Lifecycle/index.html): `SvApp` startup and readiness promises.
- [Local Object Pools](../../Persistence/Local%20Object%20Pools/index.html): Persistent object pools.
