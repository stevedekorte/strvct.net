# Slot Change Hooks

Automatic per-slot callbacks that connect property changes to notifications and persistence.

## Overview

Without slot change hooks, every piece of code that modifies a property would also have to remember to post a notification, mark the object dirty for persistence, and trigger a view sync. That's three separate concerns that would have to be repeated at every call site — and forgetting any one of them causes silent bugs (stale views, lost data, missed observers).

Slot change hooks centralize this. When a slot value changes, the framework automatically calls a hook method on the owning object. This single integration point connects the slot system to notifications, persistence, and view synchronization — the developer changes a value, and everything downstream happens automatically.

<svg viewBox="0 0 820 400" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="asch" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>
  <rect class="fill" x="290" y="20" width="240" height="60"/>
  <text x="410" y="48" text-anchor="middle" class="b">slot setter</text>
  <text x="410" y="68" text-anchor="middle" class="dim">obj.setName("foo")</text>
  <line class="flow" x1="410" y1="80" x2="410" y2="115" marker-end="url(#asch)"/>
  <text x="425" y="100" class="dim">if value changed</text>
  <rect class="fill" x="290" y="115" width="240" height="60"/>
  <text x="410" y="143" text-anchor="middle" class="b">didUpdateSlot fires</text>
  <text x="410" y="163" text-anchor="middle" class="dim">per-slot hook + general hook</text>
  <line class="flow" x1="410" y1="175" x2="410" y2="200"/>
  <line class="flow" x1="230" y1="200" x2="590" y2="200"/>
  <line class="flow" x1="230" y1="200" x2="230" y2="225" marker-end="url(#asch)"/>
  <line class="flow" x1="590" y1="200" x2="590" y2="225" marker-end="url(#asch)"/>
  <rect class="fill" x="80" y="225" width="300" height="115"/>
  <text x="230" y="252" text-anchor="middle" class="b">if slot.shouldStoreSlot() is true</text>
  <text x="230" y="278" text-anchor="middle" class="dim">didMutate() marks object dirty;</text>
  <text x="230" y="298" text-anchor="middle" class="dim">persistence layer commits</text>
  <text x="230" y="320" text-anchor="middle" class="dim">at end of event loop</text>
  <rect class="fill" x="440" y="225" width="300" height="115"/>
  <text x="590" y="252" text-anchor="middle" class="b">if slot.syncsToView() is true</text>
  <text x="590" y="278" text-anchor="middle" class="dim">posts onUpdatedNode notification;</text>
  <text x="590" y="298" text-anchor="middle" class="dim">observing views schedule</text>
  <text x="590" y="320" text-anchor="middle" class="dim">syncFromNode via SyncScheduler</text>
  <text x="410" y="375" text-anchor="middle" class="dim">Each effect is gated by its slot's configuration flag; no manual save or notify calls at the call site.</text>
</svg>

## The Hook Convention

Define a method named `didUpdateSlot` + the capitalized slot name:

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

The hook receives the previous and new values. It fires after the slot has been set, so `this.health()` already returns `newValue` inside the hook.

## What Triggers a Hook

Hooks only fire when the value actually changes. Setting a slot to its current value is a no-op — no hook, no notification, no mutation tracking. This is what prevents infinite sync loops in bidirectional model-view synchronization.

## The General Hook

In addition to per-slot hooks, every slot change calls the general `didUpdateSlot(slot, oldValue, newValue)` method. This is useful for cross-cutting concerns like logging or validation:

```javascript
didUpdateSlot (slot, oldValue, newValue) {
    super.didUpdateSlot(slot, oldValue, newValue);
    console.log(slot.name() + " changed:", oldValue, "→", newValue);
}
```

## Connection to Persistence

For storable nodes, `didUpdateSlot` also calls `didMutate()`, which marks the object as dirty in the persistent store. The store auto-commits dirty objects at the end of the event loop. This is how slot changes automatically propagate to IndexedDB — no manual save calls needed.

## Connection to Views

Slots configured with `setSyncsToView(true)` trigger view synchronization when they change. The hook posts an `onUpdatedNode` notification, observing views schedule a `syncFromNode()` call, and the sync scheduler batches it to the end of the event loop. The full chain:

```
slot value changes
  → didUpdateSlot fires
    → didMutate() marks object dirty (persistence)
    → onUpdatedNode notification posted (views)
      → observing views schedule syncFromNode()
        → SvSyncScheduler batches and executes
```
