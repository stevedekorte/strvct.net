# Accessibility

Automatic, framework-level ARIA support, keyboard navigation, and preference adaptation derived from slot metadata annotations and view classes.

## Overview

STRVCT provides built-in accessibility support that works automatically for every application built on the framework. Because the UI is derived from model nodes through a small set of view classes, accessibility metadata is emitted at the framework level -- developers don't need to add ARIA attributes to individual components.

This is a direct consequence of the naked objects architecture. In a conventional web framework, accessibility is a per-component concern: every button, list, and form field needs manual ARIA attributes, and the cost scales linearly ($O(N)$) with the number of components. In STRVCT, the same $\sim$15 view classes render every application's UI, so fixing accessibility in those classes fixes it everywhere.

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
  <text x="470" y="95" class="dim">aria-description="Current character hit points"</text>

  <rect class="fill" x="455" y="115" width="320" height="30"/>
  <text x="470" y="135" class="dim">aria-readonly="true"</text>

  <rect class="fill" x="455" y="155" width="320" height="30"/>
  <text x="470" y="175" class="dim">aria-required="true"</text>

  <rect class="fill" x="455" y="195" width="320" height="30"/>
  <text x="470" y="215" class="dim">aria-valuemin="0" · aria-valuemax="999"</text>

  <text x="410" y="268" text-anchor="middle" class="dim">One declaration drives field validation, AI JSON tool schemas, and screen reader ARIA attributes.</text>
</svg>

---

## Why the Naked Objects Pattern Helps

Most frameworks require developers to manually add accessibility attributes to each component. STRVCT's architecture inverts this: since the framework generates views from the model, it can also generate accessibility metadata from the model -- automatically, in one place, for all applications.

- **The slot system already describes the data:** Slot metadata maps almost directly to ARIA attributes (`description()` $\rightarrow$ `aria-description`, `isReadOnly()` $\rightarrow$ `aria-readonly`, `isRequired()` $\rightarrow$ `aria-required`).
- **JSON Schema annotations serve double duty:** The same annotations that generate JSON Schema for AI tool calls also drive accessibility attributes. A slot configured with `setMinimum(0)` and `setMaximum(100)` emits both JSON Schema constraints for AI and `aria-valuemin="0"` / `aria-valuemax="100"` for screen readers. The investment in richer slot annotations directly improves both AI integration and accessibility.
- **The node hierarchy maps to ARIA patterns:** The tile/stack navigation model (drill in, drill out, select with arrows) maps naturally to ARIA roles (`SvTilesView` $\rightarrow$ `list`, `SvTile` $\rightarrow$ `link`, `SvFieldTile` $\rightarrow$ `group`, selected tile $\rightarrow$ `aria-current`).

---

## Implementation Details

### ARIA Roles

Each core view class emits an appropriate ARIA role:

| View Class | Role | Purpose |
|---|---|---|
| `SvTilesView` | `list` | Container for navigable tile items |
| `SvTile` | `link` | Individual navigation item in a list |
| `SvFieldTile` | `group` | Key-value field with label and value |
| `SvBooleanFieldTile` | `checkbox` | Toggle field with checked/unchecked state |
| `SvActionFieldTile` | `button` | Clickable action |
| `SvOptionsNodeTile` | `listbox` | Container for selectable options |
| `SvOptionNodeTile` | `option` | Individual selectable option |
| `SvStackView` | `navigation` | Top-level navigation landmark |
| `SvNavView` | `region` | Named content region |
| `SvBreadCrumbsTile` | `navigation` | Breadcrumb navigation with `aria-label="Breadcrumb"` |

---

## Labels and Descriptions

View classes derive ARIA labels from node metadata:

| Source | ARIA Usage | Rationale |
|---|---|---|
| `node.nodeAriaLabel()` | `aria-label` | `title()` by default; domain objects can override to provide a descriptive label for screen readers |
| `node.subtitle()` | `aria-description` | Subtitle text available on demand |
| `slot.description()` | `aria-description` | Detailed field-level description |
| Key view text | `aria-label` | Label on field tiles |

---

## Node-Level ARIA Overrides (`SvTitledNode`)

`SvTitledNode` provides methods that domain objects can override to customize accessibility behavior without modifying view code:

| Method | Default | Purpose |
|---|---|---|
| `nodeAriaLabel()` | `title()` | Label announced by screen readers |
| `nodeAriaRole()` | `null` (view's default) | Override the view class's default ARIA role |
| `nodeAriaIsReadOnly()` | `null` (from slot editability) | Override read-only state |
| `nodeAriaIsRequired()` | `null` (from slot `isRequired()`) | Override required state |
| `nodeAriaLive()` | `null` | Returns `"polite"` or `"assertive"` for dynamic live regions |

Returning `null` defers to the view's default behavior. Returning a value overrides it. This follows the same pattern as `setNodeViewClass()` -- the framework provides sensible defaults, and the domain object overrides when it knows better.

---

## State Tracking

ARIA states are updated dynamically through the framework's notification system:
- **`aria-current`** -- Set to `"true"` on the selected tile, removed when deselected. The selected tile also receives focus.
- **`aria-checked`** -- Updated on `SvBooleanFieldTile` when the boolean value changes.
- **`aria-selected`** -- Updated on `SvOptionNodeTile` based on `isPicked()` state.
- **`aria-disabled`** -- Set on `SvActionFieldTile` when the action's node is not enabled.
- **`aria-readonly`** -- Set on `SvFieldTile` when the field is not editable.

---

## Slot Metadata to ARIA Mapping (`syncAriaFromSlotMetadata`)

`SvFieldTile` includes a `syncAriaFromSlotMetadata()` method that reads slot annotations and emits corresponding ARIA attributes:

```javascript
{
    const slot = this.newSlot("hitPoints", 0);
    slot.setSlotType("Number");
    slot.setIsRequired(true);
    slot.setAnnotation("minimum", 0);
    slot.setAnnotation("maximum", 999);
    slot.setDescription("Current character hit points");
}
```

Produces a field tile with `aria-required="true"`, `aria-valuemin="0"`, `aria-valuemax="999"`, and `aria-description="Current character hit points"` -- with no accessibility-specific code from the developer.

---

## Live Regions

- **Opt-in via nodes:** Any node can declare itself as a live region by implementing `nodeAriaLive()` returning `"polite"` or `"assertive"`. When `SvTilesView` syncs from a node with this method, it sets `aria-live` on the container.
- **Direct on chat:** `SvChatMessageTile` sets `aria-live="polite"` directly, so new chat messages and AI responses are announced to screen readers as they arrive.

---

## Focus Management & Keyboard Navigation

- **Tiles are programmatically focusable** via `tabindex="-1"`. This makes them reachable by the framework's focus management without adding them to the Tab order.
- **Focus indicators** use `:focus-visible` styling (2px solid cornflower blue outline) that appears only for keyboard navigation, not mouse clicks.
- **High contrast mode** (`prefers-contrast: more`) increases the focus outline to 3px solid white for maximum visibility.
- **Focus follows selection** -- when a tile is selected, it receives both `aria-current="true"` and DOM focus, ensuring screen readers announce the newly selected item.

---

## Visual Accessibility & Motion Preferences

- **Reduced Motion (`prefers-reduced-motion: reduce`):** All animations and transitions are reduced to 0.01ms duration, iteration counts set to 1, and scroll behavior set to auto (instant).
- **High Contrast (`prefers-contrast: more`):** Focus indicators enhanced to 3px solid white with tighter offset.

---

## ARIA Landmarks

Landmark roles provide structural navigation for screen readers:
- `SvStackView` is marked as `navigation` -- the top-level navigation structure
- `SvNavView` is marked as `region` with an `aria-label` derived from the current node's title
- `SvBreadCrumbsTile` is marked as `navigation` with `aria-label="Breadcrumb"`

---

## WCAG 2.2 Compliance Matrix

| WCAG Criterion | How Addressed |
|---|---|
| **1.3.1 Info & Relationships** | ARIA roles and landmarks convey structure |
| **1.3.2 Meaningful Sequence** | DOM order matches visual order (flexbox layout) |
| **2.1.1 Keyboard** | Arrow keys, Enter, Escape for full navigation |
| **2.3.3 Animation from Interactions** | `prefers-reduced-motion` media query |
| **2.4.1 Bypass Blocks** | Landmark roles enable skip navigation |
| **2.4.6 Headings & Labels** | `aria-label` from node `title()` |
| **2.4.7 Focus Visible** | `:focus-visible` outline styling |
| **3.2.1 On Focus** | No context changes on focus |
| **4.1.2 Name, Role, Value** | ARIA roles, labels, and states on all interactive elements |

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
