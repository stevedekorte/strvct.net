# Companion View

A persistent secondary context docked alongside a node's navigation, collapsing behind an edge handle or disappearing as the viewport narrows.

## Overview

A **companion** is a secondary region the view layer displays alongside a node's primary master-detail navigation: a chat panel beside a gaming session, a property inspector beside a document editor, or a reference pane beside a campaign tree.

Unlike popovers or modal drawers, a docked companion lives in normal layout flow: it reserves real layout space, causing adjacent navigation columns to compact smoothly without obscuring content.

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
    <marker id="acm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="box" x="25" y="20" width="770" height="240"/>
  <text x="40" y="42" class="b">SvStackView / SvDetailView Layout Container</text>

  <!-- Left: Navigation Stack -->
  <rect class="box" x="40" y="60" width="460" height="180"/>
  <text x="55" y="80" class="b">Primary Navigation Subchain (SvStackView)</text>

  <rect class="fill" x="55" y="95" width="200" height="130"/>
  <text x="70" y="115" class="b">SvNavView (Master)</text>
  <text x="70" y="135" class="dim">• Column 1 Tiles</text>
  <text x="70" y="155" class="dim">• Column 2 Tiles</text>

  <rect class="fill" x="270" y="95" width="215" height="130"/>
  <text x="285" y="115" class="b">SvNavView (Detail)</text>
  <text x="285" y="135" class="dim">• Selected Node Tiles</text>

  <!-- Inset Handle -->
  <line class="flow" x1="510" y1="60" x2="510" y2="240"/>
  <rect class="fill" x="502" y="130" width="16" height="40"/>
  <text x="506" y="155" class="b">⋮</text>

  <!-- Right: Docked Companion -->
  <rect class="fill" x="525" y="60" width="250" height="180"/>
  <text x="540" y="80" class="b">SvCompanionView</text>
  <text x="540" y="100" class="dim">node = nodeCompanionNode()</text>
  <rect class="box" x="540" y="115" width="220" height="110"/>
  <text x="555" y="135" class="b">Embedded SvBrowserView</text>
  <text x="555" y="155" class="dim">Isolated Navigation Context</text>
  <text x="555" y="175" class="dim">(handlesGlobalNav = false)</text>
</svg>

---

## Model-View Boundary Protocol (`nodeCompanionNode`)

A domain node opts into displaying a companion by answering the optional protocol method:

```javascript
nodeCompanionNode () {
    return this.someOwnedCompanionNode(); // returns the companion root node, or null for none
}
```

The node specifies *which* node to show alongside itself, but zero UI details: width, axis, pinning, and collapse state are managed entirely by the view layer. This maintains strict headless testability.

---

## The Three Display States

| State | Visual Behavior | Space Allocation |
|---|---|---|
| **`docked`** | Panel is expanded alongside or beneath navigation columns. | Reserves full length (`companionReservedWidth()`); columns compact to fit. |
| **`tab`** | Panel is collapsed into a zero-width tab handle. | Panel occupies 0px. Adjacent `SvNavView` displays expansion handle. |
| **`hidden`** | Panel and handle are both suppressed. | Viewport is too narrow to offer companion without breaking primary content. |

---

## Space Arbitration & Keyboard Shortcuts

`SvDetailView` arbitrates layout space using `setAvailableLength()`:

- **Threshold Check:** If available width falls below `tabLength`, mode switches to `hidden`.
- **User Pinning:** Clicking the edge handle toggles between `docked` and `tab`, persisting the choice as `userMode`.
- **Shortcut:** Pressing **Meta+\\** (Cmd+\\ or Ctrl+\\) toggles the deepest visible companion in the active navigation chain.

---

## View Class Structure

```
SvStackView
 └─ SvDetailView                       (owns space arbitration)
     ├── childStackView                (primary flexible navigation)
     └── SvCompanionView              (node = nodeCompanionNode())
         ├── contentView              (embedded isolated SvBrowserView)
         ├── SvEdgeHandleView         (collapse/expand handle)
         └── SvCompanionTabView       (internal badge plumbing)
```

---

## Theming & CSS Variables

| CSS Variable | Applies To |
|---|---|
| `--SvCompanion-bg` | Companion panel background color |
| `--SvCompanionTab-color` | Legacy tab text styling |
| `--SvCompanionTab-border-color` | Legacy tab border color |

---

## Related Guides

- [Responsive Views](../Responsive/index.html): Viewport compaction and column collapse.
- [Auto-Generated Views](../Auto-Generated%20Views/index.html): Miller column stack containers.
