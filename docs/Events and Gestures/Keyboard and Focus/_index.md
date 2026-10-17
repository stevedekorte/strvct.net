# Keyboard and Focus

Keyboard state tracking, modifier-aware key dispatch, and the responder chain for focus management.

## Overview

The browser's native keyboard handling has two critical gaps:
1. `keydown` and `keyup` events tell you which key was pressed, but not which other keys are currently held.
2. DOM `focus` is element-level without a concept of a view hierarchy responder chain or tab-order routing between custom view containers.

STRVCT addresses both:
- **`SvKeyboard` Singleton:** Tracks global keyboard state and generates **modifier-aware method names** (e.g. `onShiftAKeyDown`, `onAlternate_D_KeyDown`).
- **`SvResponderDomView`:** Layers a responder chain on top of DOM focus to manage focus acquisition, loss, and Tab-key navigation through the view tree.

<svg viewBox="0 0 820 460" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="akf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="fill" x="220" y="20" width="380" height="52"/>
  <text x="235" y="40" class="b">1. Raw keydown Event</text>
  <text x="235" y="58" class="dim">key: "A", modifiers: Shift held</text>

  <line class="flow" x1="410" y1="72" x2="410" y2="115" marker-end="url(#akf)"/>

  <rect class="fill" x="220" y="115" width="380" height="70"/>
  <text x="235" y="135" class="b">2. SvKeyboard Singleton</text>
  <text x="235" y="153" class="dim">Tracks currently pressed keys &amp; modifiers;</text>
  <text x="235" y="171" class="dim">Builds method name: "onShiftAKeyDown"</text>

  <line class="flow" x1="410" y1="185" x2="410" y2="235" marker-end="url(#akf)"/>

  <rect class="fill" x="220" y="235" width="380" height="70"/>
  <text x="235" y="255" class="b">3. Responder Chain (SvResponderDomView)</text>
  <text x="235" y="273" class="dim">First responder (focused view) receives event;</text>
  <text x="235" y="291" class="dim">nextKeyView controls Tab-order routing</text>

  <line class="flow" x1="410" y1="305" x2="410" y2="355" marker-end="url(#akf)"/>

  <rect class="fill" x="220" y="355" width="380" height="52"/>
  <text x="235" y="375" class="b">4. view.onShiftAKeyDown(event) Runs</text>
  <text x="235" y="393" class="dim">View-specific key handler executes</text>

  <text x="410" y="445" text-anchor="middle" class="dim">Views handle specific key combinations by implementing named methods; no modifier-flag parsing required.</text>
</svg>

---

## Modifier-Aware Method Naming Pattern

When a key event fires, `SvKeyboard` generates a method name following the pattern:

```
on[Modifiers][KeyName]Key[Down|Up]
```

### Examples:
- Pressing **A** with **Shift**: `onShiftAKeyDown(event)`
- Pressing **D** with **Option/Alt** and **Shift**: `onAlternate_D_KeyDown(event)` (toggles Developer Mode)
- Pressing **Enter**: `onEnterKeyDown(event)`
- Pressing **Escape**: `onEscapeKeyDown(event)`

---

## Platform Modifier Mappings

- **macOS:** Command key maps to `MetaLeft` / `MetaRight` (`onMetaKey...`). Option key maps to `Alternate` (`onAlternateKey...`).
- **Windows / Linux:** Control key maps to `Control` (`onControlKey...`). Alt key maps to `Alternate` (`onAlternateKey...`).

---

## Responder Chain (`SvResponderDomView`)

`SvResponderDomView` provides focus management methods across the view tree:

- **`acceptsFirstResponder()`:** Returns `true` if the view can receive keyboard focus.
- **`becomeFirstResponder()`:** Acquires focus, updates styling, and calls `willBecomeFirstResponder()`.
- **`releaseFirstResponder()`:** Releases focus and calls `willReleaseFirstResponder()`.
- **`nextKeyView`:** References the next view in the tab order, enabling Tab key navigation across view inputs.

---

## Related Guides

- [Gesture Recognizers](../Gesture%20Recognizers/index.html): Touch and mouse gesture state machines.
- [Drag and Drop](../Drag%20and%20Drop/index.html): HTML5 drag-and-drop MIME dispatch.
