# Auto-Generated Views

How the view layer connects to model nodes, synchronizes state, and provides navigation — without writing any view code.

## Overview

The defining feature of a naked objects framework is that the UI is derived from the model. In STRVCT, every node automatically gets a visual representation: the framework discovers the right view class, creates instances, wires up observation, and keeps the view synchronized as the model changes. Application developers define model classes and get a fully navigable, editable UI for free.

## SvDomView Hierarchy

Rather than subclassing DOM elements directly, STRVCT wraps them. Each layer in the view class hierarchy adds one capability:

- **`SvElementDomView`** — Wraps a DOM element. Manages creation, type, and class attributes.
- **`SvVisibleDomView`** — Visibility toggling.
- **`SvResponderDomView`** — Responder chain for keyboard and mouse event routing.
- **`SvListenerDomView`** — Event listener registration and removal.
- **`SvControlDomView`** — Target/action pattern for connecting views to handlers.
- **`SvSelectableDomView`** — Selection state with styled feedback.
- **`SvEditableDomView`** — Content editability and edit mode.
- **`SvGesturableDomView`** — Gesture recognizers: tap, double-tap, pan, long-press, pinch.
- **`SvFlexDomView`** — Flexbox layout: direction, wrap, grow, shrink, basis, alignment.
- **`SvStyledDomView`** — Named style states (unselected, selected, active, disabled) with theme support.
- **`SvSubviewsDomView`** — Parent/child view hierarchy.
- **`SvCssDomView`** — CSS variable application from dictionaries.
- **`SvDomView`** — Combines all layers above.
- **`SvNodeView`** — Adds model-to-view synchronization. The primary class for application views.

## SvNodeView

`SvNodeView` is the bridge between model nodes and the DOM. It holds a reference to an `SvNode`, observes change notifications, and manages the subview lifecycle.

- `setNode(aNode)` — Assigns a node and begins observation via `SvNotificationCenter`.
- `syncFromNode()` — Diffs visible subnodes against current subviews: creates, reuses, or removes as needed.
- `subviewProtoForSubnode(aSubnode)` — Resolves which view class to use (see View Resolution).
- `syncCssFromNode()` — Applies CSS variables defined on the node to the DOM element.

## View Resolution

The framework discovers view classes by naming convention: append `"View"` or `"SvTile"` to the node's class name.

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

### SvStackView

`SvStackView` is the single recursive building block of all navigation. It splits into two regions:

- **`SvNavView`** (master) — A column with a header, a scrollable `SvTilesView`, and a footer.
- **`otherView`** (detail) — The content of the selected item — typically another `SvStackView`.

Selecting a tile creates a new `SvStackView` in the detail area for the selected node's subnodes. This is the entire navigation mechanism: the same master-detail split, repeated at every level.

**Orientation** is set per node — `"right"` for horizontal (master left, detail right) or `"down"` for vertical (master top, detail below). Mixing orientations at different depths produces horizontal Miller Columns, vertical drill-down, or hybrids, all from the same structure.

**Compaction**: When nested columns would exceed the viewport, upper columns collapse automatically. Navigating back re-expands them. Tiles along the selection path are highlighted; the focused tile gets a distinct highlight.

### SvBrowserView

`SvBrowserView` is the top-level container — a `SvStackView` whose detail area contains another `SvStackView`, whose detail area contains another, to any depth. It adds a breadcrumb header that auto-compacts on narrow viewports, replacing truncated segments with a back arrow.

- `navigateToNode(aNode)` — Navigate directly to a node.
- `selectNodePathArray(pathArray)` — Set the navigation path programmatically.

## SvTilesView

`SvTilesView` is the scrollable column that displays one `SvTile` per visible subnode. It handles selection, keyboard navigation (arrow keys, Enter, Escape), long-press reordering, pinch gestures, and drag-and-drop between columns. Layout direction follows the parent `SvStackView`.

## Tiles

Tiles are the items in a navigation column. All extend `SvNodeView`.

**`SvTile`** — The base class. Provides selection feedback, slide-to-delete (an inner `contentView` slides to reveal action buttons beneath), long-press reorder, and a style cascade that checks the node, then the tile, then the parent column.

**`SvTitledTile`** — The default. Displays title, subtitle, and note from `SvSummaryNode`.

**`SvHeaderTile`** — A non-selectable section header.

**`SvBreadCrumbsTile`** — A breadcrumb path that auto-compacts to fit.

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
