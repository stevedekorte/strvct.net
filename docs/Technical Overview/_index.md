# Technical Overview

High-level architecture and key concepts of the Strvct framework.

## Introduction

Strvct applications run as client-side single-page apps in the browser. The framework makes heavy use of client-side persistent storage — both for caching code and resources via a content-addressable build system, and for maintaining a persistent object database of application state in IndexedDB. Subgraphs of this object database can be transparently and lazily synced to the cloud, allowing offline-first operation with seamless cloud persistence.

This page covers the key concepts: the domain model, storage, UI synchronization, and the capabilities these enable. For the design rationale, see [Naked Objects](../Naked%20Objects/index.html). For implementation details, see the [Implementation Overview](../Implementation%20Overview/index.html).

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

Because the framework controls the model-to-view pipeline, it can intercept slot values at the view boundary and translate them transparently — no per-string wrapping required. This centralization also makes AI-powered translation viable. The framework can automatically discover every translatable string in the application by walking the model, and include semantic context with each string to improve translation quality. See the [Internationalization](../Internationalization/index.html) guide for details.

### JSON Schema

Domain objects can automatically generate JSON Schema for themselves based on their properties and annotations. These schemas can be used to export metadata about the domain model, which is particularly useful when interacting with Large Language Models.

[1]: https://bluishcoder.co.nz/self/transporter.pdf "David Ungar. (OOPSLA 1995). Annotating Objects for Transport to Other Worlds. In Proceedings of the Tenth Annual Conference on Object-Oriented Programming Systems, Languages, and Applications (OOPSLA '95). Austin, TX, USA. ACM Press."
