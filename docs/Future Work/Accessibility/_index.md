# Accessibility

Leveraging the naked objects pattern to provide automatic, framework-level accessibility.

## Context

STRVCT already supports keyboard-only interaction for most of the UI. `SvTilesView` handles arrow-key navigation, Enter to drill in, Escape to drill out. The responder chain (`SvResponderDomView`) manages focus routing through the view hierarchy, and `nextKeyView` provides tab-order navigation between focusable views. This keyboard support works automatically for any application built on the framework -- developers get it without writing keyboard-handling code.

What's missing is the other half of accessibility: telling assistive technology (screen readers, braille displays, voice control) *what* the UI elements are and *what state* they're in. The keyboard support means a blind user can physically navigate the UI, but a screen reader can't yet describe what they're navigating through.

## Why the Naked Objects Pattern Helps

Most frameworks require developers to manually add accessibility attributes to each component. STRVCT's architecture inverts this: since the framework generates views from the model, it can also generate accessibility metadata from the model -- automatically, in one place, for all applications.

**The slot system already describes the data.** Slot metadata maps almost directly to ARIA attributes:

| Slot metadata | ARIA equivalent |
|---|---|
| `description()` | `aria-label` or `aria-describedby` |
| `isReadOnly()` | `aria-readonly` |
| `validValues()` | communicable as allowed options |
| `isRequired()` | `aria-required` |
| `slotType()` | informs the appropriate `role` |

**JSON Schema annotations serve double duty.** The same slot annotations that generate [JSON Schema](../JSON%20Schema/index.html) for AI tool calls can drive accessibility attributes. A slot with `setMinimum(0)` and `setMaximum(100)` already describes the valid range for AI -- it can also emit `aria-valuemin="0"` and `aria-valuemax="100"` on a slider or spinbutton. A slot with `setFormat("email")` tells both AI and screen readers what kind of input is expected. A slot with `setExamples(["red", "blue"])` can provide input hints. The investment in richer JSON Schema coverage directly improves accessibility coverage -- both are about describing the data model's constraints to an external consumer.

**The node hierarchy maps to ARIA tree patterns.** The tile/stack navigation model (drill in, drill out, select with arrows) is essentially an ARIA tree:

| STRVCT concept | ARIA role |
|---|---|
| `SvTilesView` | `tree` or `listbox` |
| `SvTile` | `treeitem` or `option` |
| Expanded/collapsed state | `aria-expanded` |
| Nesting depth | `aria-level` |
| Selected tile | `aria-selected` |

**The notification system can drive live regions.** When a node posts `didUpdateSlot`, the view layer could announce the change to screen readers via `aria-live` -- for free, without developer effort.

## What's Already Working

These features provide keyboard-only interaction today:

- **Arrow-key navigation** in tile views (up/down to move, Enter to drill in, Escape to drill out)
- **Responder chain** for keyboard event routing through the view hierarchy
- **Tab-order navigation** via `nextKeyView` between focusable views
- **Modifier-aware key handling** -- `SvKeyboard` generates method names like `onShiftAKeyDown` automatically
- **Focus management** through the view tree, not just at the DOM element level

## What's Needed

### Automatic ARIA from the model

`NodeView` and its subclasses should emit ARIA roles, labels, and states derived from node type and slot metadata. The goal is zero developer effort for common cases:

- `SvTilesView` emits `role="tree"` or `role="listbox"` with proper `aria-label`
- Each `SvTile` emits `role="treeitem"` with `aria-level`, `aria-expanded`, `aria-selected`
- `SvField` subviews emit the appropriate input role (`textbox`, `checkbox`, `spinbutton`) based on slot type
- Slot descriptions become `aria-label` or `aria-describedby` attributes
- Read-only, required, and disabled states are reflected automatically

### Accessibility slots on nodes

Optional overrides for when the automatic behavior isn't right, following the same pattern as `setNodeViewClass()` -- good default, explicit override when needed:

- `setAriaRole(role)` -- override the inferred role
- `setAriaLabel(label)` -- override the inferred label
- `setAccessibilityHint(hint)` -- additional context for screen readers

### Live region integration

Opt-in `aria-live` announcements tied to the notification system. When a node's view is marked as a live region, changes posted through `didUpdateSlot` are automatically announced to screen readers. Useful for:

- Chat messages and AI responses
- Status updates and progress indicators
- Error messages and validation feedback
- Dynamic content that changes without user action

### Focus management improvements

- Visible focus indicators that meet WCAG 2.2 contrast requirements (3:1 against adjacent colors)
- Focus trapping in modal dialogs
- Focus restoration when navigating back (drill out should restore focus to the tile that was drilled into)
- Skip links for jumping past repetitive navigation

### Visual accessibility

The programmatic styling system could provide:

- **High-contrast themes** respecting `prefers-contrast`
- **Reduced motion** respecting `prefers-reduced-motion` (disable animations, transitions)
- **Text scaling** -- ensure layouts accommodate up to 200% text size (WCAG 1.4.4)
- **Color independence** -- information conveyed by color alone should also use shape, text, or pattern

### ARIA landmarks and structure

ARIA landmark roles can provide the same structural information as semantic HTML elements without changing the existing div-based DOM. The framework could add `role="navigation"`, `role="main"`, `role="list"`, and `role="listitem"` to the appropriate views, along with a proper heading hierarchy (`aria-level`) derived from node depth. This approach avoids disrupting existing CSS selectors and layout behavior.

## Implementation Strategy

The work can be layered incrementally:

1. **Landmark roles and basic ARIA** -- Add ARIA landmark roles and structure to existing div elements in `NodeView`. Highest impact for least effort.
2. **Slot-derived ARIA attributes** -- Wire slot metadata into `aria-*` attributes on field views. Builds on existing infrastructure.
3. **Tree navigation ARIA** -- Add `role="tree"` / `role="treeitem"` and state attributes to the tile/stack views. Complements the existing keyboard navigation.
4. **Live regions** -- Integrate `aria-live` with the notification system for dynamic content.
5. **Visual accessibility** -- High-contrast themes, reduced motion, focus indicators. Can be done in parallel with the above.
6. **Audit tooling** -- Since the framework knows the full node graph and view hierarchy, it could provide a built-in accessibility checker that flags missing labels, contrast issues, and keyboard traps at the framework level.

## WCAG Compliance Target

WCAG 2.2 Level AA is the practical target -- it's the standard required by most accessibility legislation (ADA, EAA, Section 508) and covers the issues that affect the most users. Level AAA is aspirational but not required for most applications.

## Relationship to Current Architecture

Like the [Graph Database](../Graph%20Database/index.html) direction, this is a framework-level improvement that benefits all applications. The accessibility layer would sit between the existing node/view system and the DOM:

- `SvNode` and its subclasses remain unchanged
- `NodeView` and its subclasses gain ARIA-emitting behavior
- The slot system gains accessibility-related annotations
- The theme system gains high-contrast and reduced-motion variants
- Applications get improved accessibility automatically, with opt-in overrides for edge cases

## Open Questions

### Role inference

A `SvTilesView` could be a `tree`, `listbox`, `grid`, or `menu` depending on context. How does `NodeView` decide which ARIA role to emit? Is it based on the node class, a slot annotation, or the nesting depth? The wrong role is worse than no role -- a screen reader navigating a "tree" expects different keyboard behavior than a "listbox".

### Focus model reconciliation (researched)

**Resolved: the DOM focus bridge already exists.** `becomeFirstResponder()` calls `this.focus()` which calls `element.focus()` directly (`SvResponderDomView.js`). `releaseFirstResponder()` calls `element.blur()`. The framework tracks the active view via `document.activeElement`. Screen readers can follow the responder chain through DOM focus.

Remaining issues in this area:

- **Focus outlines globally suppressed.** `_css.css` sets `outline: none` on `* :focus`, removing all visual focus indicators. This needs to be replaced with visible focus styling that meets WCAG 2.2 contrast requirements.
- **Tiles are not individually focusable.** `SvTile` sets `acceptsFirstResponder(false)` -- focus lands on `SvTilesView`, not on individual tiles. Screen readers need individual tiles to be focusable to announce their content.
- **Tab key intercepted.** The framework overrides native Tab behavior with a custom `nextKeyView` chain. This may confuse screen reader users who expect standard Tab navigation.
- **`tabindex` only on keyboard-registered views.** Views that call `setIsRegisteredForKeyboard(true)` get an auto-incremented `tabindex`. Other elements are unfocusable. For accessibility, more elements may need `tabindex`.

### Navigation announcements

When the user drills into a tile, new views are added to the stack (only backward navigation removes views). Should the screen reader announce the new context? ("Entered: Contact Details, 6 items") Too much announcement is as bad as too little. ARIA live regions need a clear policy on what's announced and what's silent.

### ARIA roles vs. semantic elements

ARIA roles like `role="button"` on a div are equivalent to a native button from the screen reader's perspective -- the ARIA spec was designed for exactly this. Since STRVCT already handles keyboard activation and focus management on tiles, the native behaviors that semantic elements provide for free (space/Enter activation, default tab order) are redundant. This means the framework can add accessibility through ARIA attributes on existing div elements without migrating to semantic HTML elements, avoiding any disruption to existing styling and layout.

### Label priority

When multiple label sources exist -- slot `description()`, node `title()`, JSON Schema `jsonSchemaDescription()` -- which wins? Need a defined fallback order so labels are predictable and don't duplicate or contradict each other.

### Testing strategy

Automated tools (axe, Lighthouse) catch missing attributes but not the actual screen reader experience. The real test is whether a VoiceOver or NVDA user can navigate the app. Is manual testing with VoiceOver sufficient, or do we need a formal testing protocol? Should there be automated accessibility regression tests in the test suite?

## Effort Estimate

### Why STRVCT makes this easier than usual

Accessibility audits typically assume a hand-authored web application where every page has different layout patterns, bespoke widgets, and inconsistent structure. STRVCT is the opposite: the UI is generated from a small set of view classes -- `SvTilesView`, `SvTile`, `SvFieldTile`, `SvStackView`, `SvNavView`. There are roughly 10-15 view classes that cover the vast majority of the UI.

This means fixing accessibility in the core view classes fixes it everywhere, across every application. If reading order is correct in `SvTilesView`, it's correct in every list. If focus management works in `SvStackView`, it works for every drill-in navigation. If field labels are properly wired in `SvFieldTile`, every field in every app gets a proper label.

Items that would still need per-application attention:
- Alternative text for app-specific images (the framework can't guess what a picture shows)
- Custom views that override the default rendering
- Domain-specific labels where the auto-generated slot description isn't clear enough

But these are exceptions, not the rule. The naked objects pattern is almost uniquely well-suited for centralized accessibility work.

### Day 1 -- Core ARIA and focus

- Add ARIA roles to core views (`SvTilesView` as listbox, tiles as options, fields as appropriate input roles)
- Make individual tiles focusable (`tabindex` with arrow-key management)
- Replace the global `outline: none` with proper `:focus-visible` styling
- Add `aria-selected` and `aria-expanded` state tracking to tiles
- Wire slot `description()` into `aria-label` on field views
- Basic VoiceOver testing to verify navigation works

### Days 2-3 -- Slot-to-ARIA mapping and contrast

- Wire remaining slot metadata into ARIA attributes (`isReadOnly`, `isRequired`, `validValues`, JSON Schema constraints like `minimum`/`maximum`)
- Add `aria-live` regions for dynamic content (status updates, notifications)
- Audit current theme for WCAG 4.5:1 color contrast and fix violations
- Test text resize to 200% and content reflow at 320px width

### Days 4-5 -- Edge cases and manual testing

- Address `nextKeyView` / Tab key interaction with screen readers
- Navigation announcement tuning (what's announced on drill-in, what's silent)
- Landmark roles on container views (navigation, main content)
- Full manual VoiceOver walkthrough of a representative application
- Automated accessibility audit (axe or Lighthouse) and fix remaining issues

### Ongoing

- Address issues surfaced by real screen reader testing
- Per-application fixes for custom views or domain-specific labels
- Cross-screen-reader testing (NVDA on Windows, TalkBack on Android)

### AA compliance outlook

Substantive WCAG 2.2 Level AA compliance is realistic within a focused week of work. Automated tools typically catch 30-40% of AA issues in a conventional web app, but STRVCT's regularity pushes effective coverage much higher -- fixing the core view classes plus running an automated scan could address 70-80% of criteria. The remaining items require manual screen reader testing but benefit from the same structural regularity.
