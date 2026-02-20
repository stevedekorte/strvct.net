# Technical Overview

Technical implementation details for classes, slots, views, and persistence.

## Introduction

This document is intended to be read after the [Introduction](../Introduction/index.html), which outlines the goals and structure of the Strvct framework. Here we go into the technical details of the implementation and how the various parts work together.

Applications are typically composed of **Model**, **UI**, and **Storage** layers. Much of the code and potential bugs in complex real-world applications is the "glue" that synchronizes these layers. Strvct puts enough meta-information in the model layer — through slots and their annotations — to allow the UI and Storage layers, and the synchronization between them, to be handled automatically. You write the model and the rest is handled for you, though custom views can be added when needed.

## Architecture Overview

The framework is organized around three layers with a notification-based synchronization system connecting them:

- **Model** — A graph of `SvNode` objects. Nodes are the unit of both storage and UI presentation. Model objects hold no references to UI objects — they communicate outward solely by posting notifications, which the other layers observe.
- **UI** — Composed of `NodeView` subclass instances. Each `NodeView` holds a reference to an `SvNode` and observes its change notifications. Multiple views may point to the same node instance.
- **Storage** — A `PersistentObjectPool` that monitors node mutations, bundles changes within an event loop into atomic transactions, and handles automatic garbage collection of the stored object graph. Only model objects are persisted; UI objects are transient and recreated from the model on load.

### SvApp

`SvApp` is the top-level application class that coordinates these layers. It holds two key slots:

- **`model`** (`SvModel`) — The root of the persistent model graph. `SvModel` extends `SvStorableNode` and contains the application's entire data structure. It has no dependencies on the UI layer.
- **`userInterface`** (`SvUserInterface`) — The root of the UI layer. `SvUserInterface` is an abstract base class with multiple implementations: `SvWebUserInterface` for browsers, `SvCliUserInterface` for command-line use, and `SvHeadlessUserInterface` for running without any UI at all.

At startup, `SvApp` opens the persistence store, loads or creates the model, then sets up the user interface. The UI class is selected by name via `userInterfaceClassName`, and applications choose the appropriate implementation based on the runtime environment — typically using `SvPlatform.isBrowserPlatform()` to decide.

Because the model layer is completely independent of the UI, the same application code can run headlessly in Node.js for testing, batch processing, or server-side operations. The headless user interface is an empty implementation — the model runs, persists data, and processes logic without any DOM or browser APIs.

## Class System

### Class Definition

Classes are defined using ES6 class syntax inside an IIFE and self-register via `.initThisClass()`:

```javascript
(class MyClass extends ParentClass {
    initPrototypeSlots () {
        // Declare instance properties
    }

    initPrototype () {
        // Configure class-wide settings
    }

    init () {
        super.init();
        // Basic instance initialization
    }

    finalInit () {
        super.finalInit();
        // Complex initialization, object relationships
    }
}.initThisClass());
```

`initPrototypeSlots()` and `initPrototype()` should never call `super` — the framework calls them automatically on the entire class hierarchy from base to derived. Other initialization methods (`init()`, `finalInit()`) should call their parent methods with `super`.

### Slots

Slots are Strvct's property system. Rather than using raw instance variables, properties are declared as slots in `initPrototypeSlots()`, which auto-generates getter and setter methods and provides metadata for the UI and storage layers.

```javascript
initPrototypeSlots () {
    {
        const slot = this.newSlot("userName", "");
        slot.setSlotType("String");
        slot.setShouldStoreSlot(true);   // persist to storage
        slot.setSyncsToView(true);       // update views on change
        slot.setCanEditInspection(true); // allow editing in inspector
    }
    {
        const slot = this.newSlot("settings", null);
        slot.setFinalInitProto(SettingsNode); // auto-create on init
        slot.setIsSubnodeField(true);         // show as navigable field
    }
}
```

Key slot annotations:

- `setSlotType(typeName)` — Expected type, used for type checking and UI generation
- `setShouldStoreSlot(true)` — Include this property in persistence records
- `setSyncsToView(true)` — Trigger view synchronization when the value changes
- `setFinalInitProto(SomeClass)` — Auto-create an instance of this class during `finalInit()` (won't override values loaded from storage)
- `setIsSubnode(true)` — Add the slot value to the node's subnodes array
- `setIsSubnodeField(true)` — Create a navigable tile for this property in the UI inspector

### Categories

Categories extend existing classes with additional functionality from external files, promoting separation of concerns:

```javascript
(class SvJsonGroup_patches extends SvJsonGroup {
    applyJsonPatches (patches) { /* ... */ }
}.initThisCategory());
```

Base classes must be loaded before their categories. Naming convention: `ClassName_categoryName`.

### Protocols

Protocols define a set of methods that a class must implement, enabling runtime verification of interface compliance. Declared by creating a subclass of `Protocol` with empty method stubs. Naming convention: `NameProtocol`.

## Coding Conventions

Instance properties:

- Always begin with an underscore, e.g. `_propertyName`
- Should almost never be accessed directly — always use accessor methods
- Are never accessed directly by external objects
- Getter: `propertyName()`, setter: `setPropertyName(value)`
- Use `this.newSlot()` and `this.overrideSlot()` in `initPrototypeSlots()` to define instance properties
- Use `this.newClassSlot()` in `initClass()` to define class properties

## Model Layer

### Node Hierarchy

The model is a graph of objects inheriting from `SvNode`. Every node has a `subnodes` array (its children) and a `parentNode` reference.

Key base classes:

- **`SvNode`** — Base node class. Provides subnodes, parent references, notification posting, and slot infrastructure.
- **`SvSummaryNode`** — Node with summary generation for UI display (title, subtitle, note).
- **`SvStorableNode`** — Node with persistence support.

### Subnodes

There are two ways child nodes are used:

**Stored subnodes** (`setIsSubnode(true)`) create a permanent parent-child relationship. The child is added to the parent's subnodes array and persisted with it. This is the pattern for collections — classes extending `SvJsonArrayNode` with `shouldStoreSubnodes(true)`.

**Subnode fields** (`setIsSubnodeField(true)`) create navigable UI tiles for structured properties. The data remains in the parent's slot; the field provides a navigation point in the inspector. This is the pattern for structured objects — classes with `shouldStoreSubnodes(false)`.

### Fields

Fields are nodes that sync to a slot value via their `target` and `valueMethod` slots. They bridge the gap between a node's slot and its UI representation. Examples: `SvStringField`, `SvNumberField`, `SvImageWellField`.

## View Layer

### View Hierarchy

The view system is built from a layered class hierarchy where each layer adds a specific capability:

`ElementDomView` → `CssDomView` → `SubviewsDomView` → `ListenerDomView` → `VisibleDomView` → `GesturableDomView` → `ResponderDomView` → `ControlDomView` → `SelectableDomView` → `EditableDomView` → `DomView` → `FlexDomView` → `StyledDomView` → `NodeView`

Notable layers:

- **`ElementDomView`** — Wraps a DOM element rather than extending it, keeping open the possibility of swapping the DOM as a render layer.
- **`GesturableDomView`** — Gesture recognizer framework (tap, double-tap, pan, long-press, etc.).
- **`ResponderDomView`** — Focus management and keyboard navigation.
- **`ControlDomView`** — Target/action pattern for connecting views to handler objects.
- **`StyledDomView`** — Named style states (selected, unselected, active, disabled) with theme class name support.

### NodeView

`NodeView` extends `StyledDomView` and is the bridge between model nodes and the DOM. It holds a reference to an `SvNode`, observes its change notifications, and synchronizes the view accordingly. Nearly all application-visible views are `NodeView` subclasses.

### Navigation Structure

Strvct's UI is based on nested master-detail views using a Miller Column pattern:

- **`StackView`** — Core navigation unit. Contains a `NavView` (master column) and an `otherView` (detail area). Orientation can be left-right or top-bottom. Chains of StackViews automatically compact and expand based on available space.
- **`BrowserView`** — Top-level `StackView` with a breadcrumb path header.
- **`NavView`** — Navigation column containing a header, a scrollable `TilesView`, and a footer. Column width is resizable.
- **`TilesView`** — Scrollable container for an array of `Tile` views. Manages selection, cursor navigation, drag-and-drop, and keyboard input.

When a user selects a tile, a new `StackView` is created in the detail area, with its `NavView` populated by the subnodes of the selected node. This recursive structure allows arbitrarily deep navigation.

### Tile Views

Tiles are the individual items displayed in navigation columns:

- **`Tile`** — Base tile with selection, state-based styling, slide-to-delete, long-press reorder, and drag support.
- **`TitledTile`** — Standard tile with title, subtitle, note, and optional thumbnail.
- **`HeaderTile`** — Section header tile.
- **`BreadCrumbsTile`** — Breadcrumb path that auto-compacts to fit available width.

### Field Tiles

Field tiles present node properties as key/value pairs in the UI inspector:

- **`SvFieldTile`** — Base field tile with key, value, error, and note containers.
- **`SvStringFieldTile`** — String property display and editing.
- **`SvBooleanFieldTile`** — Boolean property with checkbox/toggle.
- **`SvTextAreaFieldTile`** — Multi-line text editing.
- **`SvImageWellFieldTile`** — Image display and selection.
- **`SvPointerFieldTile`** — Object reference with navigation arrow.
- **`SvActionFieldTile`** — Button that invokes an action method on the node.

## Storage Layer

### Record Format

The storage system is a key/value store backed by IndexedDB. Keys are persistent unique IDs (puuids) and values are JSON records containing a type field and a payload. On load, the type is used to locate the class, which is then asked to deserialize itself from the payload.

Object references within records are stored as puuid strings. This uniform reference format enables the storage system to trace the object graph for automatic garbage collection — only objects reachable from the root node survive collection.

### Persistence Lifecycle

Nodes opt into persistence via `setShouldStore(true)`, and individual slots via `setShouldStoreSlot(true)`. The `PersistentObjectPool` then:

1. **Monitors mutations** — When a stored slot changes, the owning node is marked dirty via `didMutate()`.
2. **Batches transactions** — All dirty objects are collected at the end of the current event loop and committed atomically.
3. **Handles deserialization** — On load, `instanceFromRecordInStore()` creates a blank instance, `init()` runs, `loadFromRecord()` populates stored values, then `finalInit()` re-establishes object relationships. Slots with `setFinalInitProto()` only create default instances if no value was loaded from storage.
4. **Garbage collects** — Walks the stored object graph from the root; unreachable records are removed.

### Blob Storage

Large binary data (images, audio) is stored separately in `SvBlobPool`, a content-addressable store using SHA-256 hashes as keys. Nodes store hash references rather than blob data directly. This separation avoids blocking the synchronous object pool API with large async I/O operations, and provides automatic deduplication.

## Synchronization

Strvct uses a notification-based system to keep layers synchronized without tight coupling. The key components are:

- **`SvNotificationCenter`** — Deferred, deduplicated event dispatch. Nodes post named notifications; observers register to receive them.
- **`SvSyncScheduler`** — Coalesces method calls so that multiple changes in one event loop result in a single sync pass.
- **`SvBroadcaster`** — Lightweight immediate broadcast for high-frequency internal events.

Observations use weak references, so garbage collection of either party automatically cleans up the subscription. Sync loops are detected and halted — slot setters only fire change hooks when the value actually differs.

For full details on posting, observing, scheduling, weak reference cleanup, and sync loop detection, see the [Notifications](../Notifications/index.html) guide.

## Build System

### Overview

Strvct does not use standard ES module imports or bundlers like Webpack or Rollup. Instead, it uses a custom Content-Addressable Memory (CAM) build and loading system designed around two goals: minimal network transfers and fine-grained caching.

The build process runs two indexers:

- **ImportsIndexer** scans `_imports.json` files throughout the source tree to discover all JavaScript and CSS resources and their dependency order. It produces two output files:
  - `_index.json` — a metadata catalog listing every resource path and its SHA-256 content hash
  - `_cam.json.zip` — a compressed bundle containing the actual file contents, keyed by hash

- **ResourceIndexer** scans specified directories (e.g. icons, sounds) and produces a similar index for non-code assets.

### Runtime Loading

At runtime, the client-side `SvResourceManager` loads the small `_index.json` first, compares hashes against its local `SvHashCache`, and only downloads `_cam.json.zip` if the cache is missing entries. Because content is addressed by hash, identical content across different file paths is stored only once, and unchanged files are never re-downloaded — even across deployments.

Resources are loaded in dependency order as declared in `_imports.json` files. CSS is evaluated sequentially to preserve cascade ordering. JavaScript files are evaluated via `eval()` with `sourceURL` comments to enable full debugger support (breakpoints, stepping, source display in DevTools).

### Motivation

Standard ES module imports issue a separate HTTP request per file, which becomes a significant bottleneck for large applications with hundreds of source files. Bundlers address this but sacrifice fine-grained caching — changing one file invalidates the entire bundle. Strvct's CAM system provides the compression benefits of bundling while preserving per-file cache granularity through content hashing.
