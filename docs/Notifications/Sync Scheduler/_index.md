# Sync Scheduler

Deferred, deduplicated method calls with priority ordering and loop detection.

## Overview

View synchronization and storage writes don't need the notification center's broadcast generality — there's no unknown set of observers, just a specific method on a specific object that needs to run. But without coalescing, the same sync could be requested dozens of times per event loop as multiple slots change. Calling it each time wastes work; calling it zero times loses data.

`SvSyncScheduler` solves this by ensuring a given target/method pair runs exactly once per event loop, no matter how many code paths request it. It also provides priority ordering so that view-to-model syncs (user edits) complete before model-to-view syncs (reactive updates), preventing stale data from overwriting user input.

The notification center uses `SvSyncScheduler` internally for its own dispatch, so notification delivery and view synchronization are handled in the same deferred processing pass.

<svg viewBox="0 0 820 340" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="ass" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>
  <rect class="box" x="40" y="20" width="350" height="295"/>
  <text x="55" y="42" class="b">Incoming requests</text>
  <text x="55" y="62" class="dim">multiple calls, any order</text>
  <rect class="fill" x="55" y="80" width="320" height="40"/>
  <text x="70" y="105" class="dim">A.syncToView  (priority 2)</text>
  <rect class="fill" x="55" y="130" width="320" height="40"/>
  <text x="70" y="155" class="dim">B.syncFromView  (priority 0)</text>
  <rect class="fill" x="55" y="180" width="320" height="40"/>
  <text x="70" y="205" class="dim">A.syncToView  (priority 2)  · duplicate, ignored</text>
  <rect class="fill" x="55" y="230" width="320" height="40"/>
  <text x="70" y="255" class="dim">M.commit  (priority 1)</text>
  <line class="flow" x1="390" y1="170" x2="430" y2="170" marker-end="url(#ass)"/>
  <text x="410" y="160" text-anchor="middle" class="dim">drain</text>
  <rect class="box" x="430" y="20" width="350" height="295"/>
  <text x="445" y="42" class="b">Drain (end of event loop)</text>
  <text x="445" y="62" class="dim">deduplicated, in priority order</text>
  <rect class="fill" x="445" y="80" width="320" height="40"/>
  <text x="460" y="105" class="dim">1. B.syncFromView()  · priority 0</text>
  <rect class="fill" x="445" y="130" width="320" height="40"/>
  <text x="460" y="155" class="dim">2. M.commit()  · priority 1</text>
  <rect class="fill" x="445" y="180" width="320" height="40"/>
  <text x="460" y="205" class="dim">3. A.syncToView()  · priority 2</text>
  <text x="605" y="255" text-anchor="middle" class="dim">each (target, method) pair</text>
  <text x="605" y="275" text-anchor="middle" class="dim">runs exactly once per loop</text>
</svg>

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
