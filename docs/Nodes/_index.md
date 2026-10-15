# Nodes

The core domain object abstraction, object graph hierarchy, and subnode management in Strvct.

## Overview

Nodes (`SvNode`) are the fundamental domain abstraction in Strvct. Every piece of application state—a document, a user profile, a RPG character sheet, a project folder, or a settings item—is represented as an object inheriting from `SvNode`.

Nodes form a **hierarchical object graph**: every node holds an ordered array of child `subnodes` and a reference to its `parentNode`. The framework automatically derives the complete user interface from this object graph without hand-authored UI components.

<svg viewBox="0 0 820 400" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="and" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <!-- 3 Rows of 2 Uniform Boxes (w: 345, h: 50) -->
  <!-- Row 1 -->
  <rect class="fill" x="40" y="20" width="345" height="50"/>
  <text x="55" y="38" class="b">SvNode</text>
  <text x="55" y="56" class="dim">Subnode tree &amp; parent relationships</text>

  <line class="flow" x1="385" y1="45" x2="435" y2="45" marker-end="url(#and)"/>

  <rect class="fill" x="435" y="20" width="345" height="50"/>
  <text x="450" y="38" class="b">SvTitledNode</text>
  <text x="450" y="56" class="dim">Title, subtitle, &amp; path labels</text>

  <!-- Flow to Row 2 -->
  <line class="flow" x1="607" y1="70" x2="607" y2="85"/>
  <line class="flow" x1="212" y1="85" x2="607" y2="85"/>
  <line class="flow" x1="212" y1="85" x2="212" y2="100" marker-end="url(#and)"/>

  <!-- Row 2 -->
  <rect class="fill" x="40" y="100" width="345" height="50"/>
  <text x="55" y="118" class="b">SvInspectableNode</text>
  <text x="55" y="136" class="dim">Property Inspector field generation</text>

  <line class="flow" x1="385" y1="125" x2="435" y2="125" marker-end="url(#and)"/>

  <rect class="fill" x="435" y="100" width="345" height="50"/>
  <text x="450" y="118" class="b">SvViewableNode</text>
  <text x="450" y="136" class="dim">View class resolution &amp; tile layout</text>

  <!-- Flow to Row 3 -->
  <line class="flow" x1="607" y1="150" x2="607" y2="165"/>
  <line class="flow" x1="212" y1="165" x2="607" y2="165"/>
  <line class="flow" x1="212" y1="165" x2="212" y2="180" marker-end="url(#and)"/>

  <!-- Row 3 -->
  <rect class="fill" x="40" y="180" width="345" height="50"/>
  <text x="55" y="198" class="b">SvStorableNode</text>
  <text x="55" y="216" class="dim">Persistence &amp; dirty tracking</text>

  <line class="flow" x1="385" y1="205" x2="435" y2="205" marker-end="url(#and)"/>

  <rect class="fill" x="435" y="180" width="345" height="50"/>
  <text x="450" y="198" class="b">SvSummaryNode</text>
  <text x="450" y="216" class="dim">Base class for application domain models</text>

  <text x="410" y="260" text-anchor="middle" class="dim">Each node class level adds an isolated capability. Application domain models typically extend SvSummaryNode or SvStorableNode.</text>
</svg>

---

## The Node Inheritance Chain

| Class Name | Key Capability Added | Usage |
|---|---|---|
| `SvNode` | Subnode management, parent/owner references | Root base class |
| `SvTitledNode` | Title, subtitle, note, ARIA accessibility, navigation path | Labeled nodes |
| `SvTranslatableNode` | Per-node translation string cache for i18n | Internationalization |
| `SvInspectableNode` | Property Inspector field generation from slot metadata | Live debugging |
| `SvViewableNode` | View class selection, layout orientation, tile settings | Visual UI presentation |
| `SvStyledNode` | Theme class name resolution | Programmatic styling |
| `SvStorableNode` | Persistence dirty tracking & IndexedDB serialization | Persistent models |
| `SvSummaryNode` | Configurable summary tile formatting | Standard app model base |

---

## Subnode Operations

The primary structural relationship in Strvct is the parent-child node tree managed via `subnodes()`:

```javascript
// Adding subnodes
parentNode.addSubnode(childNode);
parentNode.addSubnodeAt(childNode, 0);

// Querying subnodes
parentNode.subnodeCount();
parentNode.subnodeAt(index);
parentNode.hasSubnode(childNode);

// Removing subnodes
parentNode.removeSubnode(childNode);

// Reordering subnodes
parentNode.moveSubnodesToIndex([nodeA, nodeB], 2);
```

When `addSubnode()` or `removeSubnode()` is called, the node automatically posts a change notification (`"didChangeSubnodes"`), causing active views (`SvNavView`, `SvTilesView`) to update smoothly without manual page refreshes.

---

## Related Guides

- [Slots](../Slots/): Complete guide to property slots and metadata.
- [Technical Overview](../Technical%20Overview/): High-level system architecture.
