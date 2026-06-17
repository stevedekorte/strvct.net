# Companion View

A persistent panel docked alongside a node's navigation — content beside the columns, collapsing to a thin tab or out of sight as the viewport narrows.

## Overview

A *companion* is a second region the view layer shows next to a node's master-detail navigation: a chat panel beside a session's columns, an inspector beside an editor, a reference pane beside a document. It is not a popover or a modal — it lives in normal layout flow, reserves real space, and the navigation columns compact to make room for it rather than being covered by it.

As with the rest of the framework, the model contributes only a *node*; every decision about where that node appears, how wide it is, and when it collapses lives in the view layer. A node opts in by answering the optional protocol method:

```javascript
nodeCompanionNode () {
    return this.someOwnedNode(); // the companion root, or null for none
}
```

`SvNode.nodeCompanionNode()` returns `null` by default. It is a method rather than a stored slot because implementors typically *compute* the value — walking to an owner and returning one of its nodes — and it follows the same idiom as `headerNode()` / `footerNode()` on the nav view. The node never references a view class, a viewport size, or a collapse state; it just names a node to show alongside itself. This keeps the companion mechanism on the correct side of the [model/view boundary](../../Naked%20Objects/): a companion-bearing node remains testable headlessly.

## The Three States

A companion is always in exactly one of three modes, driven entirely by available space and the user's pin:

- **docked** — content is shown beside (or, in a vertical stack, beneath) a thin caret strip. The columns compact to fit; the companion reserves its full width. The caret offers to collapse the panel.
- **tab** — only the caret strip is shown; the content is hidden. The caret offers to expand the panel.
- **hidden** — nothing is shown at all. The window is too narrow for even the strip, so the navigation content gets the full width.

The companion **never floats over neighboring content**. Docking takes real layout space and the columns compact to fit — the same compaction described in [Responsive](../Responsive/), now accounting for the companion's reserved length as well. This is a deliberate contrast with the slide-over drawer pattern: predictable layout beats overlap.

## Class Structure

Three view classes implement the panel, sitting under the stack's detail view:

```
SvStackView
└── SvDetailView                       ← owns the space arbitration
    ├── childStackView                 ← the flexible region: child stack / inspector
    └── SvCompanionView (node = nodeCompanionNode())
        ├── contentView                ← the companion node's view (default SvBrowserView)
        └── SvCompanionTabView          ← the collapsed form: caret strip + badge
```

- **`SvDetailView`** is the always-present second child of an `SvStackView` (after the nav column). It creates an `SvCompanionView` whenever the stack's node answers `nodeCompanionNode()`, lays its children out along the stack's axis, and owns the space arbitration between the flexible child stack and the companion's reserved length. Compaction sees that reservation through `companionReservedLength()`.

- **`SvCompanionView`** (extends `SvNodeView`) is bound to the companion root node. It owns its content view and its tab, and runs the docked/tab/hidden state machine internally — so from the outside it is just one child whose size animates between panel length and tab length. Its content view is resolved through the node-view protocol: an explicit `nodeViewClassName()` wins, otherwise the default is an embedded `SvBrowserView` with its own breadcrumbs and **isolated navigation** (`setHandlesGlobalNavRequests(false)`), so navigating inside the companion never disturbs the outer app.

- **`SvCompanionTabView`** (extends `SvFlexDomView`) is the thin strip that hugs the dock edge. It shows a single chevron affordance and an optional attention badge — deliberately no title, since the strip is too narrow to render one legibly. Tapping it toggles the companion open or closed.

## Space Arbitration and Pinning

The detail view hands the companion the space it may use along the dock axis, and `setAvailableLength()` resolves the mode:

| Condition | Resulting mode |
| --- | --- |
| less than the tab length | `hidden` (drop the strip too; content gets full width) |
| user pinned **docked** | `docked` |
| user pinned **tab** | `tab` |
| auto: fits the preferred length | `docked` |
| auto: doesn't fit | `tab` |

Tapping the tab calls `toggleExpanded()`, which records the choice in `userMode` (the *pin*) and flips between docked and tab. A pin survives window resizes — only a too-narrow window (which forces `hidden`) overrides it. With no pin, the companion auto-arbitrates: docked when the preferred width fits, a tab when it doesn't.

`setAvailableLength()` returns whether the mode actually changed, which lets compaction iterate to a fixed point: reserving space for a newly docked companion can shrink the columns, which can change what fits, and so on until the layout settles.

## Bounded Recompaction

When a tap docks the companion, the columns must compact to make room. That recompaction is **bounded to the companion's own browser chain** — `toggleExpanded()` calls `recompactBrowserChain()` on its content stack, whose walk stops at the browser boundary (`rootStackView` / `stackViewSubchain`). The session's columns make room for the docked companion without disturbing the outer application stack. (An earlier version recompacted across the boundary and could uncollapse unrelated columns in the outer app; the bounded walk closes that class of bug.)

A related subtlety: an embedded content browser that first laid out while the companion was a zero-width tab will have compacted its columns to nothing. When the panel later docks at a real width, `SvCompanionView` schedules `relayoutDockedContent()` to re-run the content's compaction on the next cycle, so it renders without needing a manual window resize.

## Axis Independence

The state machine is axis-independent. The owning detail view sets the companion's `edge` from the stack's direction:

- **`edge: "right"`** — a horizontal stack docks the companion at the right, with a *vertical* tab strip; the caret points left/right (`◂` to expand, `▸` to collapse).
- **`edge: "bottom"`** — a vertical stack docks it beneath the content, with a *horizontal* tab strip; the caret points up/down (`▴` to expand, `▾` to collapse).

The caret always points the way a tap moves the panel, so the affordance reads correctly at either edge.

## Badge

The tab can show an aggregate attention badge driven by the node-view protocol: when `node.nodeViewShouldBadge()` is `true`, `node.nodeViewBadgeTitle()` supplies the text (a string renders a chip; an empty string renders a dot; `null`/`false` hides it). Aggregating state across the companion subtree into a single badge value is the node's responsibility — the view only renders what the protocol reports.

## Theming

The panel and its tab expose CSS variables for skinning:

| Variable | Applies to |
| --- | --- |
| `--SvCompanion-bg` | the companion panel background |
| `--SvCompanionTab-color` | the tab's chevron / text color |
| `--SvCompanionTab-border-color` | the tab's border color |
