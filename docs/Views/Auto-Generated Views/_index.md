# Auto-Generated Views

How the view layer connects to model nodes, resolves view classes, synchronizes state, and provides navigation without hand-authored UI code.

## Overview

In STRVCT, every domain node (`SvNode`) automatically receives a visual presentation: the framework discovers the matching view class, instantiates views lazily on demand, wires up observation notifications, and keeps views synchronized as model slots mutate.

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
    <marker id="agv" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <!-- Step 1: SvNode -->
  <rect class="box" x="25" y="20" width="240" height="230"/>
  <text x="40" y="42" class="b">Domain Model (SvNode)</text>

  <rect class="fill" x="40" y="60" width="210" height="45"/>
  <text x="55" y="80" class="b">Declared Slots</text>
  <text x="55" y="95" class="dim">Slot metadata &amp; annotations</text>

  <rect class="fill" x="40" y="115" width="210" height="45"/>
  <text x="55" y="135" class="b">Ordered Subnodes</text>
  <text x="55" y="150" class="dim">Child subnode graph</text>

  <rect class="fill" x="40" y="170" width="210" height="45"/>
  <text x="55" y="190" class="b">Slot Setter Mutation</text>
  <text x="55" y="205" class="dim">Posts didChangeSlot note</text>

  <line class="flow" x1="265" y1="135" x2="290" y2="135" marker-end="url(#agv)"/>

  <!-- Step 2: Resolution & Sync -->
  <rect class="fill" x="290" y="20" width="240" height="230"/>
  <text x="305" y="42" class="b">View Resolution Engine</text>

  <rect class="box" x="305" y="60" width="210" height="45"/>
  <text x="320" y="80" class="b">nodeViewClassName</text>
  <text x="320" y="95" class="dim">Explicit override check</text>

  <rect class="box" x="305" y="115" width="210" height="45"/>
  <text x="320" y="135" class="b">Name Convention Lookup</text>
  <text x="320" y="150" class="dim">Walks ClassName + "View"</text>

  <rect class="box" x="305" y="170" width="210" height="45"/>
  <text x="320" y="190" class="b">SvSyncScheduler Pass</text>
  <text x="320" y="205" class="dim">Coalesces view.syncFromNode()</text>

  <line class="flow" x1="530" y1="135" x2="555" y2="135" marker-end="url(#agv)"/>

  <!-- Step 3: Generated View Hierarchy -->
  <rect class="box" x="555" y="20" width="240" height="230"/>
  <text x="570" y="42" class="b">Generated Miller Column UI</text>

  <rect class="fill" x="570" y="60" width="210" height="45"/>
  <text x="585" y="80" class="b">SvStackView / SvNavView</text>
  <text x="585" y="95" class="dim">Master-detail layout column</text>

  <rect class="fill" x="570" y="115" width="210" height="45"/>
  <text x="585" y="135" class="b">SvTilesView &amp; SvTile</text>
  <text x="585" y="150" class="dim">Scrollable tile selection list</text>

  <rect class="fill" x="570" y="170" width="210" height="45"/>
  <text x="585" y="190" class="b">SvFieldTile Controls</text>
  <text x="585" y="205" class="dim">Type-appropriate field editors</text>
</svg>

---

## `SvDomView` Single-Inheritance Layering

Rather than subclassing raw HTML elements directly, STRVCT wraps DOM elements in a single-inheritance hierarchy where each layer adds one capability:

| View Class Layer | Added Capability |
|---|---|
| **`SvElementDomView`** | Wraps DOM element; manages creation, type, and class attributes. |
| **`SvVisibleDomView`** | Visibility toggling (`setIsVisible(bool)`). |
| **`SvResponderDomView`** | Responder chain for keyboard and mouse event routing. |
| **`SvListenerDomView`** | DOM event listener registration and removal. |
| **`SvControlDomView`** | Target/action pattern connecting views to event handlers. |
| **`SvSelectableDomView`** | Selection state with styled visual feedback. |
| **`SvEditableDomView`** | Content editability and edit mode toggling. |
| **`SvGesturableDomView`** | Gesture recognizers (tap, double-tap, pan, long-press, pinch). |
| **`SvFlexDomView`** | Flexbox layout properties (direction, wrap, grow, shrink, alignment). |
| **`SvStyledDomView`** | State-based styling (unselected, selected, active, disabled) with theme support. |
| **`SvSubviewsDomView`** | Parent/child subview hierarchy management. |
| **`SvCssDomView`** | Applies CSS variables from dictionaries to element styles. |
| **`SvDomView`** | Aggregates all layers above into the complete DOM view wrapper. |
| **`SvNodeView`** | Binds model `SvNode` to DOM presentation; handles observation & sync. |

---

## `SvNodeView` Bridge Methods

`SvNodeView` is the primary class for application views:
- `setNode(aNode)`: Assigns a model node and registers change observations via `SvNotificationCenter`.
- `syncFromNode()`: Diffs visible subnodes against active subviews, instantiating, reusing, or purging views as needed.
- `subviewProtoForSubnode(aSubnode)`: Resolves which view class to instantiate for a child subnode.
- `syncCssFromNode()`: Applies CSS variables defined on the model node to the DOM element.

---

## View Resolution Lookup Algorithm

When a node becomes visible, the framework discovers its view class using naming conventions:

1. **Explicit Override:** Check for an explicit `nodeViewClassName` override on the node.
2. **Inheritance Walk:** Walk the node's class hierarchy from most-derived to base (`SvNode`).
3. **Convention Lookup:** For each class ancestor, check for `ClassName + "View"` in global scope.
4. **Fallback:** If no match is found down to the root, fall back to default `SvNodeView`.

*Example:* For `Character` extending `SvStorableNode`, resolution checks `CharacterView` $\rightarrow$ `SvStorableNodeView` $\rightarrow$ `SvNodeView`.

---

## Navigation Containers (`SvStackView` & `SvBrowserView`)

### `SvStackView`
`SvStackView` is the recursive building block of navigation, splitting into two areas:
- **`SvNavView` (Master):** A column containing a header, scrollable `SvTilesView`, and footer.
- **`otherView` (Detail):** Content area for the selected tile—typically a child `SvStackView`.

Selecting a tile creates a new child `SvStackView` in the detail area. **Orientation** is set per node (`"right"` for horizontal master-left/detail-right, `"down"` for vertical master-top/detail-below).

### `SvBrowserView`
Top-level application container managing nested `SvStackView` columns to arbitrary depth. Includes a breadcrumb header that auto-compacts on narrow viewports:
- `navigateToNode(aNode)`: Navigates directly to a target node in the graph.
- `selectNodePathArray(pathArray)`: Programmatically sets the full navigation path.

---

## Tile Classes & Field Tiles

Tiles are individual items rendered inside `SvTilesView` columns:

| Tile Class | Purpose & Visual Presentation |
|---|---|
| **`SvTile`** | Base tile class. Handles selection, long-press reorder, slide-to-delete, and style state cascades. |
| **`SvTitledTile`** | Default tile. Displays title, subtitle, and note from `SvSummaryNode`. |
| **`SvHeaderTile`** | Non-selectable section header tile. |
| **`SvBreadCrumbsTile`** | Compact breadcrumb trail tile. |

### Field Tiles (`SvFieldTile`):

Field tiles render key-value property slots as editable controls:

| Field Tile Class | Property Control Type |
|---|---|
| **`SvStringFieldTile`** | Single-line text input |
| **`SvTextAreaFieldTile`** | Multi-line text area editor |
| **`SvBooleanFieldTile`** | Checkbox toggle control |
| **`SvPasswordFieldTile`** | Masked password text input |
| **`SvActionFieldTile`** | Button triggering a node method |
| **`SvPointerFieldTile`** | Object reference with navigation arrow |
| **`SvImageWellFieldTile`** | Image preview well with drag-and-drop support |
| **`SvVideoWellFieldTile`** | Video player well with drag-and-drop support |

---

## Related Guides

- [Custom Views](../Custom%20Views/index.html): Authoring custom view subclasses.
- [Companion View](../Companion%20View/index.html): Docked secondary views.
- [Responsive Views](../Responsive/index.html): Column compaction and mobile collapse.
