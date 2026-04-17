# Timers

Managed timeout system for scheduling deferred work, with support for weak references to avoid preventing garbage collection.

## Object_timeouts

All objects in STRVCT inherit timeout management through the `Object_timeouts` category on `Object`. This provides named, trackable timeouts that can be cancelled individually or in bulk — replacing direct `setTimeout` calls throughout the framework.

Direct `setTimeout` calls are fire-and-forget: there is no built-in way to cancel them by name, deduplicate them, or cancel all pending timers on an object at once. Worse, because the browser's timer queue holds a strong reference to the callback closure — which typically captures `this` — the target object cannot be garbage collected until every pending timer fires, even if nothing else references it. `Object_timeouts` solves both problems: named timeouts with automatic deduplication prevent timer accumulation, and the `addWeakTimeout` variant breaks the strong reference chain so that unreachable objects can be collected without waiting for their timers.

### Basic Usage

```javascript
// Fire after a delay
this.addTimeout(() => this.doSomething(), 1000);

// Named timeout (replaces any existing timeout with the same name)
this.addTimeout(() => this.poll(), 5000, "pollTimer");

// Cancel a named timeout
this.clearTimeoutNamed("pollTimer");

// Cancel all timeouts on this object
this.cancelAllTimeouts();
```

### Strong vs Weak Timeouts

The framework provides two timeout methods with different garbage collection behavior:

**`addTimeout(func, delay, name)`** — The standard timeout. The browser's timer queue holds a strong reference to the callback closure, which typically captures `this`. This **prevents the object from being garbage collected** until the timer fires. Use this when the work must happen regardless of the object's lifecycle — network retries, resource cleanup, message delivery guarantees.

**`addWeakTimeout(func, delay, name)`** — A GC-friendly timeout. Stores the callback on the object itself and uses only a `WeakRef` in the `setTimeout` closure. If the object becomes unreachable before the timer fires, it can be collected and the timer silently becomes a no-op. Use this for work that only matters while the object is alive — UI updates, animations, gesture state management.

```javascript
// Strong: retry must happen even if no one holds a reference to this request
this.addTimeout(() => this.retryRequest(), 5000);

// Weak: animation only matters if the view still exists
this.addWeakTimeout(() => this.fadeOut(), 300);
```

### How Weak Timeouts Work

A regular `setTimeout` closure captures `this`, creating a strong reference chain from the browser's timer queue to the object. This prevents garbage collection even if nothing else references the object.

`addWeakTimeout` breaks this chain:

1. The callback is stored on the object in a `weakTimeoutCallbackMap` (keyed by Symbol)
2. The `setTimeout` closure captures only a `WeakRef` to the object and the Symbol key
3. When the timer fires, it calls `deref()` on the `WeakRef`
4. If the object was collected, `deref()` returns `undefined` and the timer is a no-op
5. If the object is still alive, the callback is retrieved from the map and executed

The callback itself may capture `this` via a closure (e.g., `() => this.doSomething()`), but since it is stored *on the object*, this creates a reference cycle rather than a rooted chain. The cycle is collectible by the mark-and-sweep GC when no external root references the object.

### When to Use Which

| Scenario | Method | Reason |
|----------|--------|--------|
| Network request retry | `addTimeout` | Retry must fire to avoid silent failures |
| Polling for external state | `addTimeout` | External operation continues regardless |
| Resource cleanup (e.g., revoking blob URLs) | `addTimeout` | Leak prevention must happen |
| Peer connection heartbeat | `addTimeout` | Connection health requires it |
| View animation timing | `addWeakTimeout` | No view = nothing to animate |
| Gesture deactivation delay | `addWeakTimeout` | No gesture = nothing to deactivate |
| UI scroll/focus scheduling | `addWeakTimeout` | No view = nothing to scroll or focus |
| Coach mark display delay | `addWeakTimeout` | No view = nothing to display |

### Naming and Deduplication

When a name is provided, `addTimeout` and `addWeakTimeout` both cancel any existing timeout with the same name before scheduling the new one. This prevents accumulation of duplicate timers:

```javascript
// Each call replaces the previous "autoSave" timer
this.addTimeout(() => this.save(), 5000, "autoSave");
```

### Bulk Cancellation

`cancelAllTimeouts()` cancels every pending timeout (both strong and weak) on the object. This is called by `prepareToRetire()` during view teardown, but can also be called manually when resetting an object's state.

## Integration with Views

Gesture recognizers and views use `addWeakTimeout` for their internal timers:

- **`SvGestureRecognizer.didFinish()`** — Deferred deactivation after gesture completes
- **`SvLongPressGestureRecognizer`** — Long-press detection timer
- **`SvTapGestureRecognizer`** — Maximum hold period before cancellation
- **`SvDomView_animations`** — CSS transition timing and sequencing
- **`SvResponderDomView`** — Deferred focus management

These timers do not prevent their views from being garbage collected if the view is removed from the hierarchy.
