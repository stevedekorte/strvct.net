# Slot Change Hooks

Declarative lifecycle hooks invoked automatically during slot mutation.

## Overview

When an auto-generated slot setter runs (e.g. `setName("Thorin")`), it checks for optional convention-based hook methods on the owning object before and after mutating internal state:

```javascript
(class Character extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("level", 1);
            slot.setSlotType("Number");
            slot.setSyncsToView(true);
        }
    }

    // Optional hook called BEFORE value is mutated
    willUpdateSlotLevel (oldValue, newValue) {
        console.log("Level changing from", oldValue, "to", newValue);
    }

    // Optional hook called AFTER value is mutated
    didUpdateSlotLevel (oldValue, newValue) {
        this.recalculateHitPoints();
    }

}.initThisClass());
```

---

## Hook Lifecycle Sequence

1. **Setter Invoked:** `setName(newValue)`
2. **`willUpdateSlotName(oldVal, newVal)`:** Called if defined on the object.
3. **Value Assignment:** Internal private variable `_name` is updated.
4. **`didUpdateSlotName(oldVal, newVal)`:** Called if defined on the object.
5. **Mutation Notification:** If `setSyncsToView(true)` is set, posts `"didChangeSlot"` notification via `SvNotificationCenter`.

---

## Related Guides

- [Slots](../../Slots/): Complete guide to slot metadata and declarations.
- [Notification Center](../Notification%20Center/): Weak observer event dispatch.
