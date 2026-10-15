# Implementation Overview

Deep technical specifications for class lifecycle, slots, views, persistence, notifications, and build infrastructure.

## Introduction

This document provides a detailed engineering specification of the Strvct framework implementation. It builds directly on the high-level concepts described in the [Technical Overview](../Technical%20Overview/) and the architectural foundations in [Naked Objects](../Naked%20Objects/).

Strvct applications are composed of three primary layers: **Model**, **UI**, and **Storage**. The framework eliminates manual "glue" code by embedding structural metadata directly into model objects via **Slots** and **Slot Annotations**.

<svg viewBox="0 0 820 430" width="820" xmlns="http://www.w3.org/2000/svg">
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
    <marker id="aio" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="fill" x="220" y="20" width="380" height="70"/>
  <text x="235" y="40" class="b">SvApp</text>
  <text x="235" y="58" class="dim">Top-level coordinator; holds model + userInterface</text>
  <text x="235" y="76" class="dim">SvWebUserInterface · SvCliUserInterface · SvHeadlessUserInterface</text>

  <line class="flow" x1="410" y1="90" x2="410" y2="155"/>
  <line class="flow" x1="130" y1="125" x2="690" y2="125"/>
  <line class="flow" x1="130" y1="125" x2="130" y2="155" marker-end="url(#aio)"/>
  <line class="flow" x1="410" y1="125" x2="410" y2="155" marker-end="url(#aio)"/>
  <line class="flow" x1="690" y1="125" x2="690" y2="155" marker-end="url(#aio)"/>

  <rect class="box" x="30" y="155" width="200" height="180"/>
  <text x="45" y="177" class="b">UI Layer</text>
  <text x="45" y="197" class="dim">SvUserInterface Root</text>
  <rect class="fill" x="45" y="220" width="170" height="106"/>
  <text x="60" y="240" class="b">SvNodeView Tree</text>
  <text x="60" y="258" class="dim">Lazy Miller views;</text>
  <text x="60" y="276" class="dim">Observes node slots;</text>
  <text x="60" y="294" class="dim">Responds to user events;</text>
  <text x="60" y="312" class="dim">No DOM leaks to model</text>

  <rect class="box" x="310" y="155" width="200" height="180"/>
  <text x="325" y="177" class="b">Model Layer</text>
  <text x="325" y="197" class="dim">SvModel : SvStorableNode</text>
  <rect class="fill" x="325" y="220" width="170" height="106"/>
  <text x="340" y="240" class="b">Domain SvNode Graph</text>
  <text x="340" y="258" class="dim">Root of persistent state;</text>
  <text x="340" y="276" class="dim">Slots define properties;</text>
  <text x="340" y="294" class="dim">Subnodes define children;</text>
  <text x="340" y="312" class="dim">Runs headlessly in Node.js</text>

  <rect class="box" x="590" y="155" width="200" height="180"/>
  <text x="605" y="177" class="b">Storage Layer</text>
  <text x="605" y="197" class="dim">SvPersistentObjectPool</text>
  <rect class="fill" x="605" y="220" width="170" height="106"/>
  <text x="620" y="240" class="b">IndexedDB &amp; Cloud</text>
  <text x="620" y="258" class="dim">Monitors mutations;</text>
  <text x="620" y="276" class="dim">Batches dirty nodes;</text>
  <text x="620" y="294" class="dim">SHA-256 blob store;</text>
  <text x="620" y="312" class="dim">Garbage collects pools</text>

  <line class="flow-dashed" x1="310" y1="265" x2="230" y2="265" marker-end="url(#aio)"/>
  <line class="flow" x1="230" y1="300" x2="310" y2="300" marker-end="url(#aio)"/>
  <text x="270" y="243" text-anchor="middle" class="dim">mutation</text>
  <text x="270" y="258" text-anchor="middle" class="dim">notification</text>
  <text x="270" y="313" text-anchor="middle" class="dim">getter, setter,</text>
  <text x="270" y="328" text-anchor="middle" class="dim">&amp; action calls</text>

  <line class="flow-dashed" x1="510" y1="265" x2="590" y2="265" marker-end="url(#aio)"/>
  <line class="flow" x1="590" y1="300" x2="510" y2="300" marker-end="url(#aio)"/>
  <text x="550" y="243" text-anchor="middle" class="dim">mutation</text>
  <text x="550" y="258" text-anchor="middle" class="dim">notification</text>
  <text x="550" y="313" text-anchor="middle" class="dim">loads &amp;</text>
  <text x="550" y="328" text-anchor="middle" class="dim">stores</text>

  <text x="410" y="365" text-anchor="middle" class="dim">Model is the authoritative source of truth.</text>
  <text x="410" y="385" text-anchor="middle" class="dim">Views and Storage hold weak references to Model nodes; Model holds zero references to Views or Storage in return.</text>
  <text x="410" y="405" text-anchor="middle" class="dim">Slot annotations carry enough information for UI generation, persistence, and synchronization to be handled automatically.</text>
</svg>

---

## The Object & Class System

Strvct implements a structured class initialization pattern built on top of standard ES6 class syntax.

### Class Lifecycle & Registration

Classes are defined inside an IIFE (Immediately Invoked Function Expression) and self-register using `.initThisClass()`:

```javascript
(class Character extends SvStorableNode {

    initPrototypeSlots () {
        // Declare instance slots (properties + metadata)
    }

    initPrototype () {
        // Configure class-wide prototype settings
    }

    init () {
        super.init();
        // Basic instance initialization
    }

    finalInit () {
        super.finalInit();
        // Relationship resolution & post-deserialization setup
    }

}.initThisClass());
```

#### Initialization Execution Sequence:
1. **`initPrototypeSlots()`**: Invoked automatically during class registration. Defines slots and annotations on the class prototype. *Must never call `super`.*
2. **`initPrototype()`**: Sets up prototype-wide default properties (e.g., `this.setShouldStore(true)`). *Must never call `super`.*
3. **`init()`**: Called when an object is instantiated (`new Class()`). Performs basic property initialization. Always calls `super.init()`.
4. **`finalInit()`**: Called after an object is fully instantiated or deserialized from IndexedDB. Sets up complex object references and child subnodes. Always calls `super.finalInit()`.

### Slots & Slot Annotations

Slots are Strvct's property system. Instead of raw instance fields, properties are declared in `initPrototypeSlots()`:

```javascript
initPrototypeSlots () {
    {
        const slot = this.newSlot("name", "Default Name");
        slot.setSlotType("String");
        slot.setShouldStoreSlot(true);   // Persists to IndexedDB
        slot.setSyncsToView(true);       // Emits view update notifications
        slot.setCanEditInspection(true); // Editable in Property Inspector
    }
    {
        const slot = this.newSlot("inventory", null);
        slot.setFinalInitProto(InventoryNode); // Auto-creates default instance
        slot.setIsSubnodeField(true);         // Navigable tile in inspector
    }
}
```

#### Key Slot Annotations:
- `setSlotType(typeName)`: Declares expected type (`String`, `Number`, `Boolean`, `Array`, `Object`, `ClassName`). Enforces runtime type checks on setters.
- `setShouldStoreSlot(boolean)`: Controls whether the slot value is included in serialized JSON records.
- `setSyncsToView(boolean)`: Triggers change notifications to observing views upon mutation.
- `setCanEditInspection(boolean)`: Exposes property in the modifier-click (Option+Click) live Property Inspector.
- `setIsSubnode(boolean)`: Adds slot value directly to the parent's `subnodes` array.
- `setIsSubnodeField(boolean)`: Generates a navigable field tile in the inspector hierarchy.
- `setFinalInitProto(Class)`: Auto-instantiates default child objects during `finalInit()` if no record was loaded from storage.

### Categories & Protocols

- **Categories (`initThisCategory()`):** Extend existing classes across multiple files without modifying the base definition file (e.g., `SvJsonGroup_patches.js` adding `applyJsonPatches()` to `SvJsonGroup`).
- **Protocols (`NameProtocol`):** Define required interface method stubs inheriting from `Protocol` to enable runtime interface compliance checks.

---

## Model Layer Engineering

### Node Hierarchy
The domain model is an object graph inheriting from `SvNode`. Every node contains:
- `subnodes`: An ordered, unique collection of child `SvNode` objects.
- `parentNode`: Reference to the parent `SvNode`.
- `title` / `subtitle`: String properties displayed in summary tiles.
- `puuid`: Persistent unique identifier string.

### Subnode Patterns
1. **Stored Subnodes (`setIsSubnode(true)`):** Permanent parent-child ownership relationships where child nodes are stored directly inside the parent's `subnodes` array and persisted together.
2. **Subnode Fields (`setIsSubnodeField(true)`):** Properties where value state remains in a slot on the parent node, but a navigable field tile (`SvField`) is generated in the UI for inspecting child subnodes.

---

## View Layer Architecture

### Layered Class Hierarchy
The view system uses a deep, single-inheritance hierarchy where each layer adds a isolated capability:

```
SvElementDomView        (Wraps DOM element, enables alternative render backends)
 └─ SvCssDomView         (Manages inline CSS styles and class list)
     └─ SvSubviewsDomView  (Manages child view hierarchy)
         └─ SvListenerDomView (Event listener attachment)
             └─ SvVisibleDomView  (Viewport visibility tracking)
                 └─ SvGesturableDomView (Gesture recognizers: tap, pan, swipe, long-press)
                     └─ SvResponderDomView  (Focus management & keyboard navigation)
                         └─ SvControlDomView    (Target/Action pattern for control triggers)
                             └─ SvStyledDomView     (State-based style states: selected, active, disabled)
                                 └─ SvNodeView          (Binds model SvNode to DOM presentation)
```

### Navigation Primitives (Miller Columns)

The UI is rendered using nested Miller Column container views:

1. **`SvStackView`**: Core navigation container. Contains a `SvNavView` (master column) and `otherView` (detail area). Automatically collapses on mobile viewports into a push/pop stack with breadcrumbs.
2. **`SvBrowserView`**: Top-level application shell extending `SvStackView` with header breadcrumb navigation.
3. **`SvNavView`**: Single navigation column containing header, scrollable `SvTilesView`, and footer.
4. **`SvTilesView`**: Scrollable container for `SvTile` items. Handles keyboard cursor selection, drag-and-drop, and reordering gestures.
5. **`SvTile`**: Visual presentation of a single model node or property slot.

<svg viewBox="0 0 820 280" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="aio" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="box" x="20" y="20" width="780" height="240"/>
  <text x="35" y="42" class="b">SvBrowserView</text>
  <text x="35" y="60" class="dim">Breadcrumb Header: Workspace &gt; Projects &gt; Task</text>

  <rect class="box" x="35" y="75" width="360" height="170"/>
  <text x="50" y="95" class="b">SvNavView (Master Column)</text>
  <rect class="fill" x="50" y="105" width="330" height="125"/>
  <text x="65" y="125" class="b">SvTilesView</text>
  <text x="65" y="145" class="dim">• SummaryTile: Project Alpha</text>
  <text x="65" y="165" class="b">• SummaryTile: Project Beta  [*]</text>
  <text x="65" y="185" class="dim">• SummaryTile: Project Gamma</text>

  <rect class="box" x="425" y="75" width="360" height="170"/>
  <text x="440" y="95" class="b">SvStackView (Detail Area)</text>
  <rect class="fill" x="440" y="105" width="330" height="125"/>
  <text x="455" y="125" class="b">SvNavView (Detail Column)</text>
  <text x="455" y="145" class="dim">• PropertyTile: Name ("Project Beta")</text>
  <text x="455" y="165" class="dim">• PropertyTile: Status ("Active")</text>
  <text x="455" y="185" class="dim">• PropertyTile: Priority ("High")</text>

  <line class="flow" x1="380" y1="165" x2="440" y2="165" marker-end="url(#aio)"/>
</svg>

---

## Storage Layer Engineering

### Persistent Object Pools (`SvPersistentObjectPool`)
Application data is stored locally in IndexedDB as object pools (one pool per document):

- **Row Key Format:** `poolId` + `puuid` (Persistent UUID).
- **In-Pool References:** `{ "*": puuid }` (near references within the same document pool).
- **Cross-Pool References:** `{ "**": poolId }` (far references to external document roots, loaded asynchronously).

### Transactional Persistence Lifecycle
1. **Mutation Tracking:** Modifying a slot marked `setShouldStoreSlot(true)` invokes `didMutate()`, marking the node dirty.
2. **Event Loop Commit:** At the end of the current browser event loop, all dirty nodes are bundled into a single atomic IndexedDB transaction.
3. **Deserialization Pipeline:** On load, `instanceFromRecordInStore()` instantiates a blank object, invokes `init()`, populates slot state via `loadFromRecord()`, and executes `finalInit()` to reconnect object references.
4. **Garbage Collection:** Traces the stored graph from the pool root. Unreachable records are automatically deleted.
5. **SHA-256 Blob Pool (`SvBlobPool`):** Large binary assets (images, audio, files) are stored in a content-addressable store keyed by SHA-256 hash. Records store hash references rather than binary payloads.

---

## Synchronization Infrastructure

Strvct provides loose coupling across layers using three notification utilities:

1. **`SvNotificationCenter`**: Asynchronous notification dispatch. Nodes post named notifications; observing views register to handle them.
2. **`SvSyncScheduler`**: Coalesces multiple notification method invocations in one event loop into a single UI sync pass.
3. **`SvBroadcaster`**: Immediate, synchronous event broadcast for high-frequency internal events.

<svg viewBox="0 0 820 120" width="820" xmlns="http://www.w3.org/2000/svg">
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
    <marker id="aio" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="fill" x="30" y="20" width="220" height="80"/>
  <text x="45" y="42" class="b">Model Node Slot Setter</text>
  <text x="45" y="60" class="dim">character.setName("Thorin")</text>
  <text x="45" y="78" class="dim">Slot setter updates value</text>

  <line class="flow-dashed" x1="250" y1="60" x2="300" y2="60" marker-end="url(#aio)"/>

  <rect class="fill" x="300" y="20" width="220" height="80"/>
  <text x="315" y="42" class="b">SvNotificationCenter</text>
  <text x="315" y="60" class="dim">postNotification("didChange")</text>
  <text x="315" y="78" class="dim">Dispatches to observers</text>

  <line class="flow" x1="520" y1="60" x2="570" y2="60" marker-end="url(#aio)"/>

  <rect class="fill" x="570" y="20" width="220" height="80"/>
  <text x="585" y="42" class="b">SvSyncScheduler &amp; View</text>
  <text x="585" y="60" class="dim">scheduleTargetAndMethod()</text>
  <text x="585" y="78" class="dim">Coalesced view.syncFromNode()</text>
</svg>

---

## Content-Addressable Build System (CAM)

Strvct avoids standard ES module imports and Webpack/Vite bundlers, using a custom **Content-Addressable Memory (CAM)** build system:

1. **`ImportsIndexer` (Build Time):** Recursively walks `_imports.json` files to discover source files and dependency order. Outputs:
   - `_index.json`: Metadata catalog mapping resource paths to SHA-256 content hashes.
   - `_cam.json.zip`: Zip-compressed content bundle keyed by SHA-256 hash.

2. **`SvResourceManager` & `SvHashCache` (Runtime):**
   - Fetches `_index.json` on app boot.
   - Scans missing hashes against IndexedDB `SvHashCache`.
   - If missing ratio $> 30\%$, downloads `_cam.json.zip` in one HTTP request.
   - If missing ratio $\le 30\%$, fetches individual missing files on demand.
   - Evaluates source files in dependency order via `eval()` with embedded `sourceURL` comments for complete DevTools debugging support.

---

## Related Guides

- [Technical Overview](../Technical%20Overview/): High-level architecture and design philosophy.
- [Naked Objects](../Naked%20Objects/): Theoretical foundations and production case studies.
- [Comparing to React](../Comparing%20to%20React/): Guide for React developers exploring Strvct.
