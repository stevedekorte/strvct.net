# Events and Gestures

Event listeners, gesture recognizers, keyboard handling, and drag-and-drop.

## Overview

STRVCT provides two layers for handling user interaction:

- **Event listeners** — Thin wrappers around native DOM events (mouse, touch, keyboard, clipboard, etc.). Each listener class covers a specific event family and forwards events to handler methods on the view.
- **Gesture recognizers** — Higher-level state machines that interpret sequences of events as meaningful gestures (tap, pan, pinch, long-press, etc.). Gestures are attached to views and communicate through a delegate pattern.

Most application code uses gesture recognizers rather than raw event listeners. The gesture system unifies mouse and touch input, handles multi-touch emulation on desktop (shift+click simulates a second finger), and coordinates competing gestures through a global `GestureManager`.

## Event Listeners

### Architecture

Event listening is built on two base classes:

- **`EventListener`** — Wraps a single DOM event. Registers with a target element, and when the event fires, calls a named method on its delegate (typically the view).
- **`EventSetListener`** — Groups related `EventListener` instances. Subclasses define which events they cover via `setupListeners()`.

Views manage their listeners through `ListenerDomView`, which maintains a map of listener class names to listener instances. Listeners are created lazily on first access and cleaned up when the view is removed.

### Available Listeners

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

### Registering for Events

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

## Gesture Recognizers

### How Gestures Work

A gesture recognizer is a state machine that observes raw events on a view and interprets them as a gesture with defined phases: **begin**, **move**, **complete**, or **cancelled**.

Each recognizer is attached to a view via `addGestureRecognizer()`. When the gesture's conditions are met (correct finger count, sufficient movement, etc.), the recognizer sends delegate messages to the view:

```
acceptsGestureType(gesture)   — optional: can the view accept this gesture?
onGestureTypeBegin(gesture)   — gesture recognized and started
onGestureTypeMove(gesture)    — gesture is in progress
onGestureTypeComplete(gesture) — gesture finished successfully
onGestureTypeCancelled(gesture) — gesture was interrupted
```

For example, a `PanGestureRecognizer` sends `onPanBegin`, `onPanMove`, `onPanComplete`, and `onPanCancelled`.

### Available Gestures

| Recognizer | Detects | Key Configuration |
|------------|---------|-------------------|
| `TapGestureRecognizer` | Single or multi-tap | `numberOfTapsRequired`, `numberOfFingersRequired`, `maxHoldPeriod` |
| `PanGestureRecognizer` | Click-and-drag | `minNumberOfFingersRequired`, `maxNumberOfFingersAllowed` |
| `PinchGestureRecognizer` | Two-finger pinch/zoom | Fixed to 2 fingers |
| `RotationGestureRecognizer` | Two-finger rotation | Fixed to 2 fingers |
| `LongPressGestureRecognizer` | Press-and-hold | `timePeriod` (default 500ms) |
| `SlideGestureRecognizer` | Directional slide | `direction` ("left", "right", "up", "down"), `maxPerpendicularDistToBegin` |
| `EdgePanGestureRecognizer` | Pan from view edge | Subclasses for left, right, top, bottom |
| `ScreenEdgePanGestureRecognizer` | Pan from screen edge | Subclasses for left, right, top, bottom |

### Adding Gestures to a View

Common gestures have convenience methods:

```javascript
view.addDefaultTapGesture();       // single tap
view.addDefaultDoubleTapGesture(); // double tap
view.addDefaultPanGesture();       // drag
```

For custom configuration, clone a recognizer and configure it:

```javascript
const gesture = LongPressGestureRecognizer.clone();
gesture.setTimePeriod(800); // 800ms hold
view.addGestureRecognizer(gesture);
// implement onLongPressComplete(gesture) on the view
```

### GestureManager

`GestureManager` is a singleton that coordinates competing gestures globally. When a gesture requests activation, the manager decides whether to accept it based on:

- Whether another gesture is already active
- View hierarchy (child views can steal control from parent views)
- Whether the existing active gesture accepts cancellation

This prevents conflicts — for example, a tap gesture and a pan gesture on the same view won't fire simultaneously. The first gesture to request activation after meeting its conditions wins, and competing gestures are cancelled.

Views can also explicitly cancel gestures:

```javascript
view.cancelAllGesturesExcept(panGesture);
```

### Multi-Touch Emulation

On desktop, holding Shift while clicking simulates a second finger. This allows testing pinch, rotation, and other multi-touch gestures without a touch device. The emulation is handled transparently by the gesture recognizer base class.

## Keyboard Handling

### SvKeyboard

`SvKeyboard` is a singleton that tracks global keyboard state — which keys are currently pressed, modifier key status, and key code/name mapping.

### Modifier-Aware Method Names

When a key event fires, `SvKeyboard` generates a method name that includes active modifiers. For example, pressing Shift+A generates a call to `onShiftAKeyDown()`. This allows views to handle specific key combinations by simply implementing the named method.

The generated method names follow the pattern: `on[Modifiers][KeyName]Key[Down|Up]`.

### Platform Differences

- macOS: Command key maps to MetaLeft/MetaRight
- All platforms: Control, Shift, Alt (Option on macOS)
- Some OS-level shortcuts cannot be intercepted by the framework

## Responder Chain

`ResponderDomView` implements a responder chain for managing keyboard focus:

- **`acceptsFirstResponder`** — Whether a view can receive keyboard focus.
- **`becomeFirstResponder()`** / **`releaseFirstResponder()`** — Acquire or release focus.
- **`nextKeyView`** — The next view in the tab order, enabling Tab-key navigation between focusable views.

The responder chain ensures that keyboard events are routed to the focused view, and provides hooks (`willBecomeFirstResponder`) for views to prepare when receiving focus.

## Drag and Drop

STRVCT wraps the HTML5 drag-and-drop API through `DomView_browserDragAndDrop`:

**Drop target registration:**

```javascript
view.setIsRegisteredForBrowserDrop(true);
```

**Drop handling methods:**

- `acceptsDrop()` — Override to control whether the view accepts drops.
- `onBrowserDragEnter()` / `onBrowserDragOver()` / `onBrowserDragLeave()` — Visual feedback during drag.
- `onBrowserDrop(event)` — Handle the drop.
- `onBrowserDataTransfer(dataTransfer)` — Process dropped data.

**MIME type routing:**

Dropped data is routed to type-specific handlers. For example, dropping an image calls `onBrowserDropImagePng()`. The method name is derived automatically from the MIME type.

**Drag source handling:**

Views can also act as drag sources via `onBrowserDragStart()`, `onBrowserDrag()`, and `onBrowserDragEnd()`.

## Event Flow

The full path from browser event to application handler:

1. Browser fires a native DOM event (mouse, touch, keyboard).
2. An `EventListener` receives it and calls the corresponding method on its delegate.
3. If a `GestureRecognizer` is listening, it updates its internal state machine.
4. When conditions are met, the recognizer calls `GestureManager.requestActiveGesture()`.
5. If accepted, the recognizer sends delegate messages (`onGestureBegin`, etc.) to the view.
6. The view's handler method executes application logic.

For raw event listeners (without gestures), step 2 calls the handler directly on the view, skipping the gesture layer.
