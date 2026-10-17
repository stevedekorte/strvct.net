# Style Guide

Coding conventions, self-initializing class patterns, method chaining, and file structure rules across STRVCT.

## Overview

STRVCT follows smalltalk-inspired JavaScript coding conventions to ensure codebase consistency, high-signal readability, and predictable framework behavior.

---

## 1. Class Declaration & Self-Registration Pattern

Classes are wrapped in IIFE closures and self-register using `.initThisClass()` (or `.initThisCategory()` for categories):

```javascript
(class Character extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }
    }

    initPrototype () {
        this.setTitle("Character");
        this.setShouldStore(true);
    }

    init () {
        super.init();
        // Basic instance setup
    }

    finalInit () {
        super.finalInit();
        // Post-deserialization relationship wiring
    }

}.initThisClass());
```

---

## 2. Naming Conventions

- **Class Names:** PascalCase with framework prefix (`SvNode`, `SvStackView`, `SvPersistentObjectPool`).
- **Category Files & Classes:** Base class name + underscore + category purpose (`SvJsonGroup_patches.js`, `Array_promises.js`).
- **Protocols:** Always end with `Protocol` (`SvAudioClipProtocol`, `SvDragSourceProtocol`).
- **Slot Getters & Setters:** Getter matches slot name (`node.name()`); setter prepends `set` (`node.setName("Thorin")`).
- **Boolean Methods:** Prepend `is`, `has`, `should`, or `can` (`node.isSubnode()`, `slot.shouldStoreSlot()`, `view.canInspect()`).

---

## 3. Chained Method Setters

All configuration setters on views and slots return `this` to allow clean method chaining:

```javascript
const view = SvDomView.clone()
    .setPosition("absolute")
    .setTop("0px")
    .setLeft("0px")
    .setWidth("100%")
    .setHeight("100%")
    .setBackgroundColor("#111");
```

---

## 4. `_imports.json` Dependency Ordering

Every folder specifies its resource list and subfolder dependencies in `_imports.json`. Base class files **must** precede category extensions or subclass files:

```json
[
    "_css.css",
    "SvNode.js",
    "SvNode_subnodes.js",
    "SvStorableNode.js"
]
```

---

## Related Guides

- [Categories](../Categories/index.html): Extending existing classes via categories.
- [Protocols](../Protocols/index.html): Interface declaration and conformance checks.
- [Async Patterns](../Async%20Patterns/index.html): Asynchronous array iteration and promise helpers.
