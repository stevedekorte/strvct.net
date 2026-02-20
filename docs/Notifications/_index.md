# Notifications

Event-driven communication between framework layers using observations, scheduling, and weak references.

## Overview

Strvct's notification system provides loose coupling between the model, view, and storage layers. Rather than holding direct references to each other, objects communicate through two complementary mechanisms:

- **`SvNotificationCenter`** — A deferred, deduplicated event system. Objects post named notifications; other objects register observations to receive them. Notifications are queued and dispatched at the end of the event loop, so multiple changes within a single operation result in a single notification.

- **`SvSyncScheduler`** — A method-call scheduler that coalesces and deduplicates work. When a sync action is scheduled multiple times in the same event loop, it executes only once. This prevents redundant view updates and storage writes.

Both systems use weak references for automatic cleanup — when an observer or sender is garbage collected, its observations are removed without manual intervention.

## SvNotificationCenter

The notification center is a singleton (`SvNotificationCenter.shared()`) that manages the full lifecycle of notifications: registration, queuing, deduplication, matching, and dispatch.

### Posting Notifications

Nodes post notifications when their state changes. The most common pattern uses the convenience method on `SvNode`:

```javascript
this.postNoteNamed("myNotification");
```

For notifications with additional data:

```javascript
SvNotificationCenter.shared().newNote()
    .setSender(this)
    .setName("myNotification")
    .setInfo({ key: "value" })
    .post();
```

Notifications are not dispatched immediately. They are queued and processed at the end of the current event loop via `SvSyncScheduler`. If the same notification (same name and sender) is posted multiple times within one event loop, it is dispatched only once.

### Observing Notifications

To observe notifications from a specific sender:

```javascript
const obs = SvNotificationCenter.shared().newObservation()
    .setName("didUpdateNode")
    .setSender(targetNode)
    .setObserver(this)
    .startWatching();
```

When `targetNode` posts a `"didUpdateNode"` notification, the system calls `this.didUpdateNode(note)` — by default, the method name matches the notification name. To use a different method:

```javascript
obs.setSendName("handleNodeUpdate");
```

For one-time observations that automatically stop after the first match:

```javascript
this.watchOnceForNote("appDidInit").then(() => {
    // App is ready
});
```

Observations can also match broadly:

- `setName(null)` — match notifications with any name from the specified sender
- `setSender(null)` — match notifications with the specified name from any sender
- Both null — match all notifications (useful for debugging)

### SvNotification

Each notification is an `SvNotification` instance with three properties:

- `name` — a string identifying the event (e.g. `"appDidInit"`, `"didUpdateNode"`)
- `sender` — the object that posted it
- `info` — optional additional data

Notifications are deduplicated by a hash computed from `name` and `sender`. This means posting the same event from the same object multiple times per event loop has no additional cost.

### SvObservation

An observation connects a notification pattern to an observer. It stores:

- `name` — notification name to match (or null for any)
- `sender` — sender to match (or null for any), stored as a **weak reference**
- `observer` — the object to notify, stored as a **weak reference**
- `sendName` — optional custom method name to call on the observer
- `isOneShot` — if true, automatically stops watching after the first match

The notification center maintains indexes by sender and by name for fast matching. When a notification is dispatched, matching observations are found by intersecting the relevant index sets.

## SvSyncScheduler

The sync scheduler is a singleton (`SvSyncScheduler.shared()`) that manages deferred method calls. Where the notification center deals with named events, the sync scheduler deals with direct method invocations.

### Scheduling Actions

```javascript
SvSyncScheduler.shared().scheduleTargetAndMethod(this, "syncToView");
```

This schedules `this.syncToView()` to run at the end of the current event loop. If the same target/method pair is scheduled again before it executes, the duplicate is ignored — the method runs exactly once.

Actions can be prioritized with an optional order parameter (higher values execute later):

```javascript
SvSyncScheduler.shared().scheduleTargetAndMethod(this, "syncToView", 100);
```

### How It Connects to Notifications

The notification center uses `SvSyncScheduler` internally. When a notification is queued, the scheduler is asked to run `processPostQueue` at the end of the event loop. This means notification dispatch and view synchronization are both handled in the same deferred processing pass, in priority order.

### Immediate Processing

For cases where deferred execution isn't appropriate:

```javascript
SvSyncScheduler.shared().fullSyncNow();
```

This synchronously processes all pending actions until the queue is empty, with loop detection that halts after 10 iterations.

## SvBroadcaster

`SvBroadcaster` is a lightweight alternative to `SvNotificationCenter` for cases where deferred queuing and deduplication aren't needed.

```javascript
// Register
SvBroadcaster.shared().addListenerForName(this, "didChangeStoredSlot");

// Broadcast (immediate, synchronous)
SvBroadcaster.shared().broadcastNameAndArgument("didChangeStoredSlot", this);
```

Key differences from `SvNotificationCenter`:

- **Immediate** — broadcasts execute synchronously, not deferred
- **No deduplication** — every broadcast call dispatches
- **No observations** — simpler registration model (just listener + name)
- **Lower overhead** — suitable for high-frequency internal events

## Slot Change Hooks

When a slot value changes, the framework automatically calls a hook method on the owning object:

```javascript
initPrototypeSlots () {
    {
        const slot = this.newSlot("health", 100);
    }
}

// Called automatically when health changes
didUpdateSlotHealth (oldValue, newValue) {
    this.postNoteNamed("healthChanged");
}
```

The hook naming convention is `didUpdateSlot` + the capitalized slot name. This is the primary integration point between the slot system and the notification system — slot changes trigger hooks, which post notifications, which update views and storage.

For storable nodes, `didUpdateSlot` also calls `didMutate()`, which marks the object as dirty for persistence. This is how slot changes automatically propagate to the storage layer.

## Weak References and Automatic Cleanup

Both `sender` and `observer` on `SvObservation` are stored as weak references. This means:

1. Observations do not prevent garbage collection of either party
2. When a sender or observer is collected, a weak reference finalizer fires
3. The finalizer schedules `stopWatching()` via `SvSyncScheduler`
4. The observation is removed from the notification center automatically

This eliminates a common source of memory leaks in observer patterns. There is no need to manually remove observations when objects are destroyed — the system handles it.

Descriptions of the sender and observer are captured at registration time so that debugging information remains available even after the objects have been collected.

## Sync Loop Detection

The `SvSyncScheduler` detects infinite loops. If an action attempts to schedule itself while it is currently executing, an error is thrown:

```
SvSyncScheduler LOOP DETECTED:
  scheduleTargetAndMethod: (MyView.syncToNode)
  while processing: (MyView.syncToNode)
```

Bidirectional model-view synchronization avoids loops naturally because slot setters only trigger `didUpdateSlot` when the value actually changes. Setting a slot to its current value is a no-op.

## Common Notification Names

**Application lifecycle:**
- `"appDidInit"` — application fully initialized and ready

**Node changes:**
- `"didUpdateNode"` — node data changed
- `"shouldFocusSubnode"` — request UI focus on a subnode
- `"didReorderParentSubnodes"` — subnode order changed

**Browser events:**
- `"onBrowserOnline"` / `"onBrowserOffline"` — connectivity changes
- `"onDocumentBeforeUnload"` — page unloading

**Configuration:**
- `"onAppDeveloperModeChangedNote"` — developer mode toggled

Applications define additional notification names for their domain-specific events.
