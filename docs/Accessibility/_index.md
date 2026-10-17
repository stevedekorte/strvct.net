# Accessibility

Automatic, framework-level ARIA support, keyboard navigation, and preference adaptation derived from slot metadata annotations and view classes.

## Overview

STRVCT provides built-in accessibility support that works automatically for every application built on the framework. Because the UI is derived from model nodes through a small set of shared view classes, accessibility metadata is emitted at the framework level—developers don't need to manually add ARIA attributes to individual components.

In a conventional web framework, accessibility is a per-component concern: every button, list, and form field requires manual ARIA attributes, and maintenance costs scale linearly ($O(N)$) with screen count. In STRVCT, the same $\sim$15 view classes render every application's UI, so fixing accessibility in those shared primitives fixes it across every screen in every application.

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
    <marker id="aac" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <!-- Left: Slot Metadata Annotations -->
  <rect class="box" x="30" y="20" width="350" height="230"/>
  <text x="45" y="42" class="b">Slot Metadata Annotations</text>
  <text x="45" y="60" class="dim">Declared once in initPrototypeSlots()</text>

  <rect class="fill" x="45" y="75" width="320" height="30"/>
  <text x="60" y="95" class="dim">slot.description()</text>

  <rect class="fill" x="45" y="115" width="320" height="30"/>
  <text x="60" y="135" class="dim">slot.isReadOnly()</text>

  <rect class="fill" x="45" y="155" width="320" height="30"/>
  <text x="60" y="175" class="dim">slot.isRequired()</text>

  <rect class="fill" x="45" y="195" width="320" height="30"/>
  <text x="60" y="215" class="dim">slot.minimum() / slot.maximum()</text>

  <!-- Arrows -->
  <line class="flow" x1="380" y1="90" x2="440" y2="90" marker-end="url(#aac)"/>
  <line class="flow" x1="380" y1="130" x2="440" y2="130" marker-end="url(#aac)"/>
  <line class="flow" x1="380" y1="170" x2="440" y2="170" marker-end="url(#aac)"/>
  <line class="flow" x1="380" y1="210" x2="440" y2="210" marker-end="url(#aac)"/>

  <!-- Right: Generated ARIA Attributes -->
  <rect class="box" x="440" y="20" width="350" height="230"/>
  <text x="455" y="42" class="b">Framework ARIA Emitted</text>
  <text x="455" y="60" class="dim">Emitted by ~15 shared view classes</text>

  <rect class="fill" x="455" y="75" width="320" height="30"/>
  <text x="470" y="95" class="dim">aria-description="Current hit points"</text>

  <rect class="fill" x="455" y="115" width="320" height="30"/>
  <text x="470" y="135" class="dim">aria-readonly="true"</text>

  <rect class="fill" x="455" y="155" width="320" height="30"/>
  <text x="470" y="175" class="dim">aria-required="true"</text>

  <rect class="fill" x="455" y="195" width="320" height="30"/>
  <text x="470" y="215" class="dim">aria-valuemin="0" · aria-valuemax="999"</text>

  <text x="410" y="268" text-anchor="middle" class="dim">One declaration drives field validation, AI JSON tool schemas, and screen reader ARIA attributes.</text>
</svg>

---

## Slot Metadata to ARIA Mapping

`SvFieldTile` implements `syncAriaFromSlotMetadata()` to map slot metadata directly to ARIA attributes:

| Slot Annotation | ARIA Attribute | Description |
|---|---|---|
| `description()` | `aria-description` | Detailed field description announced on demand |
| `isReadOnly()` | `aria-readonly="true"` | Indicates whether value is editable |
| `isRequired()` | `aria-required="true"` | Indicates required form field |
| `slotType()` | `role="..."` | Informs control role (`checkbox`, `button`, `listbox`) |
| `minimum()` / `maximum()` | `aria-valuemin` / `aria-valuemax` | Value range bounds for numeric fields |

### Example Slot Declaration:

```javascript
{
    const slot = this.newSlot("hitPoints", 10);
    slot.setSlotType("Number");
    slot.setIsRequired(true);
    slot.setAnnotation("minimum", 0);
    slot.setAnnotation("maximum", 999);
    slot.setDescription("Current character hit points");
}
```

Produces a field tile emitting `aria-required="true"`, `aria-valuemin="0"`, `aria-valuemax="999"`, and `aria-description="Current character hit points"` without custom accessibility code.

---

## View Class ARIA Roles & Landmarks

| STRVCT View Class | ARIA Role | Purpose & Landmark Usage |
|---|---|---|
| `SvStackView` | `navigation` | Top-level navigation landmark container |
| `SvNavView` | `region` | Named column region (`aria-label` from node title) |
| `SvTilesView` | `list` | Container for navigable tile items |
| `SvTile` | `link` | Individual navigation item in a list |
| `SvFieldTile` | `group` | Key-value field with label and control |
| `SvBooleanFieldTile` | `checkbox` | Toggle field emitting `aria-checked` |
| `SvActionFieldTile` | `button` | Clickable action emitting `aria-disabled` |
| `SvOptionsNodeTile` | `listbox` | Container for selectable options |
| `SvOptionNodeTile` | `option` | Individual option emitting `aria-selected` |
| `SvBreadCrumbsTile` | `navigation` | Breadcrumb trail (`aria-label="Breadcrumb"`) |

---

## Node-Level ARIA Overrides (`SvTitledNode`)

Domain models can override default ARIA properties by implementing protocol hooks on `SvTitledNode`:

| Protocol Method | Default | Purpose |
|---|---|---|
| `nodeAriaLabel()` | `title()` | Label announced by screen readers |
| `nodeAriaRole()` | `null` (view default) | Custom role override |
| `nodeAriaIsReadOnly()` | `null` (slot editability) | Read-only state override |
| `nodeAriaIsRequired()` | `null` (slot required) | Required state override |
| `nodeAriaLive()` | `null` | Returns `"polite"` or `"assertive"` for dynamic live regions |

---

## Focus Management & Keyboard Navigation

- **Tile Focusability:** Tiles use `tabindex="-1"`, making them focusable programmatically without cluttering the global browser Tab order.
- **Focus Follows Selection:** When a tile is selected, `SvTilesView` sets `aria-current="true"` and moves DOM focus to the tile.
- **Keyboard Navigation:** Arrow keys navigate tiles in columns; `Enter` opens subnode details; `Escape` moves focus up to the parent column.
- **Focus Indicators:** Styled using `:focus-visible` (2px solid cornflower blue outline). High-contrast mode (`prefers-contrast: more`) increases outlines to 3px solid white.

---

## Visual Accessibility & Motion Preferences

- **Reduced Motion (`prefers-reduced-motion: reduce`):** Animations and transitions are reduced to `0.01ms`, scroll behavior switches to `auto` (instant), and iteration counts lock to 1.
- **High Contrast (`prefers-contrast: more`):** Focus outlines increase to 3px solid white with tighter offsets.

---

## WCAG 2.2 Compliance Matrix

| WCAG Criterion | Implementation Mechanism |
|---|---|
| **1.3.1 Info & Relationships** | ARIA roles and landmarks convey structure |
| **1.3.2 Meaningful Sequence** | DOM order matches visual flexbox order |
| **2.1.1 Keyboard** | Full keyboard support (Arrows, Enter, Escape) |
| **2.3.3 Animation from Interactions** | `prefers-reduced-motion` media query override |
| **2.4.1 Bypass Blocks** | Landmark roles enable screen reader region jumping |
| **2.4.6 Headings & Labels** | `aria-label` derived from node `title()` |
| **2.4.7 Focus Visible** | Distinct `:focus-visible` outlines |
| **4.1.2 Name, Role, Value** | Automated ARIA roles, labels, and states across all tiles |

---

## Files Modifying Accessibility

| File | Responsibilities |
|---|---|
| `_css.css` | `:focus-visible` styling, `prefers-reduced-motion`, `prefers-contrast` |
| `SvTilesView.js` | `role="list"`, `aria-label`, opt-in `aria-live` |
| `SvTile.js` | `role="link"`, `tabindex="-1"`, `aria-label`, `aria-description`, `aria-current` |
| `SvFieldTile.js` | `role="group"`, `aria-label`, `aria-readonly`, `syncAriaFromSlotMetadata()` |
| `SvBooleanFieldTile.js` | `role="checkbox"`, `aria-checked` |
| `SvActionFieldTile.js` | `role="button"`, `aria-label`, `aria-disabled` |
| `SvOptionsNodeTile.js` | `role="listbox"` |
| `SvOptionNodeTile.js` | `role="option"`, `aria-selected` |
| `SvChatMessageTile.js` | `aria-live="polite"` |
| `SvStackView.js` | `role="navigation"` |
| `SvNavView.js` | `role="region"`, `aria-label` |
| `SvBreadCrumbsTile.js` | `role="navigation"`, `aria-label="Breadcrumb"`, `aria-current="location"` |

---

## Related Guides

- [Nodes](../Nodes/index.html): Core `SvNode` domain abstraction.
- [Slots](../Slots/index.html): Complete guide to slot metadata and declarations.
