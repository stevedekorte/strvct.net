# Sync Scheduler

Coalescing, deduplication, and event-loop-deferred method execution in `SvSyncScheduler`.

## Overview

When multiple property slots mutate rapidly within a single user gesture (or batch data load), triggering a full UI re-render pass for every individual setter call would cause severe performance degradation and layout thrashing.

`SvSyncScheduler` solves this by **coalescing and deduplicating** target and method calls within the browser event loop:

<svg viewBox="0 0 820 170" width="820" xmlns="http://www.w3.org/2000/svg">
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

  <rect class="box" x="25" y="20" width="240" height="50"/>
  <text x="40" y="40" class="b">N Rapid Slot Mutations</text>
  <text x="40" y="58" class="dim">Schedules syncFromNode()</text>

  <line class="flow" x1="265" y1="45" x2="290" y2="45" marker-end="url(#ass)"/>

  <rect class="fill" x="290" y="20" width="240" height="50"/>
  <text x="305" y="40" class="b">SvSyncScheduler</text>
  <text x="305" y="58" class="dim">Deduplicates target/method</text>

  <line class="flow" x1="530" y1="45" x2="555" y2="45" marker-end="url(#ass)"/>

  <rect class="fill" x="555" y="20" width="240" height="50"/>
  <text x="570" y="40" class="b">End of Event Loop</text>
  <text x="570" y="58" class="dim">Executes 1 single UI pass</text>

  <text x="410" y="110" text-anchor="middle" class="dim">100 slot property mutations in 1 frame trigger exactly 1 UI render pass at the end of the loop.</text>
</svg>

---

## Usage Pattern

Views and persistent objects register deferred sync requests with `SvSyncScheduler`:

```javascript
// Schedule a deferred method execution
SvSyncScheduler.shared().scheduleTargetAndMethod(view, "syncFromNode");
```

Regardless of how many times `scheduleTargetAndMethod(view, "syncFromNode")` is invoked during the current event loop, `view.syncFromNode()` executes **exactly once** when the scheduler flushes.

---

## Related Guides

- [Notification Center](../Notification%20Center/): Asynchronous weak observation dispatch.
- [Broadcaster](../Broadcaster/): Synchronous event broadcasting.
