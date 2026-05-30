# Nodes

The object model at the heart of STRVCT.

## Overview

Nodes are the central abstraction in STRVCT. Every piece of application state -- a user, a document, a settings panel, a list of items -- is a node. Nodes form a tree: each node has a parent and an ordered array of subnodes. The framework generates the entire UI from this tree, so understanding nodes is understanding how STRVCT applications are structured.

A node is not a UI component. It's a model object that declares its data (via [slots](../Slots/)), its children (via subnodes), and its display preferences (title, subtitle, layout direction). The framework's [view system](../Views/) reads this information and generates the appropriate UI automatically.

<svg viewBox="0 0 820 600" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="an" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>
  <rect class="fill" x="220" y="20" width="380" height="54"/>
  <text x="240" y="42" class="b">SvNode</text>
  <text x="240" y="60" class="dim">subnodes, parent / owner</text>
  <line class="flow" x1="410" y1="70" x2="410" y2="90" marker-end="url(#an)"/>
  <rect class="fill" x="220" y="90" width="380" height="54"/>
  <text x="240" y="112" class="b">SvTitledNode</text>
  <text x="240" y="130" class="dim">title, subtitle, note, ARIA, path navigation</text>
  <line class="flow" x1="410" y1="140" x2="410" y2="160" marker-end="url(#an)"/>
  <rect class="fill" x="220" y="160" width="380" height="54"/>
  <text x="240" y="182" class="b">SvTranslatableNode</text>
  <text x="240" y="200" class="dim">per-node i18n translation cache</text>
  <line class="flow" x1="410" y1="210" x2="410" y2="230" marker-end="url(#an)"/>
  <rect class="fill" x="220" y="230" width="380" height="54"/>
  <text x="240" y="252" class="b">SvInspectableNode</text>
  <text x="240" y="270" class="dim">inspector tiles generated from slot metadata</text>
  <line class="flow" x1="410" y1="280" x2="410" y2="300" marker-end="url(#an)"/>
  <rect class="fill" x="220" y="300" width="380" height="54"/>
  <text x="240" y="322" class="b">SvViewableNode</text>
  <text x="240" y="340" class="dim">view class selection, layout direction, tile prefs</text>
  <line class="flow" x1="410" y1="350" x2="410" y2="370" marker-end="url(#an)"/>
  <rect class="fill" x="220" y="370" width="380" height="54"/>
  <text x="240" y="392" class="b">SvStyledNode</text>
  <text x="240" y="410" class="dim">theme class name</text>
  <line class="flow" x1="410" y1="420" x2="410" y2="440" marker-end="url(#an)"/>
  <rect class="fill" x="220" y="440" width="380" height="54"/>
  <text x="240" y="462" class="b">SvStorableNode</text>
  <text x="240" y="480" class="dim">persistence, dirty tracking, mutation notifications</text>
  <line class="flow" x1="410" y1="490" x2="410" y2="510" marker-end="url(#an)"/>
  <rect class="fill" x="220" y="510" width="380" height="54"/>
  <text x="240" y="532" class="b">SvSummaryNode</text>
  <text x="240" y="550" class="dim">summary format · base for most application classes</text>
  <text x="410" y="590" text-anchor="middle" class="dim">Each layer adds one capability; application classes typically extend SvSummaryNode.</text>
</svg>

## The Node Hierarchy

STRVCT provides a single inheritance chain of node classes. Each level adds a specific capability:

| Class | Adds | Typical usage |
|---|---|---|
| `SvNode` | Subnode management, parent/owner relationships | Base class -- rarely used directly |
| `SvTitledNode` | Title, subtitle, note, ARIA methods, path navigation | Nodes that need display labels |
| `SvTranslatableNode` | Per-node translation cache for i18n | Automatic -- all nodes below inherit this |
| `SvInspectableNode` | Inspector generation from slot metadata, subnode fields | Automatic -- enables the debug inspector |
| `SvViewableNode` | View class selection, layout direction, tile preferences | Nodes that appear in the UI |
| `SvStyledNode` | Theme class name | Nodes with custom styling |
| `SvStorableNode` | Persistence, dirty tracking, mutation notifications | Nodes that persist to storage |
| `SvSummaryNode` | Configurable summary format, children summary | Most application model classes |

Application classes typically extend `SvSummaryNode` or `SvStorableNode`. The intermediate classes exist to cleanly separate concerns but are rarely extended directly.

## Subnodes

Every node has an ordered array of subnodes accessed via `subnodes()`. This array is the primary structural relationship in STRVCT -- it defines the tree that the UI renders.

```javascript
// Adding subnodes
parentNode.addSubnode(childNode);
parentNode.addSubnodeAt(childNode, 0);  // insert at index

// Querying
parentNode.subnodeCount();
parentNode.subnodeAt(2);
parentNode.indexOfSubnode(childNode);
parentNode.hasSubnode(childNode);

// Removing
parentNode.removeSubnode(childNode);

// Reordering
parentNode.moveSubnodesToIndex([nodeA, nodeB], 3);
```

When subnodes change, the framework automatically updates the UI through the [notification system](../Notifications/). No manual view refresh is needed.

### Subnodes vs. Subnode Fields

There are two ways a node can have children in the UI:

**Stored subnodes** (`setIsSubnode(true)`) are persistent children in the subnodes array. They're used for collections of similar items -- a list of contacts, a folder of bookmarks. The parent typically sets `setShouldStoreSubnodes(true)` so the array persists.

**Subnode fields** (`setIsSubnodeField(true)`) are slots that appear as navigable tiles in the UI but live in the parent's slot, not in the subnodes array. They're used for structured properties of an object -- a contact's address, a character's inventory. The slot value is the child node; it appears in the UI as a tile you can drill into.

```javascript
// Collection pattern -- stored subnodes
(class Contacts extends SvStorableNode {
    initPrototype () {
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([Contact]);
    }
}.initThisClass());

// Structured object pattern -- subnode fields
(class Contact extends SvStorableNode {
    initPrototypeSlots () {
        {
            const slot = this.newSlot("address", null);
            slot.setFinalInitProto(Address);
            slot.setIsSubnodeField(true);
        }
    }
    initPrototype () {
        this.setShouldStoreSubnodes(false);
    }
}.initThisClass());
```

## Title, Subtitle, and Note

`SvTitledNode` provides three display properties that tiles read to populate their content:

| Property | Purpose | Tile usage |
|---|---|---|
| `title()` | Primary label | Displayed as the main text in `SvTitledTile` |
| `subtitle()` | Secondary label or summary | Displayed below the title |
| `note()` | Badge or indicator | Displayed as a trailing annotation |

These are the most commonly overridden methods on application nodes:

```javascript
(class Character extends SvSummaryNode {
    title () {
        return this.name() || "Unnamed Character";
    }

    subtitle () {
        return `Level ${this.level()} ${this.characterClass()}`;
    }
}.initThisClass());
```

### Automatic Counts

`SvTitledNode` supports showing the subnode count as the subtitle or note without custom code:

```javascript
initPrototype () {
    this.setSubtitleIsSubnodeCount(true);  // subtitle shows "3 items"
    // or
    this.setNoteIsSubnodeCount(true);      // note shows the count
}
```

### Summary System

`SvSummaryNode` extends the display system with a configurable summary format. A node can declare how its title and value combine into a summary string, and whether its subtitle should be composed from its children's summaries:

```javascript
initPrototype () {
    this.setSummaryFormat("key: value");
    this.setNodeSubtitleIsChildrenSummary(true);
}
```

The `summaryFormat` options are: `"none"`, `"key"`, `"value"`, `"key value"`, `"value key"`, `"key: value"`.

The summary is composed from two overridable methods:

| Method | Default | Override when... |
|---|---|---|
| `summaryKey()` | Returns `title()` | The summary label should differ from the display title |
| `summaryValue()` | Returns `subtitle()` | The summary value should differ from the display subtitle |

`summary()` formats the key and value according to `summaryFormat` and returns the result. `childrenSummary()` joins each subnode's `summary()` into a single string -- this is what `nodeSubtitleIsChildrenSummary` displays.

The summary system is used when a parent node composes a one-line description from its children -- for example, a character's ability scores displayed as a subtitle on the parent node.

## View Preferences

Nodes don't create views directly, but they declare preferences that the view system reads:

### Layout Direction

```javascript
this.setNodeIsVertical(true);   // subnodes lay out top-to-bottom (default)
this.setNodeIsVertical(false);  // subnodes lay out left-to-right
```

This controls the direction of the tile container when displaying this node's subnodes. Vertical nodes produce a scrollable list; horizontal nodes produce side-by-side columns. The recursive combination of vertical and horizontal nodes at different levels of the tree is what gives STRVCT its [Miller column](../Inspirations/) navigation pattern.

### Custom View and Tile Classes

```javascript
// Use a specific view class for this node
this.setNodeViewClassName("MyCustomNodeView");

// Use a specific tile class when this node appears as a subnode
this.setNodeTileClassName("SvImageTile");
```

If no custom class is specified, the framework searches up the class hierarchy for a matching view class by naming convention (`ClassName` → `ClassNameView`).

### Tile Behavior

```javascript
this.setNodeTileIsSelectable(true);     // tile can be selected/drilled into
this.setNodeCanReorderSubnodes(true);   // subnodes support drag-to-reorder
this.setNodeCanAddSubnode(true);        // user can add new subnodes
this.setCanDelete(true);               // node can be deleted by the user
this.setNodeMinTileHeight(80);          // minimum tile height in pixels
```

## Persistence

`SvStorableNode` integrates with the [persistence system](../Persistence/). Nodes that extend it are automatically stored to IndexedDB and can sync to the cloud. The key configuration is which slots to persist:

```javascript
initPrototypeSlots () {
    {
        const slot = this.newSlot("name", "");
        slot.setSlotType("String");
        slot.setShouldStoreSlot(true);  // this slot persists
    }
}
initPrototype () {
    this.setShouldStore(true);          // this node class persists
    this.setShouldStoreSubnodes(true);  // subnode array persists
}
```

When a stored slot changes (via its setter), `SvStorableNode` automatically calls `didMutate()` to mark the node as dirty for the next persistence commit. No manual save calls are needed.

## Creating Application Nodes

A typical application node:

```javascript
(class Bookmark extends SvSummaryNode {

    static jsonSchemaDescription () {
        return "A saved web bookmark with URL, title, and tags";
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("url", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(true);
        }
        {
            const slot = this.newSlot("bookmarkTitle", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(true);
        }
        {
            const slot = this.newSlot("tags", null);
            slot.setFinalInitProto(SvJsonArrayNode);
            slot.setIsSubnodeField(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanEditTitle(true);
    }

    title () {
        return this.bookmarkTitle() || "Untitled Bookmark";
    }

    subtitle () {
        return this.url();
    }

}.initThisClass());
```

This declares three slots (two stored strings, one subnode field for tags), configures persistence, and overrides `title()` and `subtitle()` to control how the bookmark appears as a tile. The framework handles view generation, persistence, ARIA attributes, and i18n support automatically.
