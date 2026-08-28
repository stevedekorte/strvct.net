# Companion View

A persistent secondary context docked alongside a node's navigation, collapsing behind an edge handle or disappearing as the viewport narrows.

## Overview

A *companion* is a second region the view layer shows next to a node's master-detail navigation: a chat panel beside a session's columns, an inspector beside an editor, a reference pane beside a document. It is not a popover or modal. While docked it lives in normal layout flow, reserves real space, and causes the navigation columns to compact rather than covering them.

As with the rest of the framework, the model contributes only a *node*; every decision about where that node appears, how wide it is, and when it collapses lives in the view layer. A node opts in by answering the optional protocol method:

```javascript
nodeCompanionNode () {
    return this.someOwnedNode(); // the companion root, or null for none
}
```

`SvNode.nodeCompanionNode()` returns `null` by default. It is a method rather than a stored slot because implementors typically *compute* the value — walking to an owner and returning one of its nodes — and it follows the same idiom as `headerNode()` / `footerNode()` on the nav view. The node never references a view class, a viewport size, or a collapse state; it just names a node to show alongside itself. This keeps the companion mechanism on the correct side of the [model/view boundary](../../Naked%20Objects/): a companion-bearing node remains testable headlessly.

## The Three States

A companion is always in exactly one of three modes, driven by available space and the user's pin:

- **docked** — content is shown beside the columns or beneath them. The companion reserves its full length, the columns compact to fit, and an inset edge handle offers to collapse it.
- **tab** — the panel and its former tab strip occupy zero space. An edge handle attached to the adjacent navigation column offers to expand it.
- **hidden** — neither panel nor edge handle is shown. The window is too narrow to offer the companion without compromising the primary content.

The companion **never floats over neighboring content**. Docking takes real layout space and the columns compact to fit—the same compaction described in [Responsive](../Responsive/), now accounting for the companion's reservation. The edge handle may straddle a boundary as an affordance, but the companion content itself never becomes a slide-over drawer.

## Class Structure

Three view classes implement the panel, sitting under the stack's detail view:

```
SvStackView
└── SvDetailView                       ← owns the space arbitration
    ├── childStackView                 ← the flexible region: child stack / inspector
    └── SvCompanionView (node = nodeCompanionNode())
        ├── contentView                 ← the companion node's view (default SvBrowserView)
        ├── SvCompanionTabView          ← retained internally; visible strip retired
        └── SvEdgeHandleView            ← collapse handle while docked
```

- **`SvDetailView`** is the always-present second child of an `SvStackView` after the navigation column. It creates an `SvCompanionView` whenever the stack's node answers `nodeCompanionNode()`, lays its children out along the stack's axis, and owns space arbitration between the flexible child stack and the companion. Horizontal compaction sees the reservation through `companionReservedWidth()`.

- **`SvCompanionView`** (extends `SvNodeView`) is bound to the companion root node. It owns its content view and docked edge handle and runs the docked/tab/hidden state machine internally. From the outside it is one child whose size animates between its docked length and zero. Its content view is resolved through the node-view protocol: an explicit `nodeViewClassName()` wins; otherwise the default is an embedded `SvBrowserView` with its own breadcrumbs and **isolated navigation** (`setHandlesGlobalNavRequests(false)`), so navigating inside the companion never disturbs the outer app.

- **`SvEdgeHandleView`** provides the visible affordance. While docked, the companion owns a handle on its leading edge. While collapsed, the deepest adjacent `SvNavView` owns the handle because the companion itself is zero-width. Both handles target the same `SvCollapsibleRegionProtocol` interface.

- **`SvCompanionTabView`** remains in the implementation for state and badge plumbing, but its visible strip is retired. It is always hidden by `applyMode()`. Consequently the aggregate attention badge has no visible home while the companion is collapsed; this is an acknowledged unfinished detail rather than current UI behavior.

## Space Arbitration and Pinning

The detail view hands the companion the space it may use along the dock axis, and `setAvailableLength()` resolves the mode:

| Condition | Resulting mode |
| --- | --- |
| less than the handle viability threshold (`tabLength`) | `hidden` (drop the handle too; content gets full width) |
| user pinned **docked** | `docked` |
| user pinned **tab** | `tab` |
| auto: fits the preferred length | `docked` |
| auto: doesn't fit | `tab` |

Activating either edge handle calls `toggleExpanded()`, which records the choice in `userMode` (the *pin*) and flips between docked and tab. A pin survives window resizes; only a too-narrow window, which forces `hidden`, overrides it. With no pin, the companion auto-arbitrates: docked when its preferred length fits and collapsed when it does not. Meta-Backslash toggles the deepest visible companion in the active browser chain.

`setAvailableLength()` returns whether the mode actually changed, which lets compaction iterate to a fixed point: reserving space for a newly docked companion can shrink the columns, which can change what fits, and so on until the layout settles.

## Bounded Recompaction

When a tap docks the companion, the columns must compact to make room. That recompaction is **bounded to the companion's own browser chain** — `toggleExpanded()` calls `recompactBrowserChain()` on its content stack, whose walk stops at the browser boundary (`rootStackView` / `stackViewSubchain`). The session's columns make room for the docked companion without disturbing the outer application stack. (An earlier version recompacted across the boundary and could uncollapse unrelated columns in the outer app; the bounded walk closes that class of bug.)

A related subtlety: an embedded content browser that first laid out while the companion was a zero-width tab will have compacted its columns to nothing. When the panel later docks at a real width, `SvCompanionView` schedules `relayoutDockedContent()` to re-run the content's compaction on the next cycle, so it renders without needing a manual window resize.

## Axis Independence

The state machine is axis-independent. The owning detail view sets the companion's `edge` from the stack's direction:

- **`edge: "right"`** — a horizontal stack docks the companion at the right and configures a vertical boundary handle.
- **`edge: "bottom"`** — a vertical stack docks it beneath the content and configures a horizontal boundary handle.

`SvEdgeHandleView` configures its orientation and expansion state from the region protocol, so the same affordance works at either edge.

## Attention Badge Status

The retained tab object still receives aggregate attention state through the node-view protocol: `nodeViewShouldBadge()` decides whether attention is needed and `nodeViewBadgeTitle()` supplies its text. Aggregating state across the companion subtree remains the node's responsibility. Because the visible tab strip has been retired, however, this badge is not currently displayed. A future implementation may move that signal to the edge handle.

## Theming

The panel retains these CSS variables for skinning:

| Variable | Applies to |
| --- | --- |
| `--SvCompanion-bg` | the companion panel background |
| `--SvCompanionTab-color` | legacy tab styling; retained but the strip is hidden |
| `--SvCompanionTab-border-color` | legacy tab border styling |
