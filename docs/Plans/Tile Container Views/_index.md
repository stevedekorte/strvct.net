# Tile Container Views

Layout strategies for presenting a node's subnodes.

**Status:** open. Waits on the compaction coordinator in [Browser Cleanup](../Browser%20Cleanup/), which gives containers the width extension points they need. **Order:** `setNodeTilesViewClass()` and the wrapping grid, then the table, then scrolling over windowed collections; the search and filter chrome takes the Search & Filtering item from [Emergent Capabilities](../Emergent%20Capabilities/). Each container gets its ARIA roles when it is written, not later.

## Context

STRVCT's view architecture has two distinct roles: **tile views** present an individual subnode (its fields, label, appearance), while **tile container views** arrange the array of subnodes spatially and provide uniform interaction (selection, reordering, drill-in, drag-and-drop).

Because the framework generates views from model metadata, adding a new container makes it instantly available to any node that opts in -- the same leverage that makes accessibility and i18n automatic.

## Existing Container

### Linear List (`SvTilesView`)

The framework's current tile container, which lays out subnodes as a linear array -- vertical (top to bottom) or horizontal (left to right), controlled by the parent `SvStackView`'s direction. This covers most navigation and form-based interfaces. Each subnode is rendered as a tile; the container handles selection, keyboard navigation, reordering, and drill-in.

## Proposed Containers

### Wrapping Grid

A container that flows tiles into rows (or columns), wrapping at the container edge. Useful for image galleries, icon grids, card collections, and any set of uniformly-sized items where the count varies.

The node would opt in via something like `setNodeTilesViewClass(SvGridTilesView)` and optionally hint at minimum tile width. The grid container handles layout; each cell is still a standard tile -- so selection, drag-to-reorder, and accessibility carry over.

### Spatial Map

A pannable, zoomable 2D surface with an optional background image. Subnodes report their positions and are rendered as markers or pins at arbitrary coordinates on the surface. Useful for world maps, dungeon maps, floor plans, relationship diagrams, and any visualization where items exist at continuous positions on a backdrop.

The container would support scroll, drag-to-pan, pinch-to-zoom, and mouse-wheel zoom gestures (extending the existing gesture recognizer system). Subnodes would store position in slot annotations (e.g. `setAnnotation("x", 120)`, `setAnnotation("y", 340)`) and the container reads these to place tiles absolutely. Positions could be 2D or potentially 3D (with a projection). The interaction model is navigating *within* a viewport -- the user moves around the map to find things.

### Grid Map

A structured grid where each subnode requests a discrete cell position and its tile fills that cell (or spans a rectangle of cells). Useful for tactical battle maps, inventory grids, seating charts, tile-based level editors, and scheduling layouts.

Unlike the spatial map, the grid has cell identity -- each position is a discrete slot in the layout. This changes the interaction model: dragging a node between cells is a structured move operation (snapping to grid positions, validating placement rules, swapping or shifting occupants), not a free-form repositioning. Selection, adjacency, and pathfinding queries are natural on a grid but awkward on a continuous surface. The grid may also support cell-level styling (highlighting, coloring regions) and structured keyboard navigation (arrow keys move between cells).

While a grid could technically be a special case of a spatial map with snap-to-grid, the interaction patterns diverge enough -- discrete drag-and-drop between cells, cell-based selection and navigation, occupancy rules -- that they likely warrant separate container classes with different gesture handling and different ARIA roles (`grid` + `gridcell` vs. a spatial landmark).

### Table

A dense tabular layout where each subnode is a row and its field slots become columns. Field tiles already parse key/value pairs; a table container would render the same data in a compact grid. Column headers would derive from slot names, sortability from slot types.

### Chart

A container that renders subnodes as data series in a chart (bar, line, scatter, etc.). The node's slot metadata (type, min, max, description) already provides enough information to auto-generate axis labels and scales -- the same annotations that drive JSON Schema and ARIA attributes.

## Design Considerations

- **Opt-in per node**: Nodes select their container via a new `setNodeTilesViewClass()`. The default remains `SvTilesView`.
- **Tile reuse**: Each cell, marker, row, or data point should still be a tile (or tile subclass) so that selection, gestures, theming, and accessibility work without reimplementation.
- **Stack composability**: New containers should compose within the existing stack navigation model -- drilling into a grid cell or map marker opens the next column just as drilling into a list tile does.
- **Responsive behavior**: Containers should adapt to their available size, reflowing or scrolling as needed. The existing `SvNavView` width management and compaction logic would need extension points.
- **Accessibility**: Each container needs appropriate ARIA roles (e.g. `grid`, `table`, `img` for canvas) following the same pattern as the `SvNodeView_accessibility` category.
- **User-switchable containers**: Nodes could declare a set of supported container views, and the UI would offer a control (e.g. a segmented toggle or menu in the nav header) for the user to switch between them at runtime -- viewing the same subnodes as a list, then as a grid, then as a table. The selected container preference could be persisted per node or per node class. The node would provide the list of appropriate container options (e.g. via `nodeAlternativeTilesViewClasses()`) so the UI only presents choices that make sense for that data -- a collection of images might offer list and grid, while a dataset might offer list, table, and chart. The switcher control would only appear when the node declares more than one option.

## Container Chrome

Beyond the tile area itself, containers could support optional header and footer regions with standard affordances:

- **Search & filter (header)**: A search field in the container header that filters visible subnodes by matching against node titles, slot values, or other metadata. The container would accept a filter predicate and re-render only matching tiles. For structured data, this could extend to faceted filtering (e.g. filter by slot type or annotation value).
- **Create new item (footer)**: A persistent affordance at the bottom of the container for adding a new subnode -- similar to the "+" pattern in list UIs. The container would delegate creation to the parent node, which knows what subnode type to instantiate. This keeps the container generic while letting the node control the semantics.

## Scaling to Large Collections

The current `SvTilesView` makes a tile for every loaded subnode. That is fine for typical hierarchies, and the data side of large collections now exists: a collection that declares `setSubnodesAreWindowed(true)` keeps its membership in the store and loads windows of it (`loadLatestWindow()`, `loadOlderWindow(limit)`), synchronously, since a pool's rows are in memory. What's missing is the container side:

- **Loading on scroll.** Scrolling near the oldest loaded tile should call `loadOlderWindow()`, so the container, not each app, pages through a windowed collection. Today the app asks for older windows itself.
- **Virtual scrolling.** Only tiles in or near the viewport are built; as the user scrolls, tiles are reused for other subnodes. This needs a fixed or measured-once tile height (see the DOM read/write rules: no measuring per scroll event).
- **Search as primary navigation.** When a collection is too large to browse, search becomes the entry point. Windowed collections would need a query on the store (by title or slot value) rather than loading everything to filter it.
- **Automatic grouping.** For very wide collections, the node (or container) could group subnodes into intermediate levels by a property (alphabetical buckets, category, date range), computed from the store's sort order, so no level shows an overwhelming number of tiles.
- **Remote sources.** A collection that lives on a server rather than in a pool is the one case that is truly async. It is [Async Navigation](../Async%20Navigation/)'s territory, and not planned.
