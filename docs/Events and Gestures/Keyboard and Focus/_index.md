# Keyboard and Focus

Keyboard state tracking, modifier-aware key dispatch, and the responder chain for focus management.

## SvKeyboard

The browser's native keyboard handling has two gaps that matter for an application framework. First, `keydown` and `keyup` events tell you which key was just pressed but not which other keys are already held — there is no built-in API for querying current keyboard state. Second, the DOM's `focus` model is element-level: it knows which element has focus, but has no concept of a focus chain through a view hierarchy, tab-order navigation between views, or a centralized way for views to declare whether they accept keyboard input. `SvKeyboard` and the responder chain address these: a singleton tracks live key state and generates modifier-aware method names (so views handle `onShiftAKeyDown` instead of parsing modifier flags), while `SvResponderDomView` layers a responder chain on top of DOM focus to manage keyboard routing through the view tree.

`SvKeyboard` is a singleton that tracks global keyboard state — which keys are currently pressed, modifier key status, and key code/name mapping.

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
  <rect class="fill" x="290" y="20" width="240" height="60"/>
  <text x="410" y="48" text-anchor="middle" class="b">keydown event</text>
  <text x="410" y="68" text-anchor="middle" class="dim">key: "A", modifiers: Shift held</text>
  <line class="flow" x1="410" y1="80" x2="410" y2="115" marker-end="url(#akf)"/>
  <rect class="fill" x="220" y="115" width="380" height="85"/>
  <text x="410" y="143" text-anchor="middle" class="b">SvKeyboard · singleton</text>
  <text x="410" y="165" text-anchor="middle" class="dim">tracks currently pressed keys + modifiers;</text>
  <text x="410" y="185" text-anchor="middle" class="dim">builds modifier-aware method name</text>
  <line class="flow" x1="410" y1="200" x2="410" y2="235" marker-end="url(#akf)"/>
  <text x="425" y="222" class="dim">"onShiftAKeyDown"</text>
  <rect class="fill" x="220" y="235" width="380" height="85"/>
  <text x="410" y="263" text-anchor="middle" class="b">Responder chain (SvResponderDomView)</text>
  <text x="410" y="285" text-anchor="middle" class="dim">first responder (focused view) receives event;</text>
  <text x="410" y="305" text-anchor="middle" class="dim">nextKeyView controls Tab-order routing</text>
  <line class="flow" x1="410" y1="320" x2="410" y2="355" marker-end="url(#akf)"/>
  <rect class="fill" x="220" y="355" width="380" height="60"/>
  <text x="410" y="380" text-anchor="middle" class="b">view.onShiftAKeyDown(event)</text>
  <text x="410" y="400" text-anchor="middle" class="dim">view-specific handler runs</text>
  <text x="410" y="445" text-anchor="middle" class="dim">Views handle specific combos by implementing the named method; no modifier-flag parsing required.</text>
</svg>

## Modifier-Aware Method Names

When a key event fires, `SvKeyboard` generates a method name that includes active modifiers. For example, pressing Shift+A generates a call to `onShiftAKeyDown()`. This allows views to handle specific key combinations by simply implementing the named method.

The generated method names follow the pattern: `on[Modifiers][KeyName]Key[Down|Up]`.

## Platform Differences

- macOS: Command key maps to MetaLeft/MetaRight
- All platforms: Control, Shift, Alt (Option on macOS)
- Some OS-level shortcuts cannot be intercepted by the framework

## Responder Chain

`SvResponderDomView` implements a responder chain for managing keyboard focus:

- **`acceptsFirstResponder`** — Whether a view can receive keyboard focus.
- **`becomeFirstResponder()`** / **`releaseFirstResponder()`** — Acquire or release focus.
- **`nextKeyView`** — The next view in the tab order, enabling Tab-key navigation between focusable views.

The responder chain ensures that keyboard events are routed to the focused view, and provides hooks (`willBecomeFirstResponder`) for views to prepare when receiving focus.
