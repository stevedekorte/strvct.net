# STRVCT

A JavaScript framework where you define the domain model and the UI, persistence, and navigation are handled automatically.

STRVCT implements the [naked objects](https://en.wikipedia.org/wiki/Naked_objects) pattern: annotated model classes generate complete, navigable interfaces without writing view code. Properties become editable fields. Object hierarchies become drill-down navigation. Storage is transparent. The developer works entirely in the domain model; the framework handles everything else.

## Why

The conventional approach to application development is to hand-craft a bespoke interface for every domain object — custom forms, custom layouts, custom views. This works early on, but it doesn't scale: every new model class or schema change carries a linear (or worse) UI cost. The model, the views, and the persistence layer all describe the same structure in different ways, and keeping them in sync is where most of the work goes.

STRVCT eliminates this by making the model the single source of truth. Slots carry metadata — type, editability, persistence flags, view sync — and each framework layer reads only the annotations it needs. Adding a property to a model class automatically makes it editable in the UI, persisted to storage, and synchronized across layers. No glue code, no separate schema definitions, no view templates.

## How it works

Define a model class with annotated slots:

```javascript
(class Contact extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(true);
        }
        {
            const slot = this.newSlot("email", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(true);
        }
        {
            const slot = this.newSlot("notes", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setNodeCanEditTitle(true);
        this.setTitle("New Contact");
    }

}.initThisClass());
```

This produces an editable, navigable, persistent contact — no view code, no storage code, no routing. The framework generates the UI from the slot annotations, persists to IndexedDB automatically, and creates navigation from the object hierarchy.

For a complete working application (app class, model, collection, and project setup), see the [Example App](https://strvct.net/Example%20App/) walkthrough.

## What you get

**Auto-generated UI.** Every node gets a visual representation. The framework discovers view classes by naming convention, creates tile-based navigation columns, and keeps views synchronized with the model through a batched notification system. Custom views are available when needed but rarely are — the generated interface handles the common case.

**Transparent persistence.** Mark a class as storable and its slots as persistent. Changes are tracked automatically, batched at the end of each event loop, and committed to IndexedDB. Objects loaded from storage go through the same initialization lifecycle as new objects — no separate code paths for "new" vs. "loaded."

**Model-driven navigation.** The object graph becomes the navigation structure. Nested objects produce drill-down columns. Orientation (horizontal or vertical) is set per node. Breadcrumbs, column compaction on narrow viewports, keyboard navigation, and long-press reordering are built in. No routing configuration.

**Programmatic styling.** All styling uses named JavaScript methods (`setBackgroundColor()`, `setFlexDirection()`, `setPadding()`) rather than CSS files. Themes are swappable dictionaries scoped to any subtree. This avoids the combinatorial explosion of CSS selectors for interactive view states.

**Reactive synchronization.** Slot changes trigger notifications automatically. A sync scheduler batches and deduplicates updates, preventing redundant DOM work. Weak references on all observations mean garbage collection handles cleanup — no manual unsubscribe.

**Content-addressable resource loading.** A custom build system creates SHA-256-hashed resource bundles. Unchanged content is never re-downloaded, even across deployments. Identical code across files is deduplicated. Second-load performance is limited only by cache hits, not bundle size.

## Architecture

```
Model layer          SvNode → slots, subnodes, notifications
                        ↕ (automatic, bidirectional)
View layer           DomView hierarchy → tiles, columns, navigation
                        ↕ (automatic)
Persistence layer    PersistentObjectPool → IndexedDB
```

The model posts notifications but never references views. Views observe notifications but never modify model internals directly — they call action methods that the model defines. Persistence hooks into slot change tracking transparently. Each layer can be understood, tested, or replaced independently.

### View class hierarchy

Each layer adds one capability:

`ElementDomView` → `VisibleDomView` → `ResponderDomView` → `ListenerDomView` → `ControlDomView` → `SelectableDomView` → `EditableDomView` → `GesturableDomView` → `FlexDomView` → `StyledDomView` → `SubviewsDomView` → `CssDomView` → `DomView` → `NodeView`

### Node initialization

Three-phase lifecycle that works for both new and deserialized objects:

1. **`init()`** — primitives, slot defaults
2. **`finalInit()`** — complex child objects (skipped if already loaded from storage)
3. **`afterInit()`** — full object graph is ready

## Self-contained

STRVCT does not use npm or JavaScript package managers. A handful of third-party libraries (pako, htmlparser2, jwt-decode, js-sha256, simple-peer) are included as source files in `external-libs/` and loaded through the framework's own module system. State management, persistence, navigation, resource loading, gesture recognition, and the build system are all built in. The framework uses a content-addressable module system rather than ES module imports — `_imports.json` files declare dependencies, and the build tools produce optimized bundles.

## Production use

STRVCT is used in production by [undreamedof.ai](https://undreamedof.ai), an AI-powered virtual tabletop for D&D with ~90 domain classes covering characters, campaigns, multiplayer sessions, and AI integration. The auto-generated interface handles ~90% of screens; fewer than 10 custom views are needed, all for inherently graphical domains (3D dice, chat, maps).

## Documentation

Full documentation is available at [strvct.net](https://strvct.net).

## License

MIT. See [LICENSE.txt](LICENSE.txt).
