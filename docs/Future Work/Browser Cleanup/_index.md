# Browser Cleanup

Simplifying and documenting the browser navigation architecture.

## Current Architecture

The browser is built from four cooperating classes that implement a recursive Miller column navigation pattern:

### SvBrowserView

The top-level container. Extends `SvStackView` and adds application-level concerns: listening for `onRequestNavigateToNode` notifications, handling keyboard shortcuts, and managing the root node hierarchy (app root, settings, breadcrumbs). On startup it schedules `moveToBase()` to set the initial navigation state.

### SvStackView

The core navigation primitive. Each stack view is a pair: a **nav view** on the left (or top) showing the selected node's subnodes as selectable tiles, and an **other view** on the right (or bottom) that contains the next `SvStackView` for deeper navigation. This recursive nesting is what produces the Miller column layout.

Key responsibilities:

- **Path selection**: `selectNodePathArray(pathArray)` walks an array of nodes, selecting one at each level and recursing into the next stack view.
- **Path reporting**: `selectedNodePathArray()` and `selectedPathTitlesString()` return the current selection path by walking up or down the stack chain.
- **Direction**: The `direction` slot (`"right"` or `"down"`) controls whether subnodes lay out as side-by-side columns or stacked rows. Nodes set this via `setNodeIsVertical()` -- the stack view reads it and adjusts its flex direction accordingly. The recursive combination of different directions at each level is what distinguishes STRVCT's navigation from a standard Miller column browser.
- **Compaction**: `updateCompactionChain()` automatically collapses columns that don't fit the available width, showing them as expandable when space is available again.
- **Notification broadcasting**: When the user selects a tile, `didChangeNavSelection()` propagates up to the root, which posts `onStackViewPathChangeNote` for breadcrumbs and other observers.

### SvNavView

An individual navigation column within a stack view. Contains a header, a scrollable tile container (`SvTilesView`), and a footer. When assigned a node via `setNode()`, it populates the tiles view with that node's subnodes.

Additional features:

- **Gesture-based resizing**: Users can drag the right or bottom edge to resize the column. The new size is stored on the node (`nodeMinTileWidth` / `nodeMinTileHeight`), so it persists across navigation.
- **Collapse / uncollapse**: The compaction system can hide a nav view entirely when space is tight, replacing it with a back-navigation affordance.
- **Orientation sync**: Reads the parent stack view's direction and adjusts its own layout accordingly.

### SvBreadCrumbsTile

Displays the current navigation path as a row of clickable buttons. Coordinates with the stack view entirely through notifications:

1. Observes `onStackViewPathChangeNote` from the root stack view.
2. Reads `targetStackView().selectedNodePathArray()` to get the current path.
3. Builds a button for each node in the path, storing the path-up-to-that-point in each button's `.info()`.
4. On click, calls `targetStackView().selectNodePathArray()` with the stored path to navigate back.

The breadcrumbs also compact: when the path is too long to fit, earlier crumbs are hidden and a back arrow appears that navigates to the most recent hidden crumb.

## Navigation Flow

When the user clicks a tile:

1. `SvTilesView` selects the tile and notifies its `SvNavView`.
2. The nav view's parent `SvStackView` calls `didChangeNavSelection()`.
3. This propagates up to the root stack view, which posts `onStackViewPathChangeNote`.
4. `SvBreadCrumbsTile` receives the notification and rebuilds its path buttons.
5. The next `SvStackView` in the chain receives the selected node and populates its nav view.

When the user clicks a breadcrumb:

1. `SvBreadCrumbsTile` reads the stored path array from the clicked button.
2. Calls `selectNodePathArray()` on the root stack view.
3. The stack chain recursively selects each node in the path, collapsing deeper levels.
4. The resulting path change triggers `onStackViewPathChangeNote`, and breadcrumbs update.

## Cleanup Opportunities

The browser navigation works well but has accumulated complexity over time. Areas to consider:

### Clearer separation of concerns

`SvStackView` handles direction, compaction, path selection, and notification broadcasting. Some of these could be factored into smaller, more focused collaborators -- for example, a compaction manager or a path selection coordinator.

### Compaction logic

The column compaction system spans `SvStackView` and `SvNavView` with mutual callbacks. Documenting or simplifying the compaction protocol would make it easier to extend (e.g., for mobile breakpoints or animation).

### Navigation API surface

`selectNodePathArray()`, `navigateToNode()`, `selectNodePathString()`, and `moveToBase()` all navigate but through different entry points. A unified navigation interface would reduce the number of paths through the code.

### Mobile and responsive behavior

The compaction system provides basic responsive behavior, but a dedicated mobile navigation mode (e.g., single-column with swipe gestures) could replace the current approach of compacting columns until they fit.

### Composable breadcrumbs

Breadcrumbs are not built into the browser view — they're a regular node (`SvBreadCrumbsTile`) added to the node tree. But the tile currently finds its target by walking up to the root `SvStackView`, so only one set of breadcrumbs can exist per browser. This breaks down when a split view or inspector pane contains its own nested stack view that the user navigates independently. That inner pane needs its own breadcrumbs tracking its own path, not the root's.

A concrete example: during a game narration conversation, a side panel could let the player inspect their character sheet — drilling into inventory, spells, ability scores — without navigating away from the conversation. That panel would be its own stack view with its own breadcrumbs, independent of the main browser path.

The fix is to make breadcrumbs composable: instead of always targeting the root stack view, the breadcrumbs node should target the nearest ancestor stack view (or a specifically assigned one). This would let any stack view — whether it's the top-level browser, one side of a split view, or a deep inspector panel — have its own independent navigation context with its own breadcrumb trail.

### Auxiliary view

A node could declare an auxiliary node that the view system renders as a side panel with its own independent navigation context. The auxiliary panel would be a full stack view — the user can drill into nested content within it — but scoped and constrained by hints from the primary node.

```javascript
this.setNodeAuxiliaryNode(this.characterSheet());
this.setNodeAuxiliaryPosition("right");           // or "bottom"
this.setNodeAuxiliaryDefaultState("expanded");    // or "collapsed"
this.setNodeAuxiliaryCompactsFirst(true);         // collapse auxiliary before main columns
this.setNodeAuxiliaryMaxColumns(2);               // cap drill-in depth within the panel
```

This stays declarative — the node says what it wants, the view system handles layout. The auxiliary side is a fully independent navigation context with its own breadcrumbs (once breadcrumbs are composable), its own selection, and its own internal compaction. No changes to the main selection model.

The `maxColumns` hint is important for space management. A conversation node knows it only needs a narrow inspector — one or two columns to peek at the character sheet. Once the user drills past the limit, deeper navigation replaces the last column rather than adding a new one.

### Compaction with auxiliary views

The current compaction algorithm walks the stack chain and collapses columns that don't fit the available width. Auxiliary views add a new dimension to this because column compaction (horizontal, across navigation levels) and auxiliary compaction (within a single level's content area) are orthogonal.

The compaction sequence would become:

1. **Auxiliary internal compaction**: If the auxiliary panel has more columns than fit its allotted width, collapse its inner columns first (using the existing compaction logic, scoped to the auxiliary stack view).
2. **Auxiliary collapse**: If still too tight, collapse the auxiliary panel entirely — to a toggle button, thin strip, or hidden — freeing its width for the main content.
3. **Main column compaction**: If the main stack chain still doesn't fit, run the existing column compaction on the primary columns.

Expanding works in reverse: as width becomes available, the main columns uncollapse first, then the auxiliary panel reappears, then the auxiliary's internal columns expand.

Node hints control priority: `auxiliaryCompactsFirst` (default `true`) means the auxiliary gives up space before any main columns. A node could set this to `false` if the auxiliary content is more important than the surrounding navigation context — though that would be unusual.

This approach requires no fundamental changes to the compaction algorithm itself. The auxiliary panel's internal compaction is just a smaller instance of the same algorithm running on a scoped stack view. The new work is the coordination layer that decides the order of compaction across the two contexts.
