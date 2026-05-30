# Diagram Conventions

Style and layout rules for the SVG diagrams used throughout the Strvct docs.

## Why a Convention

The docs use ~30 inline SVG diagrams to visualize architecture, flows, and relationships. Without a shared style they drift apart, become harder to scan, and require per-page mental re-orientation. The rules below let any diagram be authored, edited, or scripted against the same set of expectations.

## Style Block

Every diagram opens with the same `<style>` block:

```svg
<style>
  text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
  .b { font-weight: 600; }
  .dim { fill: #666; }
  .box { fill: none; stroke: #111; stroke-width: 1; }
  .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
  .flow { stroke: #111; stroke-width: 1; fill: none; }
  .flow-dashed { stroke: #111; stroke-width: 1; fill: none; stroke-dasharray: 4 3; }
</style>
```

- **`.b`** — bold text (titles, labels)
- **`.dim`** — secondary text (descriptions, captions); color `#666`
- **`.box`** — outline rectangle, no fill; used for outer containers
- **`.fill`** — cream-filled rectangle (`#f0ede5`); used for inner content blocks
- **`.flow`** — solid line for direct references / calls / direct data flow
- **`.flow-dashed`** — dashed line (`4 3`) for indirect notifications, observers, no-direct-reference relationships

## Arrowhead Markers

A single arrowhead marker is defined per diagram in `<defs>`, with a unique id (e.g., `ato`, `aio`, `anc`):

```svg
<defs>
  <marker id="xxx" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
    <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
  </marker>
</defs>
```

Lines reference it via `marker-end="url(#xxx)"`.

## ViewBox

- **Width**: 820 (matches the docs column width)
- **Height**: tight to content with ~20px bottom margin below the last element

## Layout Rules

### Inside fill rects

Content is **left-top justified** with consistent padding:

- **Text x** = `fill.x + 15` (15px left padding)
- **First text baseline y** = `fill.y + 20`
- **Subsequent lines** spaced 18px apart
- **Bottom padding** = 11px (cap-top above first baseline matches descender-bottom below last baseline). Concretely: `fill.h = (last_text_y - fill.y) + 14`.

### Stacking fill rects

Vertically adjacent fill rects in the same column should sit **15px apart** when they're sibling rows in a list. Larger gaps (~30px) are appropriate when an arrow + label lives between them.

For centered stacks (rects whose horizontal centers align around `viewBox.width / 2`), give all rects the same width — use the maximum needed by any row's content, centered.

### Inside .box containers

Containers wrap one or more `.fill` rects plus optional title/subtitle text and caption text below the fills.

- **Container title (b)** at `container.x + 15`, `container.y + 22`
- **Container subtitle (dim)** at `container.x + 15`, `container.y + 42` (when present)
- **Inner fills** at `container.x + 15`, `container.y + 60+` (with 15px horizontal padding from container edges)
- **Captions below last fill** are left-justified at `container.x + 15`, starting at `last_fill_bottom + 24`, with 18px line spacing
- **Container bottom padding** = 15px below the lowest content element

### Multi-column layouts

For 2- and 3-column comparisons, each column's containers should be the same width and aligned at the top (`y=20`). Container heights should match (use the tallest column's height). Captions inside columns are still left-justified to their column.

## Lines and Arrows

- **Solid line** (`.flow`) — direct reference or call (e.g., a UI view calling getter/setter on its model node)
- **Dashed line** (`.flow-dashed`) — indirect notification or observation (e.g., the model posts a notification, observers pick it up without holding a reference)
- **Arrow direction** points to the *recipient* of the action

For the Model ↔ UI ↔ Storage triple, mutation notifications from Model outward are **dashed** (Model holds no references); UI/Storage calls into Model are **solid** (they hold direct references).

## Two-line Arrow Labels

When labeling a line in a tight gap:

- **For label above the line**: two text elements at `arrow_y - 22` and `arrow_y - 7`
- **For label below the line**: two text elements at `arrow_y + 13` and `arrow_y + 28`
- All centered with `text-anchor="middle"` at the gap midpoint x

## Captions and Footnotes

The summary line below a diagram is **left-justified** at the same x as the leftmost container (when there is one) or `container.x + 15`. Do not center such lines.

## When to Break the Conventions

The conventions exist to keep diagrams scannable, not to be rigid. Acceptable deviations:

- A diagram showing a state machine or a network graph won't use stacked fills at all
- A side-by-side comparison may need asymmetric heights when content lengths differ enough that padding the shorter side would look strange
- Inline annotations (e.g., a small "(weak ref)" label between two boxes) can sit at any x

When in doubt, prefer consistency with adjacent diagrams in the same page or section.
