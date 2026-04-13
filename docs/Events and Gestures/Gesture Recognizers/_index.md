# Gesture Recognizers

Higher-level state machines that interpret sequences of events as meaningful gestures.

## Unified Input

The browser provides two separate event families for pointing — mouse events on desktop and touch events on mobile — with different semantics, coordinate systems, and lifecycle patterns. Without an abstraction layer, every interactive view needs parallel code paths for both input types, plus logic to prevent ghost clicks and handle edge cases where both fire simultaneously.

Gesture recognizers eliminate this. They consume raw mouse and touch events internally and present a single, input-agnostic interface to the view. A `PanGestureRecognizer` works identically whether driven by a mouse drag or a finger swipe — the view implements `onPanBegin` once and it works on every device. This is not just a convenience; it means new interaction features are automatically cross-platform from the first line of code, with no per-device testing or branching required.

## How Gestures Work

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

## Available Gestures

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

## Adding Gestures to a View

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

## GestureManager

`GestureManager` is a singleton that coordinates competing gestures globally. When a gesture requests activation, the manager decides whether to accept it based on:

- Whether another gesture is already active
- View hierarchy (child views can steal control from parent views)
- Whether the existing active gesture accepts cancellation

This prevents conflicts — for example, a tap gesture and a pan gesture on the same view won't fire simultaneously. The first gesture to request activation after meeting its conditions wins, and competing gestures are cancelled.

Views can also explicitly cancel gestures:

```javascript
view.cancelAllGesturesExcept(panGesture);
```

## Multi-Touch Emulation

On desktop, holding Shift while clicking simulates a second finger. This allows testing pinch, rotation, and other multi-touch gestures without a touch device. The emulation is handled transparently by the gesture recognizer base class.
