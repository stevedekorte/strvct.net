# Slots

The property system: declaration, slot annotations, runtime type checks, and metadata consumers.

## Overview

Slots are Strvct's property system. In traditional JavaScript objects, instance fields are simple key-value pairs without metadata. In Strvct, declaring a property as a **slot** transforms it into a rich metadata carrier that each framework layer reads independently.

<svg viewBox="0 0 820 220" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
  </style>
  <defs>
    <marker id="asl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <!-- Row 1: Centered Slot Metadata Box (w: 240, h: 50) -->
  <rect class="fill" x="290" y="20" width="240" height="50"/>
  <text x="305" y="40" class="b">Slot Declaration</text>
  <text x="305" y="58" class="dim">newSlot("name", "Thorin")</text>

  <!-- Flow to Bottom Row (3 Columns) -->
  <line class="flow" x1="410" y1="70" x2="410" y2="95"/>
  <line class="flow" x1="145" y1="95" x2="675" y2="95"/>

  <line class="flow" x1="145" y1="95" x2="145" y2="110" marker-end="url(#asl)"/>
  <line class="flow" x1="410" y1="95" x2="410" y2="110" marker-end="url(#asl)"/>
  <line class="flow" x1="675" y1="95" x2="675" y2="110" marker-end="url(#asl)"/>

  <!-- Row 2: 3 Uniform Boxes (w: 240, h: 50) -->
  <rect class="box" x="25" y="110" width="240" height="50"/>
  <text x="40" y="130" class="b">UI Layer</text>
  <text x="40" y="148" class="dim">Auto-generates Property Tiles</text>

  <rect class="box" x="290" y="110" width="240" height="50"/>
  <text x="305" y="130" class="b">Storage Layer</text>
  <text x="305" y="148" class="dim">Serializes shouldStoreSlot</text>

  <rect class="box" x="555" y="110" width="240" height="50"/>
  <text x="570" y="130" class="b">AI Agent Surface</text>
  <text x="570" y="148" class="dim">Generates JSON tool schemas</text>

  <text x="410" y="195" text-anchor="middle" class="dim">Slots decouple business logic from UI, persistence, and AI tools; declare metadata once, every layer benefits automatically.</text>
</svg>

---

## Declaration Syntax

Slots are declared inside `initPrototypeSlots()` during class registration. Declaring a slot installs a private variable (`_slotName`), an auto-generated getter (`slotName()`), and an auto-generated setter (`setSlotName(value)`) on the prototype:

```javascript
(class Character extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);   // Included in IndexedDB record rows
            slot.setSyncsToView(true);       // Posts didChangeSlot notification
            slot.setCanEditInspection(true); // Editable field in Property Inspector
        }
        {
            const slot = this.newSlot("level", 1);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
        }
    }

}.initThisClass());
```

---

## Slot Types & Constructor Variants

| Constructor | Purpose |
|---|---|
| `newSlot(name, defaultValue)` | Standard slot constructor with auto getter and setter. |
| `newWeakSlot(name, defaultValue)` | Creates a slot holding a `WeakRef`. Getter unwraps the reference; setter wraps it. Prevents retain cycles in parent-child back references. |
| `newSubnodeFieldSlot(name, Class)` | Convenience constructor for subnode field properties. |
| `overrideSlot(name, defaultValue)` | Overrides a slot inherited from a superclass, preserving metadata while changing the default value. |

---

## Runtime Type Checking

Auto-generated setters enforce **runtime type checks** against `setSlotType()`. When a type mismatch occurs (e.g. attempting to pass a string to a `Number` slot), the setter logs a warning and attempts safe type coercion (e.g. `Number("12")`), protecting object graph state from corrupt data.

---

## Related Guides

- [Nodes](../Nodes/): Core `SvNode` domain abstraction.
- [Implementation Overview](../../Implementation%20Overview/): Deep dive into slot specs and class lifecycles.
