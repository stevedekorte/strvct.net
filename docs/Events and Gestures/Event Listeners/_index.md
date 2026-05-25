# Event Listeners

Thin wrappers around native DOM events that forward to handler methods on views.

## Architecture

Calling `addEventListener` directly ties views to specific DOM event names and requires manual bookkeeping — tracking which listeners are registered, removing them at the right time, and ensuring handlers exist before registering. Event listeners centralize this: they register lazily on first use, group related events (e.g., all mouse events) into a single toggle, dispatch to named methods on the view, and clean up automatically when the view is retired. This keeps views focused on handling events rather than managing listener lifecycle.

Event listening is built on two base classes:

- **`SvEventListener`** — Wraps a single DOM event. Registers with a target element, and when the event fires, calls a named method on its delegate (typically the view).
- **`SvEventSetListener`** — Groups related `SvEventListener` instances. Subclasses define which events they cover via `setupListeners()`.

Views manage their listeners through `SvListenerDomView`, which maintains a map of listener class names to listener instances. Listeners are created lazily on first access and cleaned up when the view is removed.

<svg viewBox="0 0 820 380" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="ael" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>
  <rect class="fill" x="220" y="20" width="380" height="46"/>
  <text x="235" y="40" class="b">SvListenerDomView</text>
  <text x="235" y="58" class="dim">manages a map of listeners; lazy creation, automatic cleanup</text>
  <line class="flow" x1="410" y1="75" x2="410" y2="105"/>
  <line class="flow" x1="160" y1="105" x2="660" y2="105"/>
  <line class="flow" x1="160" y1="105" x2="160" y2="135" marker-end="url(#ael)"/>
  <line class="flow" x1="410" y1="105" x2="410" y2="135" marker-end="url(#ael)"/>
  <line class="flow" x1="660" y1="105" x2="660" y2="135" marker-end="url(#ael)"/>
  <rect class="fill" x="60" y="135" width="200" height="82"/>
  <text x="75" y="155" class="b">SvMouseListener</text>
  <text x="75" y="173" class="dim">mousedown, mouseup,</text>
  <text x="75" y="191" class="dim">mouseover, mouseleave,</text>
  <text x="75" y="209" class="dim">click, dblclick, contextmenu</text>
  <rect class="fill" x="310" y="135" width="200" height="46"/>
  <text x="325" y="155" class="b">SvKeyboardListener</text>
  <text x="325" y="173" class="dim">keydown, keyup, input</text>
  <rect class="fill" x="560" y="135" width="200" height="64"/>
  <text x="575" y="155" class="b">SvTouchListener</text>
  <text x="575" y="173" class="dim">touchstart, touchmove,</text>
  <text x="575" y="191" class="dim">touchend, touchcancel</text>
  <line class="flow" x1="160" y1="240" x2="160" y2="280" marker-end="url(#ael)"/>
  <line class="flow" x1="410" y1="240" x2="410" y2="280" marker-end="url(#ael)"/>
  <line class="flow" x1="660" y1="240" x2="660" y2="280" marker-end="url(#ael)"/>
  <rect class="box" x="60" y="280" width="200" height="60"/>
  <text x="160" y="305" text-anchor="middle" class="dim">view.onMouseDown(event)</text>
  <text x="160" y="325" text-anchor="middle" class="dim">view.onClick(event), ...</text>
  <rect class="box" x="310" y="280" width="200" height="60"/>
  <text x="410" y="305" text-anchor="middle" class="dim">view.onKeyDown(event)</text>
  <text x="410" y="325" text-anchor="middle" class="dim">view.onKeyUp(event)</text>
  <rect class="box" x="560" y="280" width="200" height="60"/>
  <text x="660" y="305" text-anchor="middle" class="dim">view.onTouchStart(event)</text>
  <text x="660" y="325" text-anchor="middle" class="dim">view.onTouchMove(event)</text>
  <text x="410" y="370" text-anchor="middle" class="dim">Each listener registers lazily on first use and cleans up automatically when the view is removed.</text>
</svg>

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
