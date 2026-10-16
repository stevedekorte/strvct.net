# Notification Center

Asynchronous event dispatching, dual WeakMap observation indexing, and decoupled change propagation in `SvNotificationCenter`.

## Overview

In a framework where model, view, and storage layers must stay independent, objects announce state changes without holding direct references to observers. Direct method calls create tight coupling—the sender must hold a reference to every observer, and adding a new listener requires modifying sender code.

`SvNotificationCenter` solves this: senders post named notifications into a shared center, observers register interest by name and sender, and the two sides never reference each other directly.

<svg viewBox="0 0 820 220" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
    .flow-dashed { stroke: #111; stroke-width: 1; fill: none; stroke-dasharray: 4 3; }
  </style>
  <defs>
    <marker id="anc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <!-- 3 Columns: Senders, NotificationCenter, Observers (w: 240, h: 50) -->
  <rect class="box" x="25" y="20" width="240" height="170"/>
  <text x="40" y="42" class="b">Sender Objects (SvNode)</text>

  <rect class="fill" x="40" y="60" width="210" height="40"/>
  <text x="55" y="84" class="dim">this.postNoteNamed("didChange")</text>

  <rect class="fill" x="40" y="115" width="210" height="40"/>
  <text x="55" y="139" class="dim">newNote().setInfo({...}).post()</text>

  <line class="flow-dashed" x1="265" y1="105" x2="290" y2="105" marker-end="url(#anc)"/>

  <rect class="fill" x="290" y="20" width="240" height="170"/>
  <text x="305" y="42" class="b">SvNotificationCenter</text>

  <rect class="box" x="305" y="60" width="210" height="40"/>
  <text x="320" y="80" class="b">_senderToObservations</text>
  <text x="320" y="93" class="dim">WeakMap index for O(1) lookup</text>

  <rect class="box" x="305" y="115" width="210" height="40"/>
  <text x="320" y="135" class="b">_nameToObservations</text>
  <text x="320" y="148" class="dim">WeakMap index by name</text>

  <line class="flow" x1="530" y1="105" x2="555" y2="105" marker-end="url(#anc)"/>

  <rect class="box" x="555" y="20" width="240" height="170"/>
  <text x="570" y="42" class="b">Observer Objects (SvNodeView)</text>

  <rect class="fill" x="570" y="60" width="210" height="40"/>
  <text x="585" y="84" class="dim">View A: didChange(note)</text>

  <rect class="fill" x="570" y="115" width="210" height="40"/>
  <text x="585" y="139" class="dim">View B: customHandler(note)</text>

  <text x="410" y="205" text-anchor="middle" class="dim">WeakRef observer storage prevents retain cycles; unmounted views are reclaimed automatically without manual unwatching.</text>
</svg>

---

## Posting Notifications

Senders post notifications when their state mutates:

```javascript
// Convenience method on SvNode:
this.postNoteNamed("didUpdateNode");

// Advanced notification with info dictionary:
SvNotificationCenter.shared().newNote()
    .setSender(this)
    .setName("didUpdateNode")
    .setInfo({ fieldName: "title", oldValue: "Draft", newValue: "Final" })
    .post();
```

---

## Observing Notifications & Convention Handlers

Objects register observations using `newObservation()`:

```javascript
// Register observation
SvNotificationCenter.shared().newObservation()
    .setSender(targetNode)
    .setName("didUpdateNode")
    .setObserver(this)
    .startWatching();
```

### Handler Method Resolution:
- **Default Convention:** When `targetNode` posts `"didUpdateNode"`, the notification center automatically calls `this.didUpdateNode(note)` on the observer if defined.
- **Explicit Override:** To direct dispatch to a different method name, call `setSendName()`:

```javascript
obs.setSendName("handleNodeUpdate");
```

---

## Dual WeakMap Indexing & Memory Safety

To minimize dispatch overhead as domain graphs grow, `SvNotificationCenter` maintains two internal index maps:
1. `_senderToObservations`: A `WeakMap` mapping senders to their registered observations.
2. `_nameToObservations`: A `WeakMap` mapping notification names to observations.

During a post operation, the notification center intersects the two maps to retrieve target observations in $O(\text{observations on sender})$ time, avoiding full-table scans.

### Memory Leak Protection:
Observers are held in **`WeakRef`** wrappers. When an observing view is removed from the DOM and has no remaining strong references, JavaScript's garbage collector automatically reclaims it. Dead observations are cleaned up during dispatch passes without throwing errors.

---

## Related Guides

- [Sync Scheduler](../Sync%20Scheduler/): Coalescing high-frequency notification dispatches.
- [Broadcaster](../Broadcaster/): Synchronous inline event broadcasting.
- [Slot Change Hooks](../Slot%20Change%20Hooks/): Declarative model setter hooks.
