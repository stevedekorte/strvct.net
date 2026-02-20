# Views

How the view layer connects to model nodes, synchronizes state, and provides navigation.

## Overview

STRVCT's view layer automatically generates user interfaces from the model node graph. Every visible node gets a corresponding view — typically a `NodeView` subclass — that observes the node for changes and keeps the display in sync. Views are discovered by naming convention, so adding a class like `MyNodeView` automatically associates it with `MyNode` instances.

The UI is built around a Miller Column navigation pattern: selecting an item in one column reveals its children in the next. This recursive structure, implemented through `StackView` and `BrowserView`, allows arbitrarily deep navigation through the node graph.

## DomView Hierarchy

Rather than subclassing DOM elements directly, STRVCT wraps them. The view class hierarchy is a layered stack where each layer adds a specific capability:

- **`ElementDomView`** — Wraps a DOM element. Manages element creation, type, and class attributes.
- **`VisibleDomView`** — Visibility toggling and display property management.
- **`ResponderDomView`** — Responder chain for keyboard and mouse event routing. Manages first-responder focus.
- **`ListenerDomView`** — Event listener registration and removal.
- **`ControlDomView`** — Target/action pattern for connecting views to handler objects.
- **`SelectableDomView`** — Selection state management with styled feedback.
- **`EditableDomView`** — Content editability and edit mode support.
- **`GesturableDomView`** — Gesture recognizer framework: tap, double-tap, pan, long-press, pinch.
- **`FlexDomView`** — Flexbox layout properties: direction, wrap, grow, shrink, basis, alignment.
- **`StyledDomView`** — Named style states (unselected, selected, active, disabled) with theme class name support.
- **`SubviewsDomView`** — Parent/child view hierarchy. Manages subview arrays and insertion/removal.
- **`CssDomView`** — CSS variable application from dictionaries.
- **`DomView`** — Organizational base that combines all layers above.
- **`NodeView`** — Adds model-to-view synchronization. This is the primary class for application views.

## NodeView

`NodeView` extends `StyledDomView` and is the bridge between model nodes and the DOM. It holds a reference to an `SvNode`, observes its change notifications, and manages the creation and lifecycle of subviews for the node's subnodes.

### Key Responsibilities

- **Node observation** — When a node is assigned via `setNode()`, the view registers an observation with `SvNotificationCenter` to watch for `onUpdatedNode` notifications.
- **Subview management** — `syncFromNode()` compares the node's visible subnodes against current subviews. New subviews are created for new subnodes, existing ones are reused, and obsolete ones are removed.
- **CSS synchronization** — `syncCssFromNode()` applies CSS variables defined on the node to the view's DOM element.

### Important Methods

- `setNode(aNode)` — Assigns a node and begins observation.
- `syncFromNode()` — Core sync method. Updates subviews to match the node's visible subnodes.
- `scheduleSyncFromNode()` — Defers sync via `SvSyncScheduler` at priority 2.
- `syncFromNodeNow()` — Forces immediate synchronization.
- `subviewProtoForSubnode(aSubnode)` — Determines which view class to use for a given subnode (checks override, then the node's `nodeViewClass()`, then the default).
- `newSubviewForSubnode(aSubnode)` — Creates a new view instance for a subnode by cloning the appropriate prototype and setting its node.
- `visibleSubnodes()` — Filters subnodes by their `isVisible()` state.

## View Resolution

The framework automatically discovers which view class to use for a given node using a naming convention: append `"View"` or `"Tile"` to the class name.

### Resolution Algorithm

1. Check if the node has an explicit `nodeViewClassName` property set (an override).
2. If not, walk the node's class hierarchy from most-derived to base.
3. For each ancestor class, construct the name `ClassName + "View"` and look it up.
4. Return the first match found.

For example, given a node of class `MySpecialNode` that extends `SvStorableNode`:
1. Look for `MySpecialNodeView` — if it exists, use it.
2. Look for `SvStorableNodeView` — if it exists, use it.
3. Continue up the hierarchy until a match is found.

The same algorithm applies for tile views, using the `"Tile"` suffix instead. Nodes can also override their tile class via the `nodeTileClassName` slot.

This convention means you never need to register view-model associations — just name your view class to match your node class.

## Synchronization

STRVCT uses `SvSyncScheduler` to batch and coordinate synchronization between nodes and views, preventing redundant updates and sync loops.

### Node to View (Model Changes)

1. A node's slot value changes, triggering `didUpdateSlot()`.
2. The node posts an `onUpdatedNode` notification via `SvNotificationCenter`.
3. Any `NodeView` observing that node receives the notification and calls `scheduleSyncFromNode()`.
4. `SvSyncScheduler` queues the sync at priority 2 and executes it at the end of the current event loop.
5. `syncFromNode()` runs: subviews are created, reused, or removed to match the node's current subnodes.

### View to Node (User Input)

1. The user edits a value in a view (e.g., a text field).
2. The view's `didUpdateSlot()` fires. If the slot has `syncsToNode` enabled, `scheduleSyncToNode()` is called.
3. `SvSyncScheduler` queues the sync at priority 0 (higher priority than node-to-view).
4. `syncToNode()` runs: the view calls the appropriate setter on the node to update the model.
5. The node posts its own change notification, and the cycle completes.

### Batching and Loop Prevention

`SvSyncScheduler` coalesces multiple calls to the same target and method into a single execution. It also detects sync loops — if a sync action attempts to re-schedule itself during execution, an error is thrown rather than entering an infinite loop. Additionally, slot setters only fire change hooks when the value actually differs, preventing redundant notification cascades at the source.

The scheduler can be paused during bulk operations (e.g., application initialization) and resumed afterward to trigger a single consolidated sync pass.

## Navigation: BrowserView and StackView

The primary UI structure is a recursive Miller Column browser.

### StackView

`StackView` is the core navigation unit. It contains two regions:

- **`NavView`** — A navigation column with a header, a scrollable `TilesView`, and a footer.
- **`otherView`** — A detail area that displays the content of the selected item.

When a user selects a tile in the `NavView`, a new `StackView` is created in the `otherView`, with its own `NavView` populated by the subnodes of the selected node. This recursive nesting allows navigation to any depth.

Layout direction is configurable — `"right"` places the nav column on the left with detail to the right; `"down"` places it on top with detail below.

### Compaction

When the chain of nested `StackView`s would exceed the available display width, upper columns automatically compact (collapse) to make room for deeper levels. As the user navigates back, columns re-expand. This keeps the most relevant navigation context visible regardless of depth.

### BrowserView

`BrowserView` extends `StackView` and adds a breadcrumb path header at the top. It provides methods for programmatic navigation:

- `navigateToNode(aNode)` — Navigate directly to a specific node.
- `selectNodePathArray(pathArray)` — Set the navigation path from an array of nodes.

## TilesView

`TilesView` is a scrollable container that displays an array of `Tile` views, one for each visible subnode. It manages:

- **Selection** — Single-select by default; tracks the currently selected tile.
- **Keyboard navigation** — Arrow keys move the cursor between tiles; Enter selects; Escape navigates back.
- **Gesture handling** — Long-press and pan to reorder tiles; pinch gestures for expand/collapse.
- **Drag and drop** — Browser-native drag support for moving items between columns.
- **Orientation** — Adapts layout direction based on the parent `StackView`'s direction setting.

## Tiles

Tiles are the individual items displayed in navigation columns. All tiles extend `NodeView`, so they observe their assigned node and sync automatically.

### Tile

The base `Tile` class provides:

- Selection with visual feedback and flash animation.
- Slide-to-delete gesture (pan left to reveal delete button).
- Long-press and pan to reorder within the column.
- A close button for item removal.
- Style lookup that checks the node's style configuration, then falls back to the tile's own style, then to the parent column's style.

Each tile contains an inner `contentView` that holds the tile's visible content. The outer tile element stays fixed in place while the `contentView` slides horizontally in response to pan gestures, revealing action buttons (such as delete) underneath. This inner/outer structure is what makes slide-to-delete work — the gesture translates the content layer without moving the tile itself.

### TitledTile

The most common tile type. Displays the node's title, subtitle, and note (derived from `SvSummaryNode` methods). Used as the default tile for most nodes.

### HeaderTile

A non-selectable section header displayed at the top of a column.

### BreadCrumbsTile

Displays a breadcrumb navigation path that auto-compacts to fit the available width.

## Field Tiles

Field tiles present node properties as editable key/value rows in the inspector. They extend `Tile` and are used when viewing a node's individual slot values rather than its subnodes.

### SvFieldTile

The base field tile with a structured layout:

- **Key view** — Displays the property name.
- **Value view** — Displays and optionally allows editing the property value.
- **Error view** — Shows validation errors.
- **Note view** — Shows property description or hints.

Colors and borders change based on editability state.

### Field Tile Subclasses

| Class | Purpose |
|-------|---------|
| `SvStringFieldTile` | Single-line text input |
| `SvTextAreaFieldTile` | Multi-line text editing |
| `SvBooleanFieldTile` | Checkbox toggle |
| `SvPasswordFieldTile` | Masked password input |
| `SvActionFieldTile` | Button that invokes a method on the node |
| `SvPointerFieldTile` | Object reference with navigation arrow |
| `SvImageWellFieldTile` | Image display and upload |
| `SvVideoWellFieldTile` | Video display |

When a field tile's value is edited, the change flows through `syncToNode()` back to the node's slot, which posts a change notification, completing the bidirectional sync cycle.
