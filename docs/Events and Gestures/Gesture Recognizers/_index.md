# Gesture Recognizers

Higher-level state machines that interpret sequences of events as meaningful gestures.

## Unified Input

The browser provides two separate event families for pointing — mouse events on desktop and touch events on mobile — with different semantics, coordinate systems, and lifecycle patterns. Without an abstraction layer, every interactive view needs parallel code paths for both input types, plus logic to prevent ghost clicks and handle edge cases where both fire simultaneously.

Gesture recognizers eliminate this. They consume raw mouse and touch events internally and present a single, input-agnostic interface to the view. A `PanGestureRecognizer` works identically whether driven by a mouse drag or a finger swipe — the view implements `onPanBegin` once and it works on every device. This is not just a convenience; it means new interaction features are automatically cross-platform from the first line of code, with no per-device testing or branching required.

Mouse input naturally supports only single-finger gestures (tap, pan, long-press, slide), since a mouse has one cursor. Multi-finger gestures like pinch and rotation require touch input — or the Shift+click emulation described below, which simulates a second finger for desktop testing.

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

## Cleanup and Lifecycle

Gesture recognizers are automatically cleaned up when a view is retired. When a view loses its parent and is removed from the view hierarchy, its `prepareToRetire()` method runs a three-step teardown:

1. **`removeAllGestureRecognizers()`** — Each recognizer is stopped (removing its event listeners) and its view target is cleared.
2. **`removeAllListeners()`** — All event listeners registered on the view's element are removed.
3. **`cancelAllTimeouts()`** — Any pending timers (such as long-press delays) are cancelled.

Individual gestures can also be removed at any time with `removeGestureRecognizer(gesture)`, which stops the recognizer and detaches it from the view. Some recognizers set `shouldRemoveOnComplete(true)` to automatically remove themselves after firing once — useful for one-shot gestures.

This means application code rarely needs to manage gesture cleanup manually. As long as views are properly removed from the hierarchy, all gesture state is released automatically.

## Garbage Collection

Modern JavaScript engines use mark-and-sweep garbage collection, which correctly handles circular references. When a view is removed from its parent and no other rooted object references it, the entire cluster — view, gesture recognizers, and element-level event listeners — becomes unreachable and is collected automatically without explicit cleanup.

The main GC concern is listeners registered on **rooted targets** like `window` or `document`, since those targets' internal listener registries hold strong references back to the callback (and through it, the gesture and view). Most gesture recognizers only attach `window` listeners temporarily during active tracking (between the down/press and up/finish events), so they clean up naturally when the gesture completes. `ScreenEdgePanGestureRecognizer` is the exception — it registers permanent `window` listeners and must be explicitly stopped or removed.

Timers (`setTimeout`) also root their target until they fire. Gesture recognizers use `addWeakTimeout()` for their internal timers (deactivation delays, long-press detection, etc.), which holds only a `WeakRef` to the target — allowing the object to be collected if it becomes unreachable, with the timer silently becoming a no-op.

## Multi-Touch Emulation

On desktop, holding Shift while clicking simulates a second finger. This allows testing pinch, rotation, and other multi-touch gestures without a touch device. The emulation is handled transparently by the gesture recognizer base class.
