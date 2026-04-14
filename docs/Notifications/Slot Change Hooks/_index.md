# Slot Change Hooks

Automatic per-slot callbacks that connect property changes to notifications and persistence.

## Overview

Without slot change hooks, every piece of code that modifies a property would also have to remember to post a notification, mark the object dirty for persistence, and trigger a view sync. That's three separate concerns that would have to be repeated at every call site — and forgetting any one of them causes silent bugs (stale views, lost data, missed observers).

Slot change hooks centralize this. When a slot value changes, the framework automatically calls a hook method on the owning object. This single integration point connects the slot system to notifications, persistence, and view synchronization — the developer changes a value, and everything downstream happens automatically.

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
