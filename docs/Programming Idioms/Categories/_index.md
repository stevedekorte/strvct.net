# Categories

Extending existing classes by adding methods from separate files.

## Overview

Categories allow you to add methods to an existing class without modifying its original file. This is borrowed from Objective-C/Smalltalk traditions and is used throughout STRVCT to separate concerns — keeping core class files focused on essential functionality while adding specialized behavior in dedicated files.

A category is a class that extends the target class but calls `initThisCategory()` instead of `initThisClass()`. The framework copies the category's methods onto the target class's prototype rather than creating a new class in the hierarchy.

## Defining a category

```javascript
// SvJsonGroup_patches.js — adds JSON Patch support to SvJsonGroup
(class SvJsonGroup_patches extends SvJsonGroup {

    applyJsonPatches (patches) {
        // patch implementation
    }

    applyPatch (operation) {
        // single patch operation
    }

}.initThisCategory());
```

The key difference from a normal class: `.initThisCategory()` instead of `.initThisClass()`. This tells the framework to merge the methods into the parent class rather than registering a new class.

## Naming convention

Category files use an underscore to separate the base class name from the category purpose:

```
SvJsonGroup.js                  // base class
SvJsonGroup_patches.js          // JSON Patch operations
SvJsonGroup_clientState.js      // client state tool methods
```

The category class name follows the same pattern: `SvJsonGroup_patches`, `Array_promises`, `Promise_ideal`.

## Loading order

Base classes must be loaded before their categories. In `_imports.json` files, list the base class first:

```json
[
    "SvJsonGroup.js",
    "SvJsonGroup_patches.js",
    "SvJsonGroup_clientState.js"
]
```

If a category loads before its base class, the `extends` clause will fail because the base class doesn't exist yet.

## Extending JavaScript builtins

Categories are commonly used to extend native JavaScript classes. The boot system includes several:

```javascript
// Promise_ideal.js — adds clone(), status tracking, timeouts
(class Promise_ideal extends Promise {
    static clone () { /* ... */ }
    callResolveFunc (...args) { /* ... */ }
    isPending () { /* ... */ }
}.initThisCategory());

// Array_promises.js — adds async iteration methods
(class Array_promises extends Array {
    async promiseSerialForEach (aBlock) { /* ... */ }
    async promiseParallelMap (aBlock) { /* ... */ }
}.initThisCategory());
```

After these categories load, every `Promise` and `Array` instance has the new methods — no imports needed.

## When to use categories

**Good uses:**

- Separating a large class into thematic files (e.g., persistence, UI, serialization)
- Adding framework methods to JavaScript builtins
- Adding app-specific behavior to framework classes without forking them
- Keeping a base class stable while iterating on extensions

**Avoid when:**

- The methods need their own slots or state — categories can't add slots, only methods
- You need polymorphism (override behavior in subclasses) — a subclass is the right tool
- The base class is in an external library that doesn't use the STRVCT class system

## How it works internally

`initThisCategory()` iterates over the category class's own methods (both prototype and static) and copies them onto the target class. It does not create a new entry in the class registry — `SvJsonGroup_patches` is not a class you can instantiate or look up by name. It's purely a delivery mechanism for methods.

This means:

- `instanceof` checks are unaffected — an `SvJsonGroup` instance won't show as `instanceof SvJsonGroup_patches`
- Category methods have full access to `this` and the base class's slots and methods
- If two categories define the same method name on the same base class, the last one loaded wins (with a warning)

## Related patterns

- [Slot Patterns](../Slot%20Patterns/index.html) — how to declare properties on classes
- [Lifecycle](../../Lifecycle/index.html) — `initPrototypeSlots` / `initPrototype` and the initialization chain, which categories cannot participate in (only methods are merged)
