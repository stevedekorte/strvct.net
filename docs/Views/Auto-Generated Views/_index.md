# Auto-Generated Views

How the view layer connects to model nodes, synchronizes state, and provides navigation — without writing any view code.

## Overview

The defining feature of a naked objects framework is that the UI is derived from the model. In STRVCT, every node automatically gets a visual representation: the framework discovers the right view class, creates instances, wires up observation, and keeps the view synchronized as the model changes. Application developers define model classes and get a fully navigable, editable UI for free.

## DomView Hierarchy

Rather than subclassing DOM elements directly, STRVCT wraps them. Each layer in the view class hierarchy adds one capability:

- **`ElementDomView`** — Wraps a DOM element. Manages creation, type, and class attributes.
- **`VisibleDomView`** — Visibility toggling.
- **`ResponderDomView`** — Responder chain for keyboard and mouse event routing.
- **`ListenerDomView`** — Event listener registration and removal.
- **`ControlDomView`** — Target/action pattern for connecting views to handlers.
- **`SelectableDomView`** — Selection state with styled feedback.
- **`EditableDomView`** — Content editability and edit mode.
- **`GesturableDomView`** — Gesture recognizers: tap, double-tap, pan, long-press, pinch.
- **`FlexDomView`** — Flexbox layout: direction, wrap, grow, shrink, basis, alignment.
- **`StyledDomView`** — Named style states (unselected, selected, active, disabled) with theme support.
- **`SubviewsDomView`** — Parent/child view hierarchy.
- **`CssDomView`** — CSS variable application from dictionaries.
- **`DomView`** — Combines all layers above.
- **`NodeView`** — Adds model-to-view synchronization. The primary class for application views.

## NodeView

`NodeView` is the bridge between model nodes and the DOM. It holds a reference to an `SvNode`, observes change notifications, and manages the subview lifecycle.

- `setNode(aNode)` — Assigns a node and begins observation via `SvNotificationCenter`.
- `syncFromNode()` — Diffs visible subnodes against current subviews: creates, reuses, or removes as needed.
- `subviewProtoForSubnode(aSubnode)` — Resolves which view class to use (see View Resolution).
- `syncCssFromNode()` — Applies CSS variables defined on the node to the DOM element.

## View Resolution

The framework discovers view classes by naming convention: append `"View"` or `"Tile"` to the node's class name.

1. Check for an explicit `nodeViewClassName` override on the node.
2. Walk the node's class hierarchy from most-derived to base.
3. For each ancestor, look up `ClassName + "View"`.
4. Return the first match.

For a `MySpecialNode` extending `SvStorableNode`, the lookup tries `MySpecialNodeView`, then `SvStorableNodeView`, and so on. No registration required — just name the view class to match.

## Synchronization

`SvSyncScheduler` batches and coordinates all synchronization between nodes and views.

**Model to view**: A slot change triggers `didUpdateSlot()` on the node, which posts an `onUpdatedNode` notification. Observing views schedule a sync at priority 2, executed at the end of the event loop.

**View to model**: A user edit triggers `scheduleSyncToNode()` at priority 0 (higher than model-to-view). The view calls the node's setter, which posts its own change notification, completing the cycle.

The scheduler coalesces duplicate calls, detects sync loops, and can be paused during bulk operations. Slot setters only fire hooks when the value actually changes, preventing redundant cascades at the source.

## Navigation

### StackView

`StackView` is the single recursive building block of all navigation. It splits into two regions:

- **`NavView`** (master) — A column with a header, a scrollable `TilesView`, and a footer.
- **`otherView`** (detail) — The content of the selected item — typically another `StackView`.

Selecting a tile creates a new `StackView` in the detail area for the selected node's subnodes. This is the entire navigation mechanism: the same master-detail split, repeated at every level.

**Orientation** is set per node — `"right"` for horizontal (master left, detail right) or `"down"` for vertical (master top, detail below). Mixing orientations at different depths produces horizontal Miller Columns, vertical drill-down, or hybrids, all from the same structure.

**Compaction**: When nested columns would exceed the viewport, upper columns collapse automatically. Navigating back re-expands them. Tiles along the selection path are highlighted; the focused tile gets a distinct highlight.

### BrowserView

`BrowserView` is the top-level container — a `StackView` whose detail area contains another `StackView`, whose detail area contains another, to any depth. It adds a breadcrumb header that auto-compacts on narrow viewports, replacing truncated segments with a back arrow.

- `navigateToNode(aNode)` — Navigate directly to a node.
- `selectNodePathArray(pathArray)` — Set the navigation path programmatically.

## TilesView

`TilesView` is the scrollable column that displays one `Tile` per visible subnode. It handles selection, keyboard navigation (arrow keys, Enter, Escape), long-press reordering, pinch gestures, and drag-and-drop between columns. Layout direction follows the parent `StackView`.

## Tiles

Tiles are the items in a navigation column. All extend `NodeView`.

**`Tile`** — The base class. Provides selection feedback, slide-to-delete (an inner `contentView` slides to reveal action buttons beneath), long-press reorder, and a style cascade that checks the node, then the tile, then the parent column.

**`TitledTile`** — The default. Displays title, subtitle, and note from `SvSummaryNode`.

**`HeaderTile`** — A non-selectable section header.

**`BreadCrumbsTile`** — A breadcrumb path that auto-compacts to fit.

## Field Tiles

Field tiles present individual slot values as editable key/value rows. The base `SvFieldTile` has four regions: key, value, error, and note.

| Class | Purpose |
|-------|---------|
| `SvStringFieldTile` | Single-line text input |
| `SvTextAreaFieldTile` | Multi-line text editing |
| `SvBooleanFieldTile` | Checkbox toggle |
| `SvPasswordFieldTile` | Masked password input |
| `SvActionFieldTile` | Button that invokes a node method |
| `SvPointerFieldTile` | Object reference with navigation arrow |
| `SvImageWellFieldTile` | Image display and drag in/out |
| `SvVideoWellFieldTile` | Video display and drag in/out |

Not every field type needs its own tile — `SvNumberField` uses the string tile with numeric validation.
