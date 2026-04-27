# Nodes

The object model at the heart of STRVCT.

## Overview

Nodes are the central abstraction in STRVCT. Every piece of application state -- a user, a document, a settings panel, a list of items -- is a node. Nodes form a tree: each node has a parent and an ordered array of subnodes. The framework generates the entire UI from this tree, so understanding nodes is understanding how STRVCT applications are structured.

A node is not a UI component. It's a model object that declares its data (via [slots](../Slots/)), its children (via subnodes), and its display preferences (title, subtitle, layout direction). The framework's [view system](../Views/) reads this information and generates the appropriate UI automatically.

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
