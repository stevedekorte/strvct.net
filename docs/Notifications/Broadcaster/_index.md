# Broadcaster

Lightweight synchronous dispatch for high-frequency internal events.

## Overview

Some internal framework events — like storage-layer slot propagation — need to arrive immediately, not at the end of the event loop. Deferral would mean downstream code sees stale state between the change and the next microtask. The notification center's queuing and deduplication are liabilities here, not features.

`SvBroadcaster` is a minimal synchronous alternative. Broadcasts execute immediately when posted — no queue, no deduplication, no event-loop delay. The tradeoff is less sophistication (no sender filtering, no pattern matching), which is fine for high-frequency internal events where the simplicity is the point.

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
