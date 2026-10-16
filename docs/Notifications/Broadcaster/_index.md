# Broadcaster

Immediate, synchronous event broadcasting across object trees in `SvBroadcaster`.

## Overview

While `SvNotificationCenter` handles loose asynchronous change observations and `SvSyncScheduler` handles event-loop deferred rendering passes, **`SvBroadcaster`** handles **immediate, synchronous event broadcasts** down or up object subtrees.

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
    <marker id="abc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="box" x="25" y="20" width="240" height="50"/>
  <text x="40" y="40" class="b">Root Node / View</text>
  <text x="40" y="58" class="dim">Invokes broadcast()</text>

  <line class="flow" x1="265" y1="45" x2="290" y2="45" marker-end="url(#abc)"/>

  <rect class="fill" x="290" y="20" width="240" height="50"/>
  <text x="305" y="40" class="b">SvBroadcaster</text>
  <text x="305" y="58" class="dim">Synchronous tree traversal</text>

  <line class="flow" x1="530" y1="45" x2="555" y2="45" marker-end="url(#abc)"/>

  <rect class="fill" x="555" y="20" width="240" height="50"/>
  <text x="570" y="40" class="b">Subtree Nodes</text>
  <text x="570" y="58" class="dim">Immediate method execution</text>

  <text x="410" y="110" text-anchor="middle" class="dim">Used for high-priority synchronous signals like window resizing, theme switching, or modal dismissals.</text>
</svg>

---

## Related Guides

- [Notification Center](../Notification%20Center/index.html): Weak observer event dispatch.
- [Sync Scheduler](../Sync%20Scheduler/index.html): Coalesced event loop scheduling.
