# Event Flow

The end-to-end path from a browser event to an application handler.

## Overview

Raw DOM events are too low-level for most application code. Distinguishing a tap from a long-press from a pan requires tracking timing, movement thresholds, and finger counts — and when multiple gestures compete on the same element, the browser offers no arbitration. STRVCT's event pipeline absorbs this complexity: raw events feed into gesture recognizer state machines, a central SvGestureManager resolves conflicts (so a tap and a long-press on the same view don't both fire), and the application only sees clean, high-level callbacks like `onTapComplete` or `onPanMove`. Views that don't need gestures can still handle raw events directly — the gesture layer is additive, not mandatory.

<svg viewBox="0 0 820 540" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="aef" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>
  <rect class="fill" x="290" y="20" width="240" height="55"/>
  <text x="410" y="48" text-anchor="middle" class="b">1. Browser DOM Event</text>
  <text x="410" y="66" text-anchor="middle" class="dim">mouse, touch, keyboard, drop, ...</text>
  <line class="flow" x1="410" y1="75" x2="410" y2="110" marker-end="url(#aef)"/>
  <rect class="fill" x="220" y="110" width="380" height="70"/>
  <text x="410" y="135" text-anchor="middle" class="b">2. SvEventListener</text>
  <text x="410" y="155" text-anchor="middle" class="dim">calls named method on delegate view;</text>
  <text x="410" y="173" text-anchor="middle" class="dim">returning false stops propagation</text>
  <line class="flow" x1="410" y1="180" x2="410" y2="215" marker-end="url(#aef)"/>
  <text x="425" y="202" class="dim">if a gesture recognizer is attached</text>
  <rect class="fill" x="220" y="215" width="380" height="70"/>
  <text x="410" y="240" text-anchor="middle" class="b">3. Recognizer state machine updates</text>
  <text x="410" y="260" text-anchor="middle" class="dim">tracks finger count, timing, movement;</text>
  <text x="410" y="278" text-anchor="middle" class="dim">requests activation when conditions are met</text>
  <line class="flow" x1="410" y1="285" x2="410" y2="320" marker-end="url(#aef)"/>
  <rect class="fill" x="220" y="320" width="380" height="70"/>
  <text x="410" y="345" text-anchor="middle" class="b">4. SvGestureManager arbitrates</text>
  <text x="410" y="365" text-anchor="middle" class="dim">resolves competing gestures across views;</text>
  <text x="410" y="383" text-anchor="middle" class="dim">if accepted, sends delegate messages</text>
  <line class="flow" x1="410" y1="390" x2="410" y2="425" marker-end="url(#aef)"/>
  <rect class="fill" x="220" y="425" width="380" height="70"/>
  <text x="410" y="450" text-anchor="middle" class="b">5. View handler executes</text>
  <text x="410" y="470" text-anchor="middle" class="dim">onGestureBegin / Move / Complete / Cancelled,</text>
  <text x="410" y="488" text-anchor="middle" class="dim">or raw onMouseDown, etc., for non-gesture events</text>
  <text x="410" y="525" text-anchor="middle" class="dim">For raw event listeners (no gesture), steps 3 and 4 are skipped; the listener calls the view handler directly at step 2.</text>
</svg>


For raw event listeners (without gestures), the handler is called directly on the view at step 2, skipping the gesture layer.

## Detailed Steps

1. **Browser fires a native DOM event** (mouse, touch, keyboard, etc.) on a DOM element.

2. **An `SvEventListener` receives it.** The listener was registered on the view's element via `addEventListener()`. It calls the corresponding method on its delegate — typically the view itself. For example, a `mousedown` event calls `onMouseDown(event)` on the view.

3. **Returning `false` stops propagation.** If the handler returns `false`, `event.stopPropagation()` is called, preventing the event from bubbling to ancestor elements.

4. **Gesture recognizers observe the event.** If the view has gesture recognizers attached, they receive the raw event and update their internal state machines. For example, a `SvTapGestureRecognizer` tracks mousedown/mouseup timing and position.

5. **The recognizer requests activation.** When the gesture's conditions are met (correct finger count, sufficient movement, hold duration, etc.), it calls `SvGestureManager.requestActiveGesture()`.

6. **SvGestureManager arbitrates.** The singleton manager checks whether another gesture is already active, considers the view hierarchy, and decides whether to accept or reject the request. Competing gestures on the same or ancestor views are cancelled.

7. **The recognizer sends delegate messages.** If accepted, the recognizer calls phase methods on the view: `onGestureBegin`, `onGestureMove`, `onGestureComplete`, or `onGestureCancelled`.

8. **The view executes application logic.** The handler method runs whatever the application needs — updating model state, triggering animations, navigating, etc.

## Special Cases

- **Keyboard events** route through `SvKeyboard`, which generates modifier-aware method names (e.g., `onShiftAKeyDown`).
- **Drag-and-drop events** route through `SvDropListener`/`SvDragListener` and the MIME dispatch chain in `SvDomView_browserDragAndDrop`.
- **Focus events** interact with the responder chain in `SvResponderDomView`.
