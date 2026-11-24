# Responsive Views

Automatic column compaction, last-column stretching, and per-node width hooks, without per-screen layout code.

## Overview

Responsive behavior in STRVCT is not a separate rendering mode or set of CSS breakpoints. The same master-detail composition that produces a multi-column Miller view on a wide desktop produces a one-column stack with breadcrumbs on a phone, because each column states what it needs and one allocation over the whole chain hides the columns that would overflow.

This behavior—**automatic collapsing**—falls out of the same primitives used for navigation at any width; there is zero separate "mobile" code path in the view hierarchy.

<svg viewBox="0 0 820 320" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="are" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <!-- Desktop Wide Viewport (Left) -->
  <rect class="box" x="25" y="20" width="360" height="240"/>
  <text x="40" y="42" class="b">Wide Desktop Viewport (&gt; 800px)</text>

  <rect class="fill" x="40" y="60" width="100" height="180"/>
  <text x="48" y="80" class="b">Column 1</text>
  <text x="48" y="98" class="dim">Expanded</text>

  <rect class="fill" x="150" y="60" width="100" height="180"/>
  <text x="158" y="80" class="b">Column 2</text>
  <text x="158" y="98" class="dim">Expanded</text>

  <rect class="fill" x="260" y="60" width="110" height="180"/>
  <text x="268" y="80" class="b">Column 3</text>
  <text x="268" y="98" class="dim">Expanded</text>

  <!-- Transition Arrow -->
  <line class="flow" x1="395" y1="140" x2="425" y2="140" marker-end="url(#are)"/>

  <!-- Mobile Narrow Viewport (Right) -->
  <rect class="box" x="435" y="20" width="360" height="240"/>
  <text x="450" y="42" class="b">Narrow Mobile Viewport (&lt; 480px)</text>

  <rect class="fill" x="450" y="60" width="330" height="30"/>
  <text x="465" y="80" class="b">Breadcrumbs: Workspace &gt; Projects</text>

  <rect class="fill" x="450" y="100" width="330" height="140"/>
  <text x="465" y="120" class="b">Column 3 (Active Column - 100% Width)</text>
  <text x="465" y="140" class="dim">Columns 1 &amp; 2 auto-collapsed (display: none)</text>
</svg>

---

## Claims and One Allocation

Each level of a browser's chain states a **claim**: a small record of plain values that says what it needs, such as the width it asks for, whether it fills the width left over, and how much its companion or anchored panes reserve (`SvStackView.layerClaim()`). The root hands every claim in the chain, with the root's width, to `SvLayerAllocation`, which uses no DOM and no views. It answers for each level whether it is hidden and which width rule it takes. Each column applies its own answer in one place (`SvNavView.applyLayerAnswer()`).

The rules, each held by a check in `tests/headless/TestLayerAllocation.js`:

- **Which columns show.** A column's sum is its own target plus every target and reservation after it. A column is shown while its sum is less than the width the chain must fit in, and hidden otherwise, so columns give way from the root end and the deepest stays longest. A column that fills is always shown; a level laid out downward is never hidden.
- **How wide.** A column that fills takes the width left over. A column whose target is at least the available width takes all of it, and so does the last column when it has less than twice its target to fit in, so a narrow window leaves no dead space. Any other column is exactly its target. A target is capped one pixel short of the available width.
- **An inline document or a grid** (a node whose `nodeChildrenLayout()` is `"inline"` or `"grid"`) fills whenever it is shown, not only when it is last, and is hidden by the same test as any other column.

**When a pass runs.** A pass runs only when something it depends on has changed: the root's width, which stacks make up the chain and whether each is on the page, or a level's claim. The root keeps the signature of its last pass and skips one that would change nothing, so an ordinary node update, such as a streamed chat chunk, costs nothing. Widths are read once per pass from cached measurements, never after a write.

The design, its history and the measurements are in [Compaction Coordinator](../../Plans/Compaction%20Coordinator/index.html).

---

## Per-Node Layout Hooks

Domain nodes can influence layout without writing custom view code:

| Node Method | Purpose & Behavior |
|---|---|
| `nodeMinTileWidth()` | The width the node's column asks for (its target). The default target is 270px; a column whose tiles show thumbnails adds room for them. |
| `nodeFillsRemainingWidth()` | When `true`, the column stretches to take the width left over whenever it is the last visible column. Useful for document editors or chat logs. |
| `nodeChildrenLayout()` | `"inline"` draws the children within the node's own column, as a document; `"grid"` draws them as cells that wrap at the column's edge (at least `nodeChildrenTileWidth()` wide). Either way the column fills whenever it is shown. |

---

## Viewport vs Device Detection

- **`SvWebBrowserWindow.shared().width()`**: Returns current viewport width in CSS pixels. Use it for layout decisions in views. (Compaction itself uses the root's own width, so a browser embedded in a panel compacts to the panel, not the window.)
- **`SvWebBrowserWindow.shared().isOnMobile()`**: User-agent string match (iPhone/Android). Use *only* for touch-gesture or platform-specific permissions, never for column width sizing.

---

## iOS Safari Visual Viewport Note

On iPhone Safari, CSS `100vh` units fail to subtract the animated URL bar area (~40px overflow). The reliable fix is binding root page height to `window.visualViewport.height` during `visualViewport.resize` and `orientationchange` events.

---

## Related Guides

- [Auto-Generated Views](../Auto-Generated%20Views/index.html): Navigation containers and tiles.
- [Companion View](../Companion%20View/index.html): Space arbitration for docked companions.
