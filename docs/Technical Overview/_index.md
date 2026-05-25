# Technical Overview

High-level architecture and key concepts of the Strvct framework.

## Introduction

Strvct applications run as client-side single-page apps in the browser. The framework makes heavy use of client-side persistent storage — both for caching code and resources via a content-addressable build system, and for maintaining a persistent object database of application state in IndexedDB. Subgraphs of this object database can be transparently and lazily synced to the cloud, allowing offline-first operation with seamless cloud persistence.

Strvct is not a template system, a compile-time UI generator, or a component framework in the React/Flutter sense. There is no build step that produces views, no static component tree, and no pre-rendered layout. Views are created lazily at runtime as the user navigates the object graph — each navigation step inspects the target node's annotations, discovers an appropriate view class, and instantiates it. Once created, a view stays live and in sync with its model node through bidirectional notifications. The UI at any moment is a dynamic projection of the user's current navigation path, not a pre-built artifact.

This page covers the key concepts: the domain model, storage, UI synchronization, and the capabilities these enable. For the design rationale, see [Naked Objects](../Naked%20Objects/). For implementation details, see the [Implementation Overview](../Implementation%20Overview/).

<svg viewBox="0 0 820 390" width="820" xmlns="http://www.w3.org/2000/svg">
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
  <rect class="box" x="30" y="20" width="200" height="280"/>
  <text x="45" y="42" class="b">UI</text>
  <text x="45" y="62" class="dim">SvNodeView hierarchy</text>
  <rect class="fill" x="45" y="80" width="170" height="200"/>
  <text x="130" y="155" text-anchor="middle" class="b">Views</text>
  <text x="130" y="177" text-anchor="middle" class="dim">observe a node's slots;</text>
  <text x="130" y="195" text-anchor="middle" class="dim">created lazily on navigation;</text>
  <text x="130" y="217" text-anchor="middle" class="dim">discarded when not needed</text>
  <rect class="box" x="310" y="20" width="200" height="280"/>
  <text x="325" y="42" class="b">Model</text>
  <text x="325" y="62" class="dim">SvNode graph</text>
  <rect class="fill" x="325" y="80" width="170" height="200"/>
  <text x="410" y="155" text-anchor="middle" class="b">Domain objects</text>
  <text x="410" y="177" text-anchor="middle" class="dim">slots, subnodes,</text>
  <text x="410" y="195" text-anchor="middle" class="dim">annotations;</text>
  <text x="410" y="217" text-anchor="middle" class="dim">no UI references</text>
  <rect class="box" x="590" y="20" width="200" height="280"/>
  <text x="605" y="42" class="b">Storage</text>
  <text x="605" y="62" class="dim">SvPersistentObjectPool</text>
  <rect class="fill" x="605" y="80" width="170" height="200"/>
  <text x="690" y="155" text-anchor="middle" class="b">IndexedDB</text>
  <text x="690" y="177" text-anchor="middle" class="dim">monitors mutations;</text>
  <text x="690" y="195" text-anchor="middle" class="dim">bundles per-loop changes</text>
  <text x="690" y="213" text-anchor="middle" class="dim">into atomic transactions</text>
  <line class="flow-dashed" x1="310" y1="150" x2="230" y2="150" marker-end="url(#ato)"/>
  <line class="flow" x1="230" y1="180" x2="310" y2="180" marker-end="url(#ato)"/>
  <text x="270" y="128" text-anchor="middle" class="dim">mutation</text>
  <text x="270" y="143" text-anchor="middle" class="dim">notification</text>
  <text x="270" y="193" text-anchor="middle" class="dim">getter, setter,</text>
  <text x="270" y="208" text-anchor="middle" class="dim">&amp; action calls</text>
  <line class="flow-dashed" x1="510" y1="150" x2="590" y2="150" marker-end="url(#ato)"/>
  <line class="flow" x1="590" y1="180" x2="510" y2="180" marker-end="url(#ato)"/>
  <text x="550" y="128" text-anchor="middle" class="dim">mutation</text>
  <text x="550" y="143" text-anchor="middle" class="dim">notification</text>
  <text x="550" y="193" text-anchor="middle" class="dim">loads &amp;</text>
  <text x="550" y="208" text-anchor="middle" class="dim">stores</text>
  <text x="410" y="335" text-anchor="middle" class="dim">Model is the source of truth.</text>
  <text x="410" y="355" text-anchor="middle" class="dim">Views and the storage system may hold references to the model, but the model holds none in return; it only posts notifications that they listen for.</text>
</svg>

## Domain Model

The domain model is a cyclic graph of domain objects. Each domain object has:

- **Properties** (instance variables) and **actions** (methods)
- a `subnodes` property containing an ordered unique collection of child domain objects
- a `parentNode` property pointing to its parent domain object
- property **annotations** [1] which allow for the automatic handling of UI and storage mechanisms
- `title` and `subtitle` properties
- a unique ID

The domain model can be seen as an ownership tree of domain objects, which may also contain non-ownership links between nodes.

### Collection Managers

Complex collections of domain objects use Collection Manager domain objects to encapsulate collection-specific logic and data. For example, a Server class might have a guestConnections property referencing a GuestConnections instance whose subnodes are GuestConnection instances.

### Indirect UI Coupling

The domain model operates independently of UI, allowing for "headless" execution. It can, however, use annotations to provide optional UI hints without direct coupling. This is possible because model objects hold no references to UI objects and can only communicate with them via notifications.

## Storage

### Annotations

Domain objects have a property which determines whether the object is persisted, as well as property annotations which determine which properties are persisted. Using this information, the system automatically manages persistence.

### Transactions

Mutations on persistent properties auto-queue domain objects for storage. Queued objects are bundled into a transaction committed at the end of the current event loop.

### Garbage Collection

Automatic garbage collection of the stored object graph occurs on startup, or when requested. Only objects reachable from the root domain object remain after garbage collection.

### Native Collections

Native JavaScript collections (Array, ArrayBuffer, Map, Object, Set, and TypedArray) referenced by persistent properties of domain objects are also automatically persisted in their own records.

### Local Storage

Persistent domain objects are stored client side in IndexedDB in a single Object Store of records whose keys are the domain object unique ID and values are the domain objects' JSON records.

## Resource Delivery

A naked objects application leans on having the full domain model present in the client. Real apps built this way run to hundreds of classes, plus view code, icons, and style resources. Standard JavaScript delivery mechanisms don't scale gracefully to that operating point:

- Loading ES modules individually issues one request per file; cold starts degrade linearly with class count.
- Bundlers collapse many files into one, but any change to any file invalidates the entire chunk. Code splitting helps but requires manual chunking and still invalidates per chunk.
- HTTP caches key on URL. Because deployments change URLs — via versioned filenames or query strings — clients re-download bytes they already have.
- None of the above deduplicates identical code that appears at different paths.

STRVCT replaces this with a content-addressable build. Every resource is keyed by the SHA-256 hash of its content. The build produces a small manifest and a bundle indexed by hash. At runtime:

- The manifest is fetched first and checked against a persistent client-side hash cache.
- Any content already in the cache — from a previous load, a previous deployment, or a different STRVCT app on the same origin — is not re-fetched.
- When enough content is missing to justify it, the app downloads the whole bundle in one request; when only a little is missing, it fetches those items directly. The threshold adapts to the actual delta.
- The bundle itself is shipped zip-compressed, so cold loads pay for compressed bytes while the cache stores decompressed content keyed by hash.
- Identical content at different paths is stored and transferred once.

The practical behavior this produces is qualitatively different from what npm plus a bundler can deliver. A redeploy that changes a single file costs roughly that file's bytes, not a chunk's. A returning user after a year of development cycles fetches only content that is actually new. A first-time visitor who has used any other STRVCT app gets the shared framework for free. None of these properties are reachable by configuration on top of the mainstream stack; they require content-level identity, which URL-based caching doesn't have. This is what lets STRVCT keep its "usability gap" closed at the data-model scales it targets, where conventional tooling begins to impose latency and cache-invalidation costs that the framework's design intentionally eliminates.

## UI Synchronization

Model-view synchronization is managed by views, which either pull or push changes to the domain objects they are presenting. Views push changes when a view property changes, and pull changes from domain objects when those objects post change notifications. Only annotated properties trigger sync operations. Both directions are coalesced and sent at the end of the event loop.

### Sync Loop Avoidance

Bidirectional sync stops automatically as property changes trigger sync operations only when values actually differ, preventing infinite loops. If secondary changes do occur, the notification system detects the loop, halts it, and identifies the source.

### Reference Loop Avoidance

Observations use weak references, allowing garbage collection of both posters and listeners. The Notification system automatically removes observations when the listener is collected.

## Capabilities

The naked objects pattern enables several capabilities that would require significant per-component effort in a bespoke-view framework.

### Themes

Themes can be used to customize the appearance of the UI. Domain objects can also request object-specific styles to be applied to them.

### Importing and Exporting

Drag and drop of domain objects into the UI and out of it for export is supported. Domain objects can register which MIME types they can be exported to and imported from. For example, a domain object can be dragged out of one browser window onto a user's desktop, or dropped into another Strvct app that accepts that MIME type. Domain objects have a standard property which lists valid subnode types, and this can be used to validate drops and auto-generate subnodes for imported data.

### Internationalization

Because the framework controls the model-to-view pipeline, it can intercept slot values at the view boundary and translate them transparently — no per-string wrapping required. This centralization also makes AI-powered translation viable. The framework can automatically discover every translatable string in the application by walking the model, and include semantic context with each string to improve translation quality. See the [Internationalization](../Internationalization/) guide for details.

### JSON Schema

Domain objects can automatically generate JSON Schema for themselves based on their properties and annotations. These schemas can be used to export metadata about the domain model, which is particularly useful when interacting with Large Language Models.

[1]: https://bluishcoder.co.nz/self/transporter.pdf "David Ungar. (OOPSLA 1995). Annotating Objects for Transport to Other Worlds. In Proceedings of the Tenth Annual Conference on Object-Oriented Programming Systems, Languages, and Applications (OOPSLA '95). Austin, TX, USA. ACM Press."
