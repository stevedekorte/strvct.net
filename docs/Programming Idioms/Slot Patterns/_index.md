# Slot Patterns

Common slot configurations for typical scenarios.

## Overview

The [Slots](../../Slots/index.html) page covers the full slot API. This page is a quick-reference for the most common combinations — the patterns you'll reach for repeatedly when defining classes.

## Simple stored property

A value that persists to IndexedDB and shows in the inspector.

```javascript
{
    const slot = this.newSlot("displayName", "");
    slot.setSlotType("String");
    slot.setShouldStoreSlot(true);
    slot.setCanEditInspection(true);
}
```

## Stored property with view sync

Same as above, but the view updates when the value changes.

```javascript
{
    const slot = this.newSlot("hitPoints", 0);
    slot.setSlotType("Number");
    slot.setShouldStoreSlot(true);
    slot.setSyncsToView(true);
    slot.setCanEditInspection(true);
}
```

## Enum / constrained value

A property restricted to a fixed set of choices. The inspector renders a dropdown.

```javascript
{
    const slot = this.newSlot("alignment", "neutral");
    slot.setSlotType("String");
    slot.setShouldStoreSlot(true);
    slot.setValidValues(["lawful", "neutral", "chaotic"]);
    slot.setCanEditInspection(true);
}
```

## Transient (non-stored) property

Runtime-only state that resets on reload. Not persisted, not shown in inspector.

```javascript
{
    const slot = this.newSlot("isLoading", false);
    slot.setSlotType("Boolean");
}
```

## Subnode field (always-present child)

A structured sub-object that's always part of the parent. Shows as a navigable tile in the inspector.

```javascript
{
    const slot = this.newSlot("settings", null);
    slot.setFinalInitProto(SettingsNode);
    slot.setIsSubnodeField(true);
    slot.setShouldStoreSlot(true);
}
```

The convenience form (available on `SvJsonGroup` descendants):

```javascript
{
    const slot = this.newSubnodeFieldSlot("settings", SettingsNode);
}
```

The parent class should set `shouldStoreSubnodes(false)` in `initPrototype()` — data lives in the slots, not the subnodes array.

## Collection (stored subnodes)

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

## Back-reference (weak slot)

A non-owning pointer to another node. Doesn't prevent garbage collection, doesn't create retain cycles.

```javascript
{
    const slot = this.newWeakSlot("parentSession", null);
    slot.setSlotType("UoSession");
}
```

The getter transparently dereferences the `WeakRef`. If the target has been collected, returns `null`.

## JSON-visible property

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

## Cloud-synced property

A slot included when the object is serialized for cloud storage.

```javascript
{
    const slot = this.newSlot("lastModified", null);
    slot.setSlotType("Number");
    slot.setShouldStoreSlot(true);
    slot.setIsInCloudJson(true);
}
```

## Read-only display

A computed or system-managed value shown in the inspector but not editable by the user.

```javascript
{
    const slot = this.newSlot("createdAt", null);
    slot.setSlotType("String");
    slot.setShouldStoreSlot(true);
    slot.setCanEditInspection(true);
    slot.setIsReadOnly(true);
}
```

## Combining patterns

These patterns compose freely. A property can be stored, view-synced, JSON-visible, and cloud-synced all at once — each annotation is independent. The common combinations above cover the vast majority of slot declarations; for the full set of annotations, see the [Slots](../../Slots/index.html) page.
