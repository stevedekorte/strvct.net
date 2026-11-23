# Browser Cleanup

Simplifying and documenting the browser navigation architecture.

**Status:** built: parts 1 to 4, and part 1's second pass (checked against the code 2026-11-23). (1) One navigation entry point: built 2026-11-19, see [below](#one-navigation-entry-point). (2) The compaction coordinator: released 2026-11-22, see [Compaction Coordinator](../Compaction%20Coordinator/). (3) Composable breadcrumbs and (4) the auxiliary view were built on 2026-06-12, before this plan was last revised, which did not notice: each browser owns its own `SvBreadCrumbsView`, and a node's `nodeCompanionNode()` gives it a [companion](../../Views/Companion%20View/) with an embedded browser of its own. The entry point's [second pass](#second-pass-built-2026-11-23) was built on 2026-11-23, with the navigation announcements in [Accessibility Testing & Tuning](../Accessibility%20Testing%20%26%20Tuning/). **Left:** the parts of the auxiliary-view sketch the companion did not take, which wait for a node that uses a companion ([below](#auxiliary-view)). The compaction notes from Cleanup Notes are merged in below.

## Current Architecture

The browser is built from four cooperating classes that implement a recursive Miller column navigation pattern:

### SvBrowserView

The top-level container. An `SvNodeView` (since 2026-06-12; before that a subclass of `SvStackView`) that owns two subviews: an `SvBreadCrumbsView` above an `SvStackView` rooted at the browser's node. It is the one way in for navigation (`navigate(aRequest)`), listens for `onRequestNavigateToNode` / `onRequestSelectNodePath` when `handlesGlobalNavRequests` is set (an embedded browser clears it), handles keyboard shortcuts, and settles into its base state when nobody has navigated it.

### SvStackView

The core navigation primitive. Each stack view is a pair: a **nav view** on the left (or top) showing the selected node's subnodes as selectable tiles, and an **other view** on the right (or bottom) that contains the next `SvStackView` for deeper navigation. This recursive nesting is what produces the Miller column layout.

Key responsibilities:

- **Path selection**: `selectNodePathArray(pathArray)` walks an array of nodes, selecting one at each level and recursing into the next stack view.
- **Path reporting**: `selectedNodePathArray()` and `selectedPathTitlesString()` return the current selection path by walking up or down the stack chain.
- **Direction**: The `direction` slot (`"right"` or `"down"`) controls whether subnodes lay out as side-by-side columns or stacked rows. Nodes set this via `setNodeIsVertical()` -- the stack view reads it and adjusts its flex direction accordingly. The recursive combination of different directions at each level is what distinguishes STRVCT's navigation from a standard Miller column browser.
- **Compaction**: each level states a claim (`layerClaim()`); the root runs one allocation over the chain (`SvLayerAllocation`) when a claim, the chain or a width has changed, and each column applies its answer (`applyLayerAnswer()`). See [Compaction Coordinator](../Compaction%20Coordinator/).
- **Notification broadcasting**: When the user selects a tile, the path change bubbles up the view parents (`childUpdatedNavPath`) to the first `SvBrowserView`, which updates its own breadcrumbs, posts a sender-scoped `onBrowserViewPathChange`, and stops it there, so navigation inside an embedded browser never reaches an outer one. The older global `onStackViewPathChange` note still posts.

### SvNavView

An individual navigation column within a stack view. Contains a header, a scrollable tile container (`SvTilesView`), and a footer. When assigned a node via `setNode()`, it populates the tiles view with that node's subnodes.

Additional features:

- **Gesture-based resizing**: Users can drag the right or bottom edge to resize the column. The new size is stored on the node (`nodeMinTileWidth` / `nodeMinTileHeight`), so it persists across navigation.
- **Collapse / uncollapse**: The compaction system can hide a nav view entirely when space is tight, replacing it with a back-navigation affordance.
- **Orientation sync**: Reads the parent stack view's direction and adjusts its own layout accordingly.

### SvBreadCrumbsView

The breadcrumb bar: a back button and one clickable segment per node in its browser's path. A plain view owned by the browser, with no node (it was a tile in the model graph, `SvBreadCrumbsTile`, until 2026-06-12). Its browser tells it when the path changes, so it reflects only navigation beneath that browser, and each browser on screen has its own. A click hands its browser a request with the cause `"user"`.

The breadcrumbs also compact: when the path is too long to fit, earlier crumbs are hidden and a back arrow appears that navigates to the most recent hidden crumb.

## Navigation Flow

When the user clicks a tile:

1. `SvTilesView` selects the tile and notifies its `SvNavView`.
2. The nav view's parent `SvStackView` calls `didChangeNavSelection()`.
3. This propagates up the view parents to the first `SvBrowserView`, which records the path change and posts `onBrowserViewPathChange`.
4. That browser's `SvBreadCrumbsView` rebuilds its segments.
5. The next `SvStackView` in the chain receives the selected node and populates its nav view.

When the user clicks a breadcrumb:

1. The breadcrumb bar reads the stored path array from the clicked button.
2. It hands the browser a request: `browser.navigate(SvNavigationRequest.toPath(path).setCause("user"))`.
3. The stack chain recursively selects each node in the path, collapsing deeper levels.
4. The resulting path change reaches the browser as in the steps above, and the breadcrumbs update.

## Cleanup Opportunities

The browser navigation works well but has accumulated complexity over time. Areas to consider:

### Clearer separation of concerns

`SvStackView` handles direction, compaction, path selection, and notification broadcasting. Some of these could be factored into smaller, more focused collaborators -- for example, a compaction manager or a path selection coordinator.

### Compaction logic

**Released 2026-11-22** (app PR #788). The plan and what was built are in [Compaction Coordinator](../Compaction%20Coordinator/). What this section asked for, and where it stands:

- **A compaction coordinator.** Built as claims stated by the views and one function, `SvLayerAllocation`, that allocates over the whole chain with no DOM. `TestLayerAllocation` holds its rules.
- **A written protocol.** The plan's [What asks for a pass](../Compaction%20Coordinator/#what-asks-for-a-pass) and the function's tests are the protocol. A pass runs only when a claim, the chain or a width has changed.
- **Measure once.** Done: a streamed response that ran 204 to 264 passes before runs none.
- **Priorities** (an order of giving way other than from the left) and **animation** are not built. Priorities are a part D item in the coordinator's plan, taken up when a case needs one.

### One navigation entry point

**Built 2026-11-19.** `selectNodePathArray()`, `navigateToNode()`, `selectNodePathString()`, `selectPathWithRetry()` and `moveToBase()` all navigated, through different code, and none said who asked. Now there is one way in:

```javascript
browser.navigate(SvNavigationRequest.toPath([a, b]).setCause("user"));
```

An `SvNavigationRequest` says where and who.

| Where | Made with |
| --- | --- |
| A path of nodes (a leading browser root is skipped) | `toPath(nodes)` |
| A node, by its parent chain | `toNode(aNode)` |
| A slash-separated title path, as a URL holds it | `toPathString("A/B")` |
| The browser's base state | `toBaseState()` |

| Cause | Meaning |
| --- | --- |
| `"user"` | The user's own act: a tile, a breadcrumb, a link in the content, a tab tapped again. |
| `"url"` | The address changed, or the page was opened at one. |
| `"program"` | Code moved the user without their asking for that place (the default). |
| `"base"` | A browser nobody has navigated settling into its base state. |

What it does and what it replaced:

- **One mechanism.** Every request gets the bounded retry while columns materialize and announces its arrival as a tap does. Before, only some routes retried, and a URL into a column that wasn't built yet was lost.
- **Who asked is remembered.** `browser.lastNavigationRequest()` is the request behind the latest path change. A listener to `onBrowserViewPathChange` asks it for the cause; this is what the navigation announcements in Accessibility Testing & Tuning need.
- **Model code is unchanged.** A model never references a view, so it still posts `onRequestNavigateToNode` or `onRequestSelectNodePath`. The browser turns each into a request with the cause `"program"`.
- **Panes.** An anchored-tabs stack hands the rest of a path to its pane with `continuingRequestToPath()`, so the pane's request carries the cause of the whole navigation.
- **Removed.** `navigateToNode`, `selectNodePathString`, `selectPathWithRetry` and the unused `setSelectedPathTitlesArray` / `setSelectedPathTitlesString`. The stack's `selectNodePathArray()` stays as the walk itself, called only by the browser.
- **Kept from sliding back.** `TestNavigationEntryPoint` fails when anything but the browser calls the stack's walk, or when a retired method returns. `tests/e2e/navigation-entry-point.spec.js` (in the app repo) checks each route and its cause in a browser.

Three decisions (Steve, 2026-11-19):

1. **A request object, not arguments.** New needs (which stack view, don't take focus) become slots, and call sites don't change.
2. **A tile the user taps reports afterwards.** The columns select it as before; the browser hears of the path change and records a request whose cause is the user. Nothing can veto or redirect a tap before it happens. That moves through the entry point with the compaction coordinator (part 2), the first thing that needs it.
3. **Focus-and-expand waits for a second pass.** `postShouldFocusAndExpandSubnode` and `postShouldFocusSubnode` ("show this child of where I am", about 16 call sites, most of them in the app) still select in the columns directly, so the path change they cause is recorded as the user's. Until the second pass, an announcement keyed on the cause will miss them.

#### Second pass (built 2026-11-23)

- **The focus notes are code's moves.** `postShouldFocusSubnode` and `postShouldFocusAndExpandSubnode` are still carried out by the column that shows the parent: it scrolls to the tile and opens it, which a path walk from the root would not do. That column now does it on behalf of a request with the cause `"program"` (`SvTilesView.selectForModel()` → `SvBrowserView.selectInColumnsFor()`), so the path change is recorded as code's and not the user's. A navigation already under way keeps its own cause. This differs from the first plan, which was to send the notes through `navigate()`; the column keeps its own scrolling and opening, and the browser hears who asked.
- **Every note is code's**, including one posted after the user's own add. The user asked for the new item, but not for the browser to move to it, so a screen reader should hear where they are.
- **Left as the user's, on purpose:** a column folding because its node was removed (`nodeBecameOrphan`), and a selected tile rebinding to a new instance. Neither takes the user anywhere new, and both stay silent.
- **Checked** by `TestNavigationEntryPoint` (both notes go through the request; nothing is left pending, even when the selection throws) and, in a browser against `just launch`, by `tests/e2e/navigation-announcements.spec.js` in the app repo. `navigation-entry-point.spec.js` and `meta-plan-step-a.spec.js` still pass.

### Mobile and responsive behavior

The compaction system provides basic responsive behavior, but a dedicated mobile navigation mode (e.g., single-column with swipe gestures) could replace the current approach of compacting columns until they fit.

### Composable breadcrumbs

**Built 2026-06-12.** The breadcrumbs used to be a node in the tree (`SvBreadCrumbsTile`) that found its target by walking up to the root stack view, so a browser could have only one set. Now each `SvBrowserView` owns an `SvBreadCrumbsView`, and a path change bubbles only to the nearest browser. An embedded browser, such as the one inside a companion, has its own trail and its own path, independent of the main one.

### Auxiliary view

**Built 2026-06-12, as the companion.** A node answers `nodeCompanionNode()` with another node, and `SvDetailView` shows that node beside (or below) the node's navigation in an `SvCompanionView` holding an embedded browser, with its own breadcrumbs, selection and compaction. It is docked, collapsed to a tab behind an edge handle, or hidden when there is no room; the user's dock or tab choice is kept, and Cmd+\\ toggles the deepest one. See [Companion View](../../Views/Companion%20View/). In the compaction pass, companions are sized before the columns, which then compact around the reservation.

The sketch that stood here proposed five hints. The companion took one and left the view to decide the rest:

| Sketched | Now |
| --- | --- |
| `setNodeAuxiliaryNode(node)` | `nodeCompanionNode()` |
| `setNodeAuxiliaryPosition("right" / "bottom")` | Not a hint; the edge follows the stack's direction (right, or bottom for a `"down"` stack). |
| `setNodeAuxiliaryDefaultState("expanded" / "collapsed")` | Not a hint; chosen from the space it is offered until the user pins docked or tab. |
| `setNodeAuxiliaryCompactsFirst(true)` | Not a hint; the columns compact around a docked companion, and a window too narrow for it hides it whatever the pin. |
| `setNodeAuxiliaryMaxColumns(n)` | Not built; the embedded browser compacts within its own width. |

**No node in the framework or the app supplies a companion yet**, so none of this has been seen in use. The companion's code is kept and nothing is spent on it until one does (Compaction Coordinator, decision 17); the missing hints wait for that node too.
