# Event Listeners

Thin wrappers around native DOM events that forward to handler methods on views.

## Architecture

Calling `addEventListener` directly ties views to specific DOM event names and requires manual bookkeeping — tracking which listeners are registered, removing them at the right time, and ensuring handlers exist before registering. Event listeners centralize this: they register lazily on first use, group related events (e.g., all mouse events) into a single toggle, dispatch to named methods on the view, and clean up automatically when the view is retired. This keeps views focused on handling events rather than managing listener lifecycle.

Event listening is built on two base classes:

- **`SvEventListener`** — Wraps a single DOM event. Registers with a target element, and when the event fires, calls a named method on its delegate (typically the view).
- **`SvEventSetListener`** — Groups related `SvEventListener` instances. Subclasses define which events they cover via `setupListeners()`.

Views manage their listeners through `SvListenerDomView`, which maintains a map of listener class names to listener instances. Listeners are created lazily on first access and cleaned up when the view is removed.

## Available Listeners

| Listener | Events |
|----------|--------|
| `SvMouseListener` | mousedown, mouseup, mouseover, mouseleave, click, dblclick, contextmenu |
| `SvMouseMoveListener` | mousemove (separate to avoid overhead when not needed) |
| `SvTouchListener` | touchstart, touchmove, touchcancel, touchend |
| `SvTouchMoveListener` | touchmove (separate for same reason) |
| `SvKeyboardListener` | keydown, keyup, input |
| `SvFocusListener` | focus, blur, focusin, focusout |
| `SvDragListener` | dragstart, drag, dragend |
| `SvDropListener` | dragenter, dragover, dragleave, drop |
| `SvScrollListener` | scroll |
| `SvWheelListener` | wheel |
| `SvClipboardListener` | copy, cut, paste |
| `SvSelectListener` | select |
| `SvWindowListener` | resize |
| `SvAnimationListener` | animationstart, animationend, animationiteration |
| `SvTransitionListener` | transitionend |
| `SvGamePadListener` | gamepadconnected, gamepaddisconnected |

## Registering for Events

Views provide convenience methods for common event families:

```javascript
view.setIsRegisteredForMouse(true);    // onMouseDown, onMouseUp, etc.
view.setIsRegisteredForKeyboard(true); // onKeyDown, onKeyUp
view.setIsRegisteredForFocus(true);    // onFocus, onBlur
view.setIsRegisteredForClicks(true);   // uses a SvTapGestureRecognizer internally
view.setIsRegisteredForWindowResize(true);
view.setIsRegisteredForBrowserDrop(true);
```

Event handler methods are called by name on the view. Returning `false` from a handler calls `event.stopPropagation()` to prevent the event from bubbling.

## Listener Lifecycle

Listeners are created lazily when first accessed via `SvListenerDomView.listenerNamed()`:

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

`SvEventSetListener.start()` iterates its child `SvEventListener` instances, each of which:

1. Checks `delegateCanRespond()` — verifies the delegate has the handler method
2. Calls `addEventListener()` on the target element with the configured options

`stop()` removes all event listeners. `setIsListening(bool)` toggles between started and stopped states.

If the listen target, delegate, or capture mode changes while listening, the listener automatically stops, updates its configuration, and restarts via `resync()`.

## Cleanup

Listeners are automatically removed when a view is retired from the hierarchy. The view's `prepareToRetire()` calls `removeAllListeners()`, which stops every registered `SvEventSetListener` and clears the listener map. No manual cleanup is needed for views that follow normal lifecycle patterns.
