# Categories

Extending existing classes by adding methods from separate files without subclassing.

## Overview

Categories allow developers to add methods to an existing class without modifying its original file. Borrowed from Objective-C and Smalltalk traditions, categories are used throughout STRVCT to separate concerns—keeping core class files focused on essential logic while adding specialized behaviors in dedicated extension files.

A category is a class that extends the target class but executes **`.initThisCategory()`** instead of `.initThisClass()`. The framework copies the category's prototype and static methods onto the target class's prototype rather than creating a new class entry in the registry.

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
    <marker id="aca" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="box" x="25" y="20" width="240" height="170"/>
  <text x="40" y="42" class="b">Category Extension File</text>

  <rect class="fill" x="40" y="60" width="210" height="40"/>
  <text x="55" y="80" class="b">class SvJsonGroup_patches</text>
  <text x="55" y="93" class="dim">Extends base class</text>

  <rect class="fill" x="40" y="115" width="210" height="40"/>
  <text x="55" y="135" class="b">.initThisCategory()</text>
  <text x="55" y="148" class="dim">Executes method merge</text>

  <line class="flow" x1="265" y1="105" x2="290" y2="105" marker-end="url(#aca)"/>

  <rect class="fill" x="290" y="20" width="240" height="170"/>
  <text x="305" y="42" class="b">Method Merge Engine</text>

  <rect class="box" x="305" y="60" width="210" height="40"/>
  <text x="320" y="80" class="b">Prototype Methods</text>
  <text x="320" y="93" class="dim">Copied to base prototype</text>

  <rect class="box" x="305" y="115" width="210" height="40"/>
  <text x="320" y="135" class="b">Static Methods</text>
  <text x="320" y="148" class="dim">Copied to base constructor</text>

  <line class="flow" x1="530" y1="105" x2="555" y2="105" marker-end="url(#aca)"/>

  <rect class="box" x="555" y="20" width="240" height="170"/>
  <text x="570" y="42" class="b">Target Base Class</text>

  <rect class="fill" x="570" y="60" width="210" height="40"/>
  <text x="585" y="80" class="b">SvJsonGroup Prototype</text>
  <text x="585" y="93" class="dim">Gains applyJsonPatches()</text>

  <rect class="fill" x="570" y="115" width="210" height="40"/>
  <text x="585" y="135" class="b">instanceof Unchanged</text>
  <text x="585" y="148" class="dim">No extra prototype layer</text>
</svg>

---

## Defining a Category (`.initThisCategory()`)

```javascript
// SvJsonGroup_patches.js — adds JSON Patch methods to SvJsonGroup
(class SvJsonGroup_patches extends SvJsonGroup {

    applyJsonPatches (patches) {
        // Implementation
    }

    applyPatch (operation) {
        // Single patch operation
    }

}.initThisCategory());
```

Executing `.initThisCategory()` instructs the class registration system to merge all prototype and static methods into the parent class (`SvJsonGroup`). No new class entry is created in the global class registry.

---

## Naming Conventions & `_imports.json` Order

- **File & Class Naming:** Category files and classes use an underscore to separate the target base class name from the category purpose:
  `SvJsonGroup_patches.js`, `Array_promises.js`, `Promise_ideal.js`.
- **Import Dependency Order:** The base class **must** be listed before its category files in `_imports.json`:

```json
[
    "SvJsonGroup.js",
    "SvJsonGroup_patches.js",
    "SvJsonGroup_clientState.js"
]
```

---

## Extending JavaScript Builtins

Categories are used heavily during boot to extend native JavaScript objects without polluting the global scope with global functions:

```javascript
// Promise_ideal.js — adds clone(), status tracking, and timeouts
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

---

## Category Constraints & Rules

1. **No New Slots:** Categories can only add methods—they **cannot** add new slots via `initPrototypeSlots()`, as prototype slots must be defined during initial class registration.
2. **`instanceof` Compatibility:** `instanceof` checks are completely unaffected. An instance of `SvJsonGroup` answers `true` for `instanceof SvJsonGroup` and does not add a prototype link layer.
3. **Full `this` Access:** Category methods execute with full access to `this` and all slots and methods of the base class.

---

## Related Guides

- [Protocols](../Protocols/index.html): Interface declaration and conformance checking.
- [Style Guide](../Style%20Guide/index.html): Coding standards and class patterns.
