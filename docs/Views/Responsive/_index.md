# Responsive Views

Automatic viewport compaction, last-column stretching, and per-node width hooks without per-screen layout code.

## Overview

Responsive behavior in STRVCT is not a separate rendering mode or set of CSS breakpoints. The same master-detail composition that produces a multi-column Miller view on a wide desktop produces a one-column stack with breadcrumbs on a phone, because `SvStackView` measures available width and automatically collapses columns that would overflow the viewport.

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

## The Two Layout Mechanisms

### 1. Compaction (`compactNavAsNeeded`)
`SvStackView.compactNavAsNeeded()` walks the stack chain from outermost (leftmost) to innermost (rightmost), summing target widths against available viewport space (`topViewWidth()`):
- **Fits:** The column is `uncollapse()`d and displayed.
- **Overflows:** Earlier columns are `collapse()`d (`display: none`). The current (deepest) column stays visible as long as possible.

### 2. Last-Column Stretch (`updateWidthForWindow`)
`SvNavView.updateWidthForWindow()` determines width for visible columns:
- If `targetWidth() >= windowWidth`, the column takes `width: 100%`.
- If a column is the last visible column AND `windowWidth < targetWidth * 2`, it stretches to `width: 100%` to fill available slack instead of leaving dead space.

---

## Per-Node Layout Protocol Hooks

Domain nodes can influence layout without writing custom view code:

| Node Method | Purpose & Behavior |
|---|---|
| `nodeMinTileWidth()` | Declares a minimum tile width floor for the column. Useful for wide property inspectors. |
| `nodeFillsRemainingWidth()` | When `true`, forces the column to stretch to 100% width whenever it is the last visible column. Useful for document editors or chat logs. |

---

## Viewport vs Device Detection

- **`SvWebBrowserWindow.shared().width()`**: Returns current viewport width in CSS pixels. Always use this for layout and compaction decisions.
- **`SvWebBrowserWindow.shared().isOnMobile()`**: User-agent string match (iPhone/Android). Use *only* for touch-gesture or platform-specific permissions, never for column width sizing.

---

## iOS Safari Visual Viewport Note

On iPhone Safari, CSS `100vh` units fail to subtract the animated URL bar area (~40px overflow). The reliable fix is binding root page height to `window.visualViewport.height` during `visualViewport.resize` and `orientationchange` events.

---

## Related Guides

- [Auto-Generated Views](../Auto-Generated%20Views/index.html): Navigation containers and tiles.
- [Companion View](../Companion%20View/index.html): Space arbitration for docked companions.
