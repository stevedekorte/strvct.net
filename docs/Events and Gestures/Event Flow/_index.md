# Event Flow

The end-to-end path from a browser event to an application handler.

## Overview

Raw DOM events are too low-level for most application code. Distinguishing a tap from a long-press from a pan requires tracking timing, movement thresholds, and finger counts — and when multiple gestures compete on the same element, the browser offers no arbitration. STRVCT's event pipeline absorbs this complexity: raw events feed into gesture recognizer state machines, a central GestureManager resolves conflicts (so a tap and a long-press on the same view don't both fire), and the application only sees clean, high-level callbacks like `onTapComplete` or `onPanMove`. Views that don't need gestures can still handle raw events directly — the gesture layer is additive, not mandatory.

```
Browser DOM Event
  → EventListener receives it
    → calls named method on delegate (the view)
      → if a GestureRecognizer is listening, updates its state machine
        → when conditions are met, requests activation from GestureManager
          → if accepted, sends delegate messages to the view
            → view handler executes application logic
```

For raw event listeners (without gestures), the handler is called directly on the view at step 2, skipping the gesture layer.

## Detailed Steps

1. **Browser fires a native DOM event** (mouse, touch, keyboard, etc.) on a DOM element.

2. **An `EventListener` receives it.** The listener was registered on the view's element via `addEventListener()`. It calls the corresponding method on its delegate — typically the view itself. For example, a `mousedown` event calls `onMouseDown(event)` on the view.

3. **Returning `false` stops propagation.** If the handler returns `false`, `event.stopPropagation()` is called, preventing the event from bubbling to ancestor elements.

4. **Gesture recognizers observe the event.** If the view has gesture recognizers attached, they receive the raw event and update their internal state machines. For example, a `TapGestureRecognizer` tracks mousedown/mouseup timing and position.

5. **The recognizer requests activation.** When the gesture's conditions are met (correct finger count, sufficient movement, hold duration, etc.), it calls `GestureManager.requestActiveGesture()`.

6. **GestureManager arbitrates.** The singleton manager checks whether another gesture is already active, considers the view hierarchy, and decides whether to accept or reject the request. Competing gestures on the same or ancestor views are cancelled.

7. **The recognizer sends delegate messages.** If accepted, the recognizer calls phase methods on the view: `onGestureBegin`, `onGestureMove`, `onGestureComplete`, or `onGestureCancelled`.

8. **The view executes application logic.** The handler method runs whatever the application needs — updating model state, triggering animations, navigating, etc.

## Special Cases

- **Keyboard events** route through `SvKeyboard`, which generates modifier-aware method names (e.g., `onShiftAKeyDown`).
- **Drag-and-drop events** route through `DropListener`/`DragListener` and the MIME dispatch chain in `DomView_browserDragAndDrop`.
- **Focus events** interact with the responder chain in `ResponderDomView`.
