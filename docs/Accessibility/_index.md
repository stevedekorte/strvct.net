# Accessibility

Automatic, framework-level ARIA support derived from the naked objects pattern.

## Overview

STRVCT provides built-in accessibility support that works automatically for every application built on the framework. Because the UI is generated from model nodes through a small set of view classes, accessibility metadata is emitted at the framework level -- developers don't need to add ARIA attributes to individual components.

This is a direct consequence of the naked objects architecture. In a conventional web framework, accessibility is a per-component concern: every button, list, and form field needs manual ARIA attributes, and the cost scales linearly with the number of components. In STRVCT, the same ~15 view classes render every application's UI, so fixing accessibility in those classes fixes it everywhere.

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
    <marker id="aac" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>
  <rect class="box" x="40" y="20" width="350" height="320"/>
  <text x="55" y="42" class="b">Slot annotations</text>
  <text x="55" y="62" class="dim">declared once in initPrototypeSlots()</text>
  <rect class="fill" x="55" y="80" width="320" height="35"/>
  <text x="215" y="103" text-anchor="middle" class="dim">slot.description()</text>
  <rect class="fill" x="55" y="125" width="320" height="35"/>
  <text x="215" y="148" text-anchor="middle" class="dim">slot.isReadOnly()</text>
  <rect class="fill" x="55" y="170" width="320" height="35"/>
  <text x="215" y="193" text-anchor="middle" class="dim">slot.isRequired()</text>
  <rect class="fill" x="55" y="215" width="320" height="35"/>
  <text x="215" y="238" text-anchor="middle" class="dim">slot.slotType()</text>
  <rect class="fill" x="55" y="260" width="320" height="35"/>
  <text x="215" y="283" text-anchor="middle" class="dim">slot.minimum() · slot.maximum()</text>
  <line class="flow" x1="390" y1="97" x2="430" y2="97" marker-end="url(#aac)"/>
  <line class="flow" x1="390" y1="142" x2="430" y2="142" marker-end="url(#aac)"/>
  <line class="flow" x1="390" y1="187" x2="430" y2="187" marker-end="url(#aac)"/>
  <line class="flow" x1="390" y1="232" x2="430" y2="232" marker-end="url(#aac)"/>
  <line class="flow" x1="390" y1="277" x2="430" y2="277" marker-end="url(#aac)"/>
  <rect class="box" x="430" y="20" width="350" height="320"/>
  <text x="445" y="42" class="b">ARIA attributes</text>
  <text x="445" y="62" class="dim">emitted by the framework's ~15 view classes</text>
  <rect class="fill" x="445" y="80" width="320" height="35"/>
  <text x="605" y="103" text-anchor="middle" class="dim">aria-description</text>
  <rect class="fill" x="445" y="125" width="320" height="35"/>
  <text x="605" y="148" text-anchor="middle" class="dim">aria-readonly</text>
  <rect class="fill" x="445" y="170" width="320" height="35"/>
  <text x="605" y="193" text-anchor="middle" class="dim">aria-required</text>
  <rect class="fill" x="445" y="215" width="320" height="35"/>
  <text x="605" y="238" text-anchor="middle" class="dim">role  (button, list, ...)</text>
  <rect class="fill" x="445" y="260" width="320" height="35"/>
  <text x="605" y="283" text-anchor="middle" class="dim">aria-valuemin · aria-valuemax</text>
  <text x="410" y="370" text-anchor="middle" class="dim">The same annotations also generate JSON Schema for AI tool calls; one declaration drives accessibility, validation, and AI integration.</text>
</svg>

## Why the Naked Objects Pattern Helps

Most frameworks require developers to manually add accessibility attributes to each component. STRVCT's architecture inverts this: since the framework generates views from the model, it can also generate accessibility metadata from the model -- automatically, in one place, for all applications.

**The slot system already describes the data.** Slot metadata maps almost directly to ARIA attributes:

| Slot metadata | ARIA attribute |
|---|---|
| `description()` | `aria-description` |
| `isReadOnly()` | `aria-readonly` |
| `isRequired()` | `aria-required` |
| `slotType()` | informs the appropriate `role` |

**JSON Schema annotations serve double duty.** The same annotations that generate JSON Schema for AI tool calls also drive accessibility attributes. A slot with `setMinimum(0)` and `setMaximum(100)` emits both JSON Schema constraints for AI and `aria-valuemin="0"` / `aria-valuemax="100"` for screen readers. The investment in richer slot annotations directly improves both AI integration and accessibility.

**The node hierarchy maps to ARIA patterns.** The tile/stack navigation model (drill in, drill out, select with arrows) maps naturally to ARIA roles:

| STRVCT concept | ARIA role |
|---|---|
| `SvTilesView` | `list` |
| `SvTile` | `link` |
| `SvFieldTile` | `group` |
| Selected tile | `aria-current` |

**Every new application inherits it.** When a developer creates a new `SvNode` subclass with slots, the framework automatically generates views with correct ARIA roles, labels, states, and metadata-derived attributes. No accessibility code required.

## Implementation

### ARIA Roles

Each core view class emits an appropriate ARIA role:

| View class | Role | Purpose |
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

### Labels and Descriptions

View classes derive ARIA labels from node metadata:

| Source | ARIA usage |
|---|---|
| `node.nodeAriaLabel()` | `aria-label` on tiles, tile lists, and navigation regions |
| `node.subtitle()` | `aria-description` on tiles |
| `slot.description()` | `aria-description` on field tiles |
| Key view text | `aria-label` on field tiles |

`nodeAriaLabel()` is defined on `SvTitledNode` and returns `title()` by default. Domain objects can override it to provide a more descriptive label for screen readers without affecting the visible UI title. `subtitle()` and slot `description()` provide longer detail available on demand.

### Node-Level ARIA Overrides

`SvTitledNode` provides methods that domain objects can override to customize accessibility behavior without modifying view code:

| Method | Default | Purpose |
|---|---|---|
| `nodeAriaLabel()` | `title()` | Label announced by screen readers |
| `nodeAriaRole()` | `null` (view's default) | Override the view class's default ARIA role |
| `nodeAriaIsReadOnly()` | `null` (from slot editability) | Override read-only state |
| `nodeAriaIsRequired()` | `null` (from slot `isRequired()`) | Override required state |

Returning `null` from `nodeAriaRole()`, `nodeAriaIsReadOnly()`, or `nodeAriaIsRequired()` defers to the view's default behavior. Returning a value overrides it. This follows the same pattern as `setNodeViewClass()` -- the framework provides sensible defaults, the domain object overrides when it knows better.

### State Tracking

ARIA states are updated dynamically through the framework's notification system:

- **`aria-current`** -- Set to `"true"` on the selected tile, removed when deselected. The selected tile also receives focus.
- **`aria-checked`** -- Updated on `SvBooleanFieldTile` when the boolean value changes.
- **`aria-selected`** -- Updated on `SvOptionNodeTile` based on `isPicked()` state.
- **`aria-disabled`** -- Set on `SvActionFieldTile` when the action's node is not enabled.
- **`aria-readonly`** -- Set on `SvFieldTile` when the field is not editable.

### Slot Metadata to ARIA

`SvFieldTile` includes a `syncAriaFromSlotMetadata()` method that reads slot annotations and emits corresponding ARIA attributes:

| Slot annotation | ARIA attribute |
|---|---|
| `isRequired()` | `aria-required="true"` |
| `getAnnotation("minimum")` | `aria-valuemin` |
| `getAnnotation("maximum")` | `aria-valuemax` |
| `description()` | `aria-description` |

This wiring means that any slot configured with validation constraints automatically exposes those constraints to assistive technology. For example, a slot defined as:

```javascript
{
    const slot = this.newSlot("hitPoints", 0);
    slot.setSlotType("Number");
    slot.setIsRequired(true);
    slot.setAnnotation("minimum", 0);
    slot.setAnnotation("maximum", 999);
    slot.setDescription("Current hit points");
}
```

...produces a field tile with `aria-required="true"`, `aria-valuemin="0"`, `aria-valuemax="999"`, and `aria-description="Current hit points"` -- with no accessibility-specific code from the developer.

### Live Regions

Live regions announce dynamic content changes to screen readers without requiring focus.

**Opt-in via nodes:** Any node can declare itself as a live region by implementing `nodeAriaLive()` returning `"polite"` or `"assertive"`. When `SvTilesView` syncs from a node with this method, it sets `aria-live` on the container. This is useful for status displays, notification lists, and progress indicators.

**Direct on chat:** `SvChatMessageTile` sets `aria-live="polite"` directly, so new chat messages and AI responses are announced to screen readers as they arrive.

### Breadcrumb Navigation

`SvBreadCrumbsTile` implements the ARIA breadcrumb pattern:

- Container has `role="navigation"` and `aria-label="Breadcrumb"`
- The last crumb (current location) is marked with `aria-current="location"`
- Screen readers announce the breadcrumb trail as "Breadcrumb navigation" with the current item identified as "current location"

### Focus Management

- **Tiles are programmatically focusable** via `tabindex=-1`. This makes them reachable by the framework's focus management without adding them to the Tab order.
- **Focus indicators** use `:focus-visible` styling (2px solid cornflower blue outline) that appears only for keyboard navigation, not mouse clicks.
- **High contrast mode** (`prefers-contrast: more`) increases the focus outline to 3px solid white for maximum visibility.
- **Focus follows selection** -- when a tile is selected, it receives both `aria-current="true"` and DOM focus, ensuring screen readers announce the newly selected item.

### Visual Accessibility

The framework's global CSS includes media query support for visual accessibility preferences:

**Reduced motion** (`prefers-reduced-motion: reduce`):
- All animations reduced to 0.01ms duration
- All transitions reduced to 0.01ms duration
- Animation iteration counts set to 1
- Scroll behavior set to auto (instant)

**High contrast** (`prefers-contrast: more`):
- Focus indicators enhanced to 3px solid white with tighter offset
- Provides stronger visual distinction for keyboard navigation

### ARIA Landmarks

Landmark roles provide structural navigation for screen readers:

- `SvStackView` is marked as `navigation` -- the top-level navigation structure
- `SvNavView` is marked as `region` with an `aria-label` derived from the current node's title
- `SvBreadCrumbsTile` is marked as `navigation` with `aria-label="Breadcrumb"`

Screen reader users can use landmark navigation (e.g., VoiceOver's VO+U landmarks menu) to jump between these regions.

## WCAG 2.2 Compliance

The implementation targets WCAG 2.2 Level AA, which covers the requirements of most accessibility legislation (ADA, EAA, Section 508).

### Criteria Addressed

| WCAG Criterion | How addressed |
|---|---|
| 1.3.1 Info and Relationships | ARIA roles and landmarks convey structure |
| 1.3.2 Meaningful Sequence | DOM order matches visual order (flexbox layout) |
| 2.1.1 Keyboard | Arrow keys, Enter, Escape for full navigation |
| 2.3.3 Animation from Interactions | `prefers-reduced-motion` media query |
| 2.4.1 Bypass Blocks | Landmark roles enable skip navigation |
| 2.4.6 Headings and Labels | `aria-label` from node `title()` |
| 2.4.7 Focus Visible | `:focus-visible` outline styling |
| 3.2.1 On Focus | No context changes on focus |
| 4.1.2 Name, Role, Value | ARIA roles, labels, and states on all interactive elements |

### Remaining for Full AA Compliance

See [Accessibility Testing & Tuning](Future%20Work/Accessibility%20Testing%20%26%20Tuning/) for details on remaining testing and tuning work, including VoiceOver validation, cross-screen-reader testing, focus management refinements, and per-application adjustments.

## Design Decisions

### ARIA Roles vs. Semantic Elements

ARIA roles on div elements are equivalent to semantic HTML from the screen reader's perspective. Since STRVCT already handles keyboard activation and focus management on tiles, the native behaviors that semantic elements provide (space/Enter activation, default tab order) are redundant. Using ARIA attributes on existing div elements avoids disrupting existing CSS selectors and layout behavior.

### Default Roles from View Classes

Default roles come from the view class, not the node, because the same node can appear in multiple views with different roles. For example, a node shown as a tile in a parent view has `role="link"`, while the same node as the root of its own tiles view has no tile role. Nodes can override the view's default role for cases where the node's semantics are more specific (e.g., `SvOptionsNodeTile` overrides to `listbox`).

### Label Priority

| Source | ARIA attribute | Rationale |
|---|---|---|
| `title()` | `aria-label` | Short, instance-specific -- what the screen reader announces |
| `subtitle()` | `aria-description` | Longer detail -- available on demand |
| `jsonSchemaDescription()` | Fallback label | Describes the class when no instance title exists |
| Node `description()` | Skipped | Intended for debugging, not user-facing |

Slot-level `description()` (set via `setDescription()`) is distinct from node-level `description()` and is used for field-level `aria-description`.

## Files Modified

The accessibility implementation touches the following framework files:

| File | Changes |
|---|---|
| `_css.css` | `:focus-visible` styling, `prefers-reduced-motion`, `prefers-contrast` |
| `SvTilesView.js` | `role="list"`, `aria-label`, opt-in `aria-live` |
| `SvTile.js` | `role="link"`, `tabindex=-1`, `aria-label`, `aria-description`, `aria-current` |
| `SvFieldTile.js` | `role="group"`, `aria-label`, `aria-readonly`, `syncAriaFromSlotMetadata()` |
| `SvBooleanFieldTile.js` | `role="checkbox"`, `aria-checked` |
| `SvActionFieldTile.js` | `role="button"`, `aria-label`, `aria-disabled` |
| `SvOptionsNodeTile.js` | `role="listbox"` |
| `SvOptionNodeTile.js` | `role="option"`, `aria-selected` |
| `SvChatMessageTile.js` | `aria-live="polite"` |
| `SvStackView.js` | `role="navigation"` |
| `SvNavView.js` | `role="region"`, `aria-label` |
| `SvBreadCrumbsTile.js` | `role="navigation"`, `aria-label="Breadcrumb"`, `aria-current="location"` |
