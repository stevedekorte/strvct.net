# Technical Overview

High-level architecture, core design philosophy, and system-wide concepts of the Strvct framework.

## Introduction

Strvct is an open-source, local-first **Naked Objects** framework built in client-side JavaScript. Instead of requiring developers to manually author and maintain separate domain models, UI component trees, form layouts, validators, client-side state stores, persistence mappings, localization dictionaries, and AI agent tool specifications, Strvct derives the complete application interface and operational infrastructure automatically from an annotated domain model.

Applications built with Strvct operate as single-page web applications (SPAs) executing natively in the browser. The system is designed from the ground up for **local-first execution**: application state is stored locally in IndexedDB object pools, enabling instant, zero-latency user interaction and full offline functionality. When online, local object pools synchronize transparently with versioned cloud stores.

<svg viewBox="0 0 820 240" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
    .flow-dashed { stroke: #111; stroke-width: 1; fill: none; stroke-dasharray: 4 3; }
  </style>
  <defs>
    <marker id="ato" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="fill" x="40" y="20" width="740" height="65"/>
  <text x="55" y="42" class="b">Annotated Domain Model (SvStorableNode Subclasses)</text>
  <text x="55" y="60" class="dim">Single source of truth declaring slots, subnodes, and metadata annotations</text>

  <line class="flow" x1="120" y1="85" x2="120" y2="125" marker-end="url(#ato)"/>
  <line class="flow" x1="310" y1="85" x2="310" y2="125" marker-end="url(#ato)"/>
  <line class="flow" x1="500" y1="85" x2="500" y2="125" marker-end="url(#ato)"/>
  <line class="flow" x1="690" y1="85" x2="690" y2="125" marker-end="url(#ato)"/>

  <rect class="box" x="40" y="125" width="160" height="90"/>
  <text x="55" y="147" class="b">Auto-Generated UI</text>
  <text x="55" y="165" class="dim">Miller column stacks,</text>
  <text x="55" y="183" class="dim">tabs, &amp; doc sections</text>

  <rect class="box" x="230" y="125" width="160" height="90"/>
  <text x="245" y="147" class="b">Local &amp; Cloud Sync</text>
  <text x="245" y="165" class="dim">IndexedDB pools &amp;</text>
  <text x="245" y="183" class="dim">SHA-256 blob store</text>

  <rect class="box" x="420" y="125" width="160" height="90"/>
  <text x="435" y="147" class="b">Headless Execution</text>
  <text x="435" y="165" class="dim">Runs in Node.js with</text>
  <text x="435" y="183" class="dim">zero DOM dependencies</text>

  <rect class="box" x="610" y="125" width="170" height="90"/>
  <text x="625" y="147" class="b">Native AI Tool Surface</text>
  <text x="625" y="165" class="dim">Constant tool size:</text>
  <text x="625" y="183" class="dim">schema-fetch &amp; patch</text>
</svg>

Unlike traditional component frameworks (React, Vue, Svelte, Flutter) or compile-time code generators:
- **No Pre-Rendered View Trees:** There is no build step that compiles templates into UI components or static layouts.
- **Lazy Runtime View Derivation:** Views are instantiated lazily in response to user navigation through the object graph. Each step inspects target node slot annotations to resolve or create the appropriate `SvNodeView`.
- **Bidirectional Live Synchronization:** Active views observe model nodes through deferred, deduplicated notifications. Updates flow bidirectionally between model and view without manual binding logic.
- **Complete Decoupling:** Model objects hold zero references to UI classes or browser DOM elements. The entire domain graph runs headlessly in Node.js for testing, batch processing, or server-side workflows.

---

## The Model-First Triad

Strvct organizes applications into three distinct layers connected by an asymmetric notification architecture:

<svg viewBox="0 0 820 270" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
    .flow-dashed { stroke: #111; stroke-width: 1; fill: none; stroke-dasharray: 4 3; }
  </style>
  <defs>
    <marker id="ato" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>
  <rect class="box" x="30" y="20" width="200" height="160"/>
  <text x="45" y="42" class="b">UI Layer</text>
  <text x="45" y="62" class="dim">SvNodeView Hierarchy</text>
  <rect class="fill" x="45" y="80" width="170" height="88"/>
  <text x="60" y="100" class="b">Views</text>
  <text x="60" y="118" class="dim">Observe node slots;</text>
  <text x="60" y="136" class="dim">Created lazily on navigation;</text>
  <text x="60" y="154" class="dim">Discarded when off-screen</text>

  <rect class="box" x="310" y="20" width="200" height="160"/>
  <text x="325" y="42" class="b">Model Layer</text>
  <text x="325" y="62" class="dim">SvNode Object Graph</text>
  <rect class="fill" x="325" y="80" width="170" height="88"/>
  <text x="340" y="100" class="b">Domain Objects</text>
  <text x="340" y="118" class="dim">Slots, subnodes,</text>
  <text x="340" y="136" class="dim">annotations;</text>
  <text x="340" y="154" class="dim">Zero UI references</text>

  <rect class="box" x="590" y="20" width="200" height="160"/>
  <text x="605" y="42" class="b">Storage Layer</text>
  <text x="605" y="62" class="dim">SvPersistentObjectPool</text>
  <rect class="fill" x="605" y="80" width="170" height="88"/>
  <text x="620" y="100" class="b">IndexedDB / Cloud</text>
  <text x="620" y="118" class="dim">Monitors mutations;</text>
  <text x="620" y="136" class="dim">Batches per-loop changes</text>
  <text x="620" y="154" class="dim">into atomic transactions</text>

  <line class="flow-dashed" x1="310" y1="110" x2="230" y2="110" marker-end="url(#ato)"/>
  <line class="flow" x1="230" y1="140" x2="310" y2="140" marker-end="url(#ato)"/>
  <text x="270" y="88" text-anchor="middle" class="dim">mutation</text>
  <text x="270" y="103" text-anchor="middle" class="dim">notification</text>
  <text x="270" y="153" text-anchor="middle" class="dim">getter, setter,</text>
  <text x="270" y="168" text-anchor="middle" class="dim">&amp; action calls</text>

  <line class="flow-dashed" x1="510" y1="110" x2="590" y2="110" marker-end="url(#ato)"/>
  <line class="flow" x1="590" y1="140" x2="510" y2="140" marker-end="url(#ato)"/>
  <text x="550" y="88" text-anchor="middle" class="dim">mutation</text>
  <text x="550" y="103" text-anchor="middle" class="dim">notification</text>
  <text x="550" y="153" text-anchor="middle" class="dim">loads &amp;</text>
  <text x="550" y="168" text-anchor="middle" class="dim">stores</text>

  <text x="410" y="215" text-anchor="middle" class="dim">Model is the authoritative source of truth.</text>
  <text x="410" y="235" text-anchor="middle" class="dim">Views and Storage hold weak references to Model nodes; Model holds zero references to Views or Storage in return.</text>
</svg>

### Layer Responsibilities

1. **Model Layer (`SvNode` Graph):**
   - Authoritative source of truth for all domain data and business logic.
   - Composed of objects inheriting from `SvNode` (or `SvStorableNode`).
   - Declares instance properties as **slots** enriched with metadata annotations.
   - Emits change notifications when slots or subnode arrays mutate, but holds no references to views or persistence handlers.

2. **UI Layer (`SvNodeView` Tree):**
   - Renders visual presentation using lazy, auto-generated master-detail Miller column containers (`SvStackView`, `SvNavView`, `SvTilesView`, `SvTile`).
   - Observes model notifications and pulls updated values on model mutation.
   - Sends user edit commands back to the model via standard slot setters.

3. **Storage Layer (`SvPersistentObjectPool`):**
   - Monitors model mutation notifications automatically.
   - Batches dirty objects at the end of each browser event loop into transactional IndexedDB operations.
   - Syncs versioned delta commits with cloud storage for cross-device availability.

---

## The Multi-Reader Annotation Bridge

The cornerstone of Strvct's architecture is the **Slot Annotation System**. Instead of raw instance variables, domain properties are declared as slots with metadata annotations.

Slot annotations act as a **multi-reader decoupling bridge**. Each framework subsystem reads slot metadata independently to perform its job without cross-system dependencies:

```
                          +---> UI Generation (Property Tiles & Control Types)
                          |
                          +---> Local Storage & Cloud Sync (IndexedDB Records)
                          |
[ Slot Metadata Bridge ] -+---> Notification Engine (Coalesced Sync Passes)
                          |
                          +---> Native AI Tool Surface (JSON Patch Validation)
                          |
                          +---> Accessibility & i18n (ARIA Roles & Translation)
```

| Annotation Settor | Purpose & Subsystem Consumer |
|---|---|
| `setSlotType("String")` | Selects tile UI input control type, runtime type validation, and AI JSON schema generation. |
| `setShouldStoreSlot(true)` | Directs `SvPersistentObjectPool` to include property in serialized storage records. |
| `setSyncsToView(true)` | Instructs model setter to post notification triggers to active observing views. |
| `setCanEditInspection(true)` | Exposes property in the modifier-click (Option+Click) live Property Inspector. |
| `setIsSubnodeField(true)` | Exposes complex properties as navigable child nodes in the UI inspector hierarchy. |
| `setFinalInitProto(ClassName)` | Auto-instantiates default child objects during initialization if absent from storage. |

---

## UI Synchronization Engine

Strvct enforces an asymmetric, notification-driven synchronization architecture:

1. **Push Phase (User Action):** When a user edits a property in the UI, the view calls the corresponding setter on the model node (e.g., `character.setName("Thorin")`).
2. **Notification Phase:** The generated slot setter verifies the type, updates internal state, and posts a named change notification via `SvNotificationCenter`.
3. **Pull Phase (Deferred View Sync):** Observing views receive the notification and schedule a sync pass with `SvSyncScheduler`.
4. **Coalescing & Loop Avoidance:** `SvSyncScheduler` deduplicates multiple mutations within the same event loop, executing a single UI re-render pass at the end of the loop. If setter values have converged, sync halts automatically, preventing infinite update loops.
5. **Memory Safety:** Notifications use weak-reference observation patterns, allowing unreferenced views and models to be garbage-collected cleanly without manual listener detachment.

---

## Local & Cloud Persistence

Strvct combines local-first speed with seamless cloud synchronization:

### 1. Local Object Pools (IndexedDB)
- Application data is divided into **Object Pools** (one pool per document/aggregate root).
- Each domain object is stored as a JSON row keyed by `poolId` and `puuid` (persistent UUID).
- Object references within a pool are stored as `{ "*": puuid }`.
- External cross-pool references are stored as `{ "**": poolId }`.
- Mutations queue objects automatically for end-of-event-loop atomic IndexedDB commits.

### 2. SHA-256 Content-Addressable Blob Store
- Large binary assets (images, audio, files) are stored separately in `SvBlobPool`.
- Keys are computed as SHA-256 content hashes, providing automatic binary deduplication.
- Records store hash references rather than raw binary data, keeping IndexedDB records lean and fast.

### 3. Versioned Cloud Commits
- Cloud persistence mirror the same row format as local IndexedDB.
- Saving a document computes delta rows modified since the last acknowledged pool version and posts an atomic commit.
- Conflicts are detected deterministically per pool version rather than silently overwriting data.

---

## Content-Addressable Resource Delivery (CAM)

Real-world Naked Objects applications load hundreds of domain classes, view handlers, and style assets into the browser. Traditional ES module loading (hundreds of individual HTTP requests) creates severe network latency, while standard Webpack/Vite bundlers invalidate full chunks on minor file edits.

Strvct solves this with a **Content-Addressable Memory (CAM)** build and delivery pipeline:

```
[ Build Stage: ImportsIndexer ]
  Scan _imports.json tree ---> Compute SHA-256 for each file
  ---> Produce _index.json (path -> hash) & _cam.json.zip (compressed content)

[ Runtime Stage: SvResourceManager & SvHashCache ]
  Fetch _index.json ---> Compare against IndexedDB SvHashCache
  ---> If delta ratio > 30%: Download _cam.json.zip in 1 request
  ---> If delta ratio <= 30%: Download only missing hash files
```

### Key Benefits of CAM Delivery:
- **Hash-Based Caching:** Assets are addressed and cached in IndexedDB by SHA-256 hash rather than URL path.
- **Zero-Churn Redeployment:** Modifying a single source file invalidates only that file's hash in the cache; returning users download only the edited file.
- **Cross-App Shared Caching:** Multiple Strvct applications running on the same origin share the local hash cache for common framework classes.
- **Full Debugger Support:** JavaScript source files are evaluated dynamically via `eval()` with embedded `sourceURL` annotations, providing complete DevTools debugger capabilities (breakpoints, stack traces, step execution).

---

## Architectural Capabilities ("For Free")

Because Strvct centralizes the pipeline from slot annotations to runtime views, several high-value capabilities fall out of the architecture automatically:

1. **Natively AI-Operable Model:** Every class exposes a constant-size tool surface (`schema-fetch` + `apply-patch`). AI agents inspect schemas and patch live object graphs directly with automatic schema validation.
2. **Headless Execution:** Domain models contain zero DOM dependencies and execute natively under Node.js for ultra-fast unit testing, simulations, or server execution.
3. **Automatic Mobile Responsiveness:** Navigation columns (`SvStackView`) automatically collapse into mobile push/pop stacks with interactive breadcrumb headers on narrow viewports.
4. **Live Property Inspector:** Modifier-clicking (Option+Click) any tile reveals a live inspector displaying all declared slots, storage flags, and validation states.
5. **Type-Safe Cross-Window Drag & Drop:** Tiles support serialization to JSON MIME types for dragging data across browser windows, desktop apps, or Strvct instances.
6. **Universal Accessibility & Localization:** ARIA roles, keyboard navigation, focus management, and AI string translation are applied centrally at the tile primitive level.

---

## Related Documentation

- [Implementation Overview](../Implementation%20Overview/): Detailed engineering specifications for classes, slots, views, and persistence.
- [Naked Objects](../Naked%20Objects/): Architectural paper detailing theoretical foundations and case studies.
- [Comparing to React](../Comparing%20to%20React/): Guide for React developers exploring Strvct's model-first paradigm.
