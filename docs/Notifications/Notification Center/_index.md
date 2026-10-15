# Notification Center

Asynchronous event dispatching, weak observer observations, and decoupled change propagation in `SvNotificationCenter`.

## Overview

`SvNotificationCenter` is Strvct's primary loose-coupling mechanism. It allows model nodes, views, and framework services to communicate without holding direct references to each other.

```
+-------------------------------------------------------------------------+
|                    Notification Center Architecture                     |
+-------------------------------------------------------------------------+
|  1. Post Notification  -->  2. Weak Observer Lookup  -->  3. Dispatch   |
+-------------------------------------------------------------------------+
```

<svg viewBox="0 0 820 170" width="820" xmlns="http://www.w3.org/2000/svg">
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

  <rect class="box" x="25" y="20" width="240" height="50"/>
  <text x="40" y="40" class="b">Sender Node</text>
  <text x="40" y="58" class="dim">posts named notification</text>

  <line class="flow-dashed" x1="265" y1="45" x2="290" y2="45" marker-end="url(#anc)"/>

  <rect class="fill" x="290" y="20" width="240" height="50"/>
  <text x="305" y="40" class="b">SvNotificationCenter</text>
  <text x="305" y="58" class="dim">Lookup weak observers</text>

  <line class="flow" x1="530" y1="45" x2="555" y2="45" marker-end="url(#anc)"/>

  <rect class="box" x="555" y="20" width="240" height="50"/>
  <text x="570" y="40" class="b">Observer Target</text>
  <text x="570" y="58" class="dim">Executes handler method</text>

  <text x="410" y="110" text-anchor="middle" class="dim">Observers are held via weak references, preventing memory leaks when views or temporary objects are unmounted.</text>
</svg>

---

## Observing Notifications

Objects register to observe named notifications posted by specific target senders (or all senders):

```javascript
// Register an observer for a specific target node
SvNotificationCenter.shared().newObservation()
    .setSender(characterNode)
    .setName("didChangeSlot")
    .setObserver(viewInstance)
    .setMethodName("onCharacterChanged")
    .watch();
```

---

## Weak References & Memory Safety

Traditional event emitter listeners cause severe memory leaks if observers forget to unregister before being garbage collected. `SvNotificationCenter` eliminates this vulnerability by storing observers in **weak reference maps** (`WeakRef`).

When an observing view is removed from the DOM and has no remaining strong references, JavaScript's garbage collector automatically reclaims it. `SvNotificationCenter` silently prunes dead weak references during dispatch passes without throwing errors.

---

## Related Guides

- [Sync Scheduler](../Sync%20Scheduler/): Coalescing high-frequency notification dispatches.
- [Broadcaster](../Broadcaster/): Synchronous inline event broadcasting.
- [Slot Change Hooks](../Slot%20Change%20Hooks/): Declarative model change hooks.
