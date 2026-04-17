# Slots

The property system: declaration, annotations, and the most common slot settings.

## Overview

Slots are STRVCT's property system. A property declared as a slot is more than a value holder — it carries metadata that each framework layer (UI, storage, validation, JSON schema) reads independently. That metadata is what lets the framework auto-generate forms, persist state, sync views, and produce JSON schemas without per-property glue code.

Two things often surprise newcomers: the auto-generated setter **type-checks values at runtime** against the declared slot type (warning and attempting recovery on mismatch), and slots can hold **weak references** via `newWeakSlot`, which is the standard way to express back-references and non-owning pointers without creating retain cycles. Both are covered in detail below.

## Declaration

Slots are declared in a class's `initPrototypeSlots()` method. Each declaration creates a private instance variable (`_slotName`), an auto-generated getter (`slotName()`), and an auto-generated setter (`setSlotName(value)`).

```javascript
initPrototypeSlots () {
    {
        const slot = this.newSlot("userName", "");
        slot.setSlotType("String");
        slot.setShouldStoreSlot(true);
        slot.setSyncsToView(true);
        slot.setCanEditInspection(true);
    }
}
```

The block-scope pattern (`{ const slot = ... }`) is a convention that keeps each slot's configuration visually grouped and avoids name collisions across slots in the same method.

### Constructors

- `newSlot(name, initialValue)` — the standard constructor.
- `newWeakSlot(name, initialValue)` — creates a slot that holds a `WeakRef` to its value. The auto-generated getter unwraps the ref; the auto-generated setter wraps it. Useful for back-references (child → parent) and caches where you don't want to prevent garbage collection.
- `newSubnodeFieldSlot(name, ProtoClass)` — convenience for subnode-field slots (see below). Available on `SvJsonGroup` and descendants.
- `overrideSlot(name, initialValue)` — overrides a slot inherited from a parent class, preserving its configuration while changing the default value.

### Auto-generated getters

A plain getter returns the private ivar directly, but the framework first calls an optional `willGetSlotSlotName()` hook on the owning object if one is defined. This is the mechanism behind on-demand initialization for specific slots without having to subclass the setter.

For **weak slots**, the getter dereferences the underlying `WeakRef` transparently. If the target has been garbage-collected, the getter returns `undefined`.

### Auto-generated setters

The setter generated for a typed slot validates the incoming value against `slotType()`. If the value doesn't match, the setter logs a warning and attempts to recover — converting `Number` → `String` or `String` → `Number` where possible, falling back to the slot's initial value otherwise. Validation is on by default (`validatesOnSet` defaults to `true`); disable it with `slot.setValidatesOnSet(false)` when you need to store runtime values that intentionally don't match the declared type.

Setters also post a `didUpdateSlot` notification when the value changes, which is what drives view synchronization, persistence, and observers.

## Core annotations

### Type

```javascript
slot.setSlotType("String");
```

The type name is a string — either a primitive name (`"String"`, `"Number"`, `"Boolean"`, `"Map"`, `"Set"`, `"Array"`) or a class name (`"UoCharacter"`, `"SvNode"`). The framework uses this for:

- **Runtime validation** — the auto-generated setter rejects values of the wrong type.
- **UI generation** — the inspector picks an appropriate field widget (text input, number stepper, toggle, etc.).
- **JSON schema export** — translated to the corresponding JSON Schema type.
- **Persistence** — native collections (`Array`, `Map`, `Set`, `Object`, `ArrayBuffer`, `TypedArray`) are serialized automatically based on their declared type.

Type annotation is recommended for every slot. Debug builds assert that every prototype slot has a declared type.

### Persistence

```javascript
slot.setShouldStoreSlot(true);
```

Marks the slot as part of the object's persistence record. The object's class must also opt in via `setShouldStore(true)` in `initPrototype()`. When a stored slot changes, its owning object is added to the dirty set and committed at the end of the event loop.

- `setShouldJsonArchive(true)` — include the slot when the object is exported to JSON (separate from internal persistence format).
- `setIsInJsonSchema(true)` — include the slot in generated JSON schemas. Use for slots that should appear to AI assistants and external schema consumers.
- `setIsInCloudJson(true)` — include the slot when the object is serialized for cloud sync.

### View synchronization

```javascript
slot.setSyncsToView(true);
```

When the slot's value changes, schedule the owning node's view to re-sync. The sync scheduler batches and deduplicates updates, so multiple slot changes in the same event loop produce a single view refresh.

### Inspector and editing

```javascript
slot.setCanEditInspection(true);
```

Exposes the slot as an editable field in the auto-generated inspector. Related annotations:

- `setLabel("Display Name")` — override the auto-humanized label.
- `setLabelToCapitalizedSlotName()` — use the capitalized slot name as the label.
- `setDescription("Explanatory text")` — inspector hint text and JSON schema description.
- `setValuePlaceholder("Type your name")` — placeholder text for empty string fields.
- `setIsReadOnly(true)` — show the value but disable editing.
- `setIsRequired(true)` — mark as required for validation and schema export.

### Auto-initialization

```javascript
slot.setFinalInitProto(SettingsNode);
```

During `finalInit()`, if the slot's value is still its initial value (usually `null`), the framework creates a new instance of the given class and assigns it. This runs after storage-loaded values are populated, so `setFinalInitProto` doesn't overwrite loaded objects — it only fills in missing children. Use for nested sub-structures that should always exist.

### Validation

```javascript
slot.setValidValues(["small", "medium", "large"]);
```

- `setValidValues(array)` — restrict the value to one of the listed options. Produces a popup/dropdown in the inspector and a JSON Schema `enum`.
- `setValidItems(itemsArray)` — like `validValues` but for dictionary items (each item has a label and a value).
- `setJsonSchemaPattern(regex)` — string pattern constraint for schema validation.

## Subnode-related annotations

STRVCT has two distinct ways of exposing child objects in the UI. Choosing between them is one of the most important slot-design decisions.

### Stored subnodes

```javascript
slot.setIsSubnode(true);
```

The slot's value is treated as a persistent child node in the parent's `subnodes` array. The framework manages the parent/child relationship automatically — setting `ownerNode`, inserting into `subnodes`, and handling removal on clear. This is the right choice when the child has independent identity and lifecycle (a user-authored item in a list).

Most commonly used implicitly, through `SvJsonArrayNode`-style collections where each element is a subnode.

### Subnode fields

```javascript
slot.setIsSubnodeField(true);
```

The slot's value is still stored in the slot itself (not in the subnodes array), but the inspector presents it as a navigable tile. Clicking drills into the child object. The field is ephemeral UI structure; the data lives in the slot.

Use this for structured but always-present children (a `SettingsObject` that's part of every instance of the parent, or a `Stats` sub-record). The parent typically sets `shouldStoreSubnodes(false)` because the real data is in the slots, not the subnodes array.

`newSubnodeFieldSlot(name, ProtoClass)` is a convenience that applies the common settings together:

```javascript
const slot = this.newSubnodeFieldSlot("settings", SettingsObject);
// equivalent to: newSlot + setFinalInitProto + setIsSubnodeField
// + setShouldStoreSlot(true) + setShouldJsonArchive(true)
```

### Quick comparison

|                         | Subnode (`setIsSubnode`)             | Subnode field (`setIsSubnodeField`) |
|-------------------------|--------------------------------------|-------------------------------------|
| Data location           | Owner's `subnodes` array             | The slot itself                     |
| Typical use             | Collections of user-authored items   | Structured sub-records              |
| Parent config           | `shouldStoreSubnodes(true)`          | `shouldStoreSubnodes(false)`        |
| Identity                | Independent lifecycle                | Always present as part of parent    |

## Weak slots

```javascript
const slot = this.newWeakSlot("parentRef", null);
// or:
slot.setIsWeak(true);
```

A weak slot holds a `WeakRef` instead of a direct reference. The getter transparently dereferences; if the target has been collected, the getter returns `null` (or `undefined`). Use cases:

- **Back-references** (`childNode.parentRef()` → parent) where a strong ref would create a cycle that keeps nodes alive after their containing tree is released.
- **Caches and observation targets** where you want the reference to disappear automatically when the target is no longer used elsewhere.

Weak slots participate in the framework's `FinalizationRegistry`-based cleanup: when the referenced object is collected, `onFinalizedSlot()` is called on the owning object.

## Common recipes

Quick-reference for the most frequent slot configurations. These compose freely — a slot can be stored, view-synced, JSON-visible, and cloud-synced all at once.

### Stored property with view sync

```javascript
{
    const slot = this.newSlot("hitPoints", 0);
    slot.setSlotType("Number");
    slot.setShouldStoreSlot(true);
    slot.setSyncsToView(true);
    slot.setCanEditInspection(true);
}
```

### Transient (non-stored) property

Runtime-only state that resets on reload. Not persisted, not shown in the inspector.

```javascript
{
    const slot = this.newSlot("isLoading", false);
    slot.setSlotType("Boolean");
}
```

### Read-only display

A computed or system-managed value shown in the inspector but not editable.

```javascript
{
    const slot = this.newSlot("createdAt", null);
    slot.setSlotType("String");
    slot.setShouldStoreSlot(true);
    slot.setCanEditInspection(true);
    slot.setIsReadOnly(true);
}
```

### JSON-visible property

A slot included in JSON serialization for AI consumption or data exchange, with a schema description.

```javascript
{
    const slot = this.newSlot("characterClass", "Fighter");
    slot.setSlotType("String");
    slot.setShouldStoreSlot(true);
    slot.setIsInJsonSchema(true);
    slot.setShouldJsonArchive(true);
    slot.setDescription("The character's class (e.g., Fighter, Wizard, Rogue)");
}
```

### Cloud-synced property

A slot included when the object is serialized for cloud storage.

```javascript
{
    const slot = this.newSlot("lastModified", null);
    slot.setSlotType("Number");
    slot.setShouldStoreSlot(true);
    slot.setIsInCloudJson(true);
}
```

### Collection (stored subnodes)

A variable-length list of child objects. Each child is a subnode with independent identity.

```javascript
// In initPrototypeSlots():
{
    const slot = this.newSlot("subnodes", null);
    slot.setShouldStoreSlot(true);
}

// In initPrototype():
this.setShouldStoreSubnodes(true);
this.setSubnodeClasses([ItemNode]);  // accepted child types
```

Classes extending `SvJsonArrayNode` get this behavior by default.

## Full reference

The `Slot` class lives in `source/library/ideal/proto/Slot.js` and defines many more settings than are covered here — most application code will only use the ones above. Additional categories include:

- **Layout hints** — `setNodeFillsRemainingWidth`, `setKeyIsVisible`, `setValueWhiteSpace`, `setValueAllowsHtml`.
- **JSON schema refinement** — `setJsonSchema`, `setJsonSchemaItemsType`, `setJsonSchemaItemsRef`, `setJsonSchemaItemsDescription`, `setJsonSchemaItemsIsUnique`, `setExamples`.
- **Lifecycle / metadata** — `setAnnotation`, `setDuplicateOp`.

For the complete list, read `Slot.js` directly — the file is heavily commented and organized by category.
