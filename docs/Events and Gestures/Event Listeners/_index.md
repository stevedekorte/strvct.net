# Event Listeners

Thin wrappers around native DOM events that forward to handler methods on views.

## Architecture

Calling `addEventListener` directly ties views to specific DOM event names and requires manual bookkeeping — tracking which listeners are registered, removing them at the right time, and ensuring handlers exist before registering. Event listeners centralize this: they register lazily on first use, group related events (e.g., all mouse events) into a single toggle, dispatch to named methods on the view, and clean up automatically when the view is retired. This keeps views focused on handling events rather than managing listener lifecycle.

Event listening is built on two base classes:

- **`EventListener`** — Wraps a single DOM event. Registers with a target element, and when the event fires, calls a named method on its delegate (typically the view).
- **`EventSetListener`** — Groups related `EventListener` instances. Subclasses define which events they cover via `setupListeners()`.

Views manage their listeners through `ListenerDomView`, which maintains a map of listener class names to listener instances. Listeners are created lazily on first access and cleaned up when the view is removed.

## Available Listeners

| Listener | Events |
|----------|--------|
| `MouseListener` | mousedown, mouseup, mouseover, mouseleave, click, dblclick, contextmenu |
| `MouseMoveListener` | mousemove (separate to avoid overhead when not needed) |
| `TouchListener` | touchstart, touchmove, touchcancel, touchend |
| `TouchMoveListener` | touchmove (separate for same reason) |
| `KeyboardListener` | keydown, keyup, input |
| `FocusListener` | focus, blur, focusin, focusout |
| `DragListener` | dragstart, drag, dragend |
| `DropListener` | dragenter, dragover, dragleave, drop |
| `ScrollListener` | scroll |
| `WheelListener` | wheel |
| `ClipboardListener` | copy, cut, paste |
| `SelectListener` | select |
| `WindowListener` | resize |
| `AnimationListener` | animationstart, animationend, animationiteration |
| `TransitionListener` | transitionend |
| `GamePadListener` | gamepadconnected, gamepaddisconnected |

## Registering for Events

Views provide convenience methods for common event families:

```javascript
view.setIsRegisteredForMouse(true);    // onMouseDown, onMouseUp, etc.
view.setIsRegisteredForKeyboard(true); // onKeyDown, onKeyUp
view.setIsRegisteredForFocus(true);    // onFocus, onBlur
view.setIsRegisteredForClicks(true);   // uses a TapGestureRecognizer internally
view.setIsRegisteredForWindowResize(true);
view.setIsRegisteredForBrowserDrop(true);
```

Event handler methods are called by name on the view. Returning `false` from a handler calls `event.stopPropagation()` to prevent the event from bubbling.

## Listener Lifecycle

Listeners are created lazily when first accessed via `ListenerDomView.listenerNamed()`:

```javascript
listenerNamed (className) {
    const map = this.eventListenersMap();
    if (!map.has(className)) {
        const instance = Object.getClassNamed(className).clone()
            .setListenTarget(this.element())
            .setDelegate(this);
        map.set(className, instance);
    }
    return map.get(className);
}
```

The listener target is the view's DOM element. The delegate is the view itself.

`EventSetListener.start()` iterates its child `EventListener` instances, each of which:

1. Checks `delegateCanRespond()` — verifies the delegate has the handler method
2. Calls `addEventListener()` on the target element with the configured options

`stop()` removes all event listeners. `setIsListening(bool)` toggles between started and stopped states.

If the listen target, delegate, or capture mode changes while listening, the listener automatically stops, updates its configuration, and restarts via `resync()`.

## Cleanup

Listeners are automatically removed when a view is retired from the hierarchy. The view's `prepareToRetire()` calls `removeAllListeners()`, which stops every registered `EventSetListener` and clears the listener map. No manual cleanup is needed for views that follow normal lifecycle patterns.
