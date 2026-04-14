# Sync Scheduler

Deferred, deduplicated method calls with priority ordering and loop detection.

## Overview

View synchronization and storage writes don't need the notification center's broadcast generality — there's no unknown set of observers, just a specific method on a specific object that needs to run. But without coalescing, the same sync could be requested dozens of times per event loop as multiple slots change. Calling it each time wastes work; calling it zero times loses data.

`SvSyncScheduler` solves this by ensuring a given target/method pair runs exactly once per event loop, no matter how many code paths request it. It also provides priority ordering so that view-to-model syncs (user edits) complete before model-to-view syncs (reactive updates), preventing stale data from overwriting user input.

The notification center uses `SvSyncScheduler` internally for its own dispatch, so notification delivery and view synchronization are handled in the same deferred processing pass.

## Scheduling Actions

```javascript
SvSyncScheduler.shared().scheduleTargetAndMethod(this, "syncToView");
```

This schedules `this.syncToView()` to run at the end of the current event loop. If the same target/method pair is scheduled again before it executes, the duplicate is ignored — the method runs exactly once.

## Priority

Actions can be prioritized with an optional order parameter:

```javascript
SvSyncScheduler.shared().scheduleTargetAndMethod(this, "syncToView", 100);
```

Higher values execute later. This is how the framework ensures view-to-model syncs (priority 0) complete before model-to-view syncs (priority 2) — user edits are applied before reactive updates.

## Immediate Processing

For cases where deferred execution isn't appropriate:

```javascript
SvSyncScheduler.shared().fullSyncNow();
```

This synchronously processes all pending actions until the queue is empty.

## Loop Detection

The scheduler detects infinite loops. If an action attempts to schedule itself while it is currently executing, an error is thrown:

```
SvSyncScheduler LOOP DETECTED:
  scheduleTargetAndMethod: (MyView.syncToNode)
  while processing: (MyView.syncToNode)
```

Bidirectional model-view synchronization avoids loops naturally because slot setters only trigger `didUpdateSlot` when the value actually changes. Setting a slot to its current value is a no-op.

`fullSyncNow()` also includes a safety limit — it halts after 10 iterations if the queue hasn't drained, indicating a cycle that the single-action detector didn't catch.

## Pausing and Resuming

Schedulers can be paused during bulk operations:

```javascript
SvSyncScheduler.shared().pause();
// ... bulk model changes ...
SvSyncScheduler.shared().resume();
// All pending syncs execute now
```

The app startup sequence uses this to prevent premature sync cycles during model and UI initialization.
