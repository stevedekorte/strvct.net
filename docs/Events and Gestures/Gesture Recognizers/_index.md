# Gesture Recognizers

Higher-level state machines that interpret sequences of events as meaningful gestures.

## Unified Input Architecture

The browser provides two separate event families for pointing—mouse events on desktop and touch events on mobile—with different semantics, coordinate systems, and lifecycle patterns. Without an abstraction layer, every interactive view needs parallel code paths for both input types, plus logic to prevent ghost clicks and handle edge cases where both fire simultaneously.

Gesture recognizers eliminate this complexity:
- They consume raw mouse and touch events internally and present a single, input-agnostic interface to the view.
- A `SvPanGestureRecognizer` works identically whether driven by a mouse drag or a finger swipe—the view implements `onPanBegin` once and it works on every device.
- New interaction features are automatically cross-platform from the first line of code, with no per-device testing or branching required.

Mouse input naturally supports single-finger gestures (tap, pan, long-press, slide). Multi-finger gestures (pinch, rotation) require touch input or desktop Shift-click multi-touch emulation.

<svg viewBox="0 0 820 520" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="agr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="fill" x="220" y="20" width="380" height="52"/>
  <text x="235" y="40" class="b">1. Raw Mouse / Touch Input Stream</text>
  <text x="235" y="58" class="dim">Unified input abstraction</text>

  <line class="flow" x1="410" y1="72" x2="410" y2="110" marker-end="url(#agr)"/>

  <rect class="fill" x="220" y="110" width="380" height="70"/>
  <text x="235" y="130" class="b">2. SvGestureRecognizer State Machine</text>
  <text x="235" y="148" class="dim">Tracks finger count, timing, movement, hold;</text>
  <text x="235" y="166" class="dim">Tap, Pan, Pinch, Rotation, LongPress, Slide</text>

  <line class="flow" x1="410" y1="180" x2="410" y2="225" marker-end="url(#agr)"/>

  <rect class="fill" x="220" y="225" width="380" height="70"/>
  <text x="235" y="245" class="b">3. SvGestureManager Singleton Arbitration</text>
  <text x="235" y="263" class="dim">Arbitrates competing gestures;</text>
  <text x="235" y="281" class="dim">Cancels conflicts across view hierarchy</text>

  <line class="flow" x1="410" y1="295" x2="410" y2="340" marker-end="url(#agr)"/>

  <rect class="fill" x="220" y="340" width="380" height="88"/>
  <text x="235" y="360" class="b">4. Delegate Phase Messages Sent to View</text>
  <text x="235" y="378" class="dim">onGestureBegin → onGestureMove → onGestureComplete</text>
  <text x="235" y="396" class="dim">(or onGestureCancelled if interrupted)</text>

  <line class="flow" x1="410" y1="428" x2="410" y2="475" marker-end="url(#agr)"/>

  <rect class="fill" x="220" y="475" width="380" height="34"/>
  <text x="235" y="495" class="b">5. Application Handler Executes</text>
</svg>

---

## How Gestures Work

A gesture recognizer is a state machine attached to a view via `addGestureRecognizer()`. When gesture conditions are met, the recognizer sends delegate messages to the view:

```
acceptsGestureType(gesture)     — Optional: can the view accept this gesture?
onGestureTypeBegin(gesture)     — Gesture recognized and started
onGestureTypeMove(gesture)      — Gesture in progress
onGestureTypeComplete(gesture)  — Gesture completed successfully
onGestureTypeCancelled(gesture) — Gesture interrupted or cancelled
```

---

## Complete Gesture Recognizers Suite

| Recognizer Class | Detects | Primary Configuration Settors |
|---|---|---|
| **`SvTapGestureRecognizer`** | Single or multi-tap | `setNumberOfTapsRequired()`, `setNumberOfFingersRequired()`, `setMaxHoldPeriod()` |
| **`SvPanGestureRecognizer`** | Click-and-drag panning | `setMinNumberOfFingersRequired()`, `setMaxNumberOfFingersAllowed()` |
| **`SvPinchGestureRecognizer`** | Two-finger pinch/zoom | Fixed to 2 fingers |
| **`SvRotationGestureRecognizer`** | Two-finger rotation | Fixed to 2 fingers |
| **`SvLongPressGestureRecognizer`** | Press-and-hold gesture | `setTimePeriod()` (default 500ms) |
| **`SvSlideGestureRecognizer`** | Directional slide | `setDirection("left"|"right"|"up"|"down")`, `setMaxPerpendicularDistToBegin()` |
| **`SvEdgePanGestureRecognizer`** | Pan starting at view edge | Subclasses for left, right, top, bottom edges |
| **`SvScreenEdgePan`** | Pan starting at screen boundary | Subclasses for left, right, top, bottom screen boundaries |

---

## Adding Gestures & Convenience API

```javascript
// Convenience methods on SvDomView
view.addDefaultTapGesture();       // Single tap
view.addDefaultDoubleTapGesture(); // Double tap
view.addDefaultPanGesture();       // Drag panning

// Custom recognizer configuration
const gesture = SvLongPressGestureRecognizer.clone();
gesture.setTimePeriod(800); // 800ms hold requirement
view.addGestureRecognizer(gesture);

// View implements callback handler
onLongPressComplete (gesture) {
    this.openContextMenu();
}
```

---

## Global Arbitration (`SvGestureManager`)

`SvGestureManager` is a singleton that coordinates competing gestures globally across the entire view tree:
- **Priority & Hierarchy:** Child views can steal control from parent views.
- **Active Lock:** Once a gesture is accepted, competing gestures on the same or ancestor views are automatically cancelled.
- **Explicit Cancellation:** Views can cancel gestures programmatically: `view.cancelAllGesturesExcept(panGesture)`.

---

## Cleanup, Teardown & Memory Safety

When a view is retired and unmounted from the DOM hierarchy, `prepareToRetire()` executes a 3-step cleanup pipeline:

1. **`removeAllGestureRecognizers()`:** Stops each recognizer, removes DOM listeners, and clears the view target.
2. **`removeAllListeners()`:** Unbinds all element-level DOM event listeners.
3. **`cancelAllTimeouts()`:** Clears any pending gesture hold timers.

### Weak Reference Timers:
Gesture recognizers use **`addWeakTimeout()`** for internal hold delays. `addWeakTimeout()` holds only a `WeakRef` to the view target, enabling unmounted views to be reclaimed cleanly by JavaScript's garbage collector without timer leaks.

---

## Multi-Touch Desktop Emulation

On desktop browsers, holding **Shift** while clicking simulates a second touch point. This allows testing multi-finger pinch, zoom, and rotation gestures using a standard mouse.

---

## Related Guides

- [Drag and Drop](../Drag%20and%20Drop/index.html): HTML5 drag-and-drop MIME dispatch.
- [Keyboard and Focus](../Keyboard%20and%20Focus/index.html): Modifier-aware key routing.
