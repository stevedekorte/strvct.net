# Broadcaster

Lightweight synchronous dispatch for high-frequency internal events.

## Overview

Some internal framework events — like storage-layer slot propagation — need to arrive immediately, not at the end of the event loop. Deferral would mean downstream code sees stale state between the change and the next microtask. The notification center's queuing and deduplication are liabilities here, not features.

`SvBroadcaster` is a minimal synchronous alternative. Broadcasts execute immediately when posted — no queue, no deduplication, no event-loop delay. The tradeoff is less sophistication (no sender filtering, no pattern matching), which is fine for high-frequency internal events where the simplicity is the point.

<svg viewBox="0 0 820 260" width="820" xmlns="http://www.w3.org/2000/svg">
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
  <rect class="fill" x="40" y="100" width="160" height="60"/>
  <text x="120" y="125" text-anchor="middle" class="b">Caller</text>
  <text x="120" y="145" text-anchor="middle" class="dim">broadcast("name1", arg)</text>
  <line class="flow" x1="200" y1="130" x2="280" y2="130" marker-end="url(#abc)"/>
  <rect class="box" x="280" y="20" width="280" height="220"/>
  <text x="295" y="42" class="b">SvBroadcaster</text>
  <text x="295" y="62" class="dim">synchronous · no queue · no dedup</text>
  <text x="420" y="125" text-anchor="middle" class="dim">immediate dispatch</text>
  <text x="420" y="145" text-anchor="middle" class="dim">to matching listeners</text>
  <line class="flow" x1="560" y1="75" x2="620" y2="75" marker-end="url(#abc)"/>
  <line class="flow" x1="560" y1="205" x2="620" y2="205" marker-end="url(#abc)"/>
  <rect class="fill" x="620" y="50" width="160" height="50"/>
  <text x="700" y="73" text-anchor="middle" class="b">Listener X</text>
  <text x="700" y="91" text-anchor="middle" class="dim">listens for "name1"</text>
  <rect class="fill" x="620" y="115" width="160" height="50"/>
  <text x="700" y="138" text-anchor="middle" class="b">Listener Y</text>
  <text x="700" y="156" text-anchor="middle" class="dim">listens for "name2"</text>
  <rect class="fill" x="620" y="180" width="160" height="50"/>
  <text x="700" y="203" text-anchor="middle" class="b">Listener Z</text>
  <text x="700" y="221" text-anchor="middle" class="dim">listens for "name1"</text>
</svg>

## Usage

```javascript
// Register a listener
SvBroadcaster.shared().addListenerForName(this, "didChangeStoredSlot");

// Broadcast (immediate, synchronous)
SvBroadcaster.shared().broadcastNameAndArgument("didChangeStoredSlot", this);
```

When the broadcast fires, the system calls the listener's method matching the broadcast name — in this case, `this.didChangeStoredSlot(argument)`.

## When to Use Broadcaster vs. Notification Center

| | SvNotificationCenter | SvBroadcaster |
|---|---|---|
| **Timing** | Deferred to end of event loop | Immediate, synchronous |
| **Deduplication** | Same name+sender dispatched once per loop | Every call dispatches |
| **Registration** | SvObservation with name, sender, observer | Listener + name |
| **Sender filtering** | Can observe a specific sender | Receives from all senders |
| **Overhead** | Higher (queuing, indexing, dedup) | Lower |

Use the notification center for most inter-layer communication — the deferred deduplication is almost always what you want. Use the broadcaster for internal framework events that need synchronous delivery and where the slight overhead of the notification center matters, such as storage-layer slot change propagation.
