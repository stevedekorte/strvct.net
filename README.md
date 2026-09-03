# STRVCT

A JavaScript framework in which the domain model is the only thing you write. The interface, persistence, navigation, and synchronization are derived from it.

## The problem

Consider what it costs to add one property — say, `dueDate` — to a `Task` in a conventional application:

| Layer | What changes |
|---|---|
| Model / types | Add the field and its type |
| Validation | Add a rule, wire it to the field |
| Persistence | Add a column or schema entry, write a migration |
| Serialization | Update the encoder and decoder |
| API | Update the request/response type, regenerate client types |
| Form component | Add an input, bind it, handle change events |
| Detail view | Add a display element |
| List / table view | Decide whether it appears, add a column |
| State management | Add the field to the store, update selectors |
| Localization | Add a label key and translations |
| Accessibility | Add a label association, required flag |
| Tests | Update fixtures and snapshots in each of the above |

None of these steps is hard. The cost is that there are twelve of them, they live in different files owned by different tools, and every one is an opportunity for drift. The model, the views, the store, the schema, and the API are five descriptions of the same fact. Keeping them in agreement is not a one-time cost; it is paid on every change, and it grows with the size of the model. In a mature application this coordination — not any individual feature — is where most engineering time goes, and it is where most regressions come from.

In STRVCT the same change is one slot declaration:

```javascript
{
    const slot = this.newSlot("dueDate", null);
    slot.setSlotType("Date");
    slot.setShouldStoreSlot(true);
    slot.setCanEditInspection(true);
}
```

That declaration is read by every layer that needs it. The UI layer reads the type and editability and produces a date editor. The persistence layer reads the storage flag and tracks the slot for dirty-checking and commit. The synchronization layer observes it and schedules view updates. The accessibility layer derives ARIA attributes from it. The internationalization layer translates its label. Each layer reads only the annotations it cares about; none of them coordinate with each other; none of them can fall out of sync with the model because there is nothing separate to fall out of sync.

## The approach

STRVCT is an implementation of the [naked objects](https://en.wikipedia.org/wiki/Naked_objects) pattern: annotated domain classes generate a complete, navigable interface without hand-written view code. Properties become editable fields. Object hierarchies become drill-down navigation. Storage is transparent.

Naked objects has been demonstrated before (Apache Causeway, Naked Objects for .NET). Those systems proved that derivation works, but they rendered every object as a form and every collection as a table, which confined them to internal tools. STRVCT's contribution is a richer generated grammar — recursive, orientation-flexible master-detail views built from tiles, with collections projectable along semantic dimensions — that is expressive enough for products rather than only admin panels. The grammar is described in detail in [From Domain Models to Complete Applications](https://strvct.net/docs/Naked%20Objects/).

The framework is not a component library. It does not make view code cheaper to write; it removes the view tree as an authored artifact.

## How it works

Define a model class with annotated slots:

```javascript
(class Contact extends SvStorableNode {

    static jsonSchemaDescription () {
        return "A person's contact information";
    }

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
        this.setNodeCanInspect(true);
        this.setNodeCanEditTitle(true);
        this.setTitle("New Contact");
    }

    title () {
        return this.name() || "New Contact";
    }

    subtitle () {
        return this.email();
    }

}.initThisClass());
```

This produces an editable, navigable, persistent contact. No view code, no storage code, no routing. Views are found by naming convention — a `Contact` in a list would be drawn by a `ContactTile`, and a selected `Contact` by a `ContactView`, if those classes existed; since they don't, the lookup walks up the superclass chain and lands on the framework's defaults. A complete contacts application — app class, root model, collection, and the `Contact` above — is four classes; see the [Example App](https://strvct.net/Example%20App/).

## What the single source of truth buys you

**Synchronization that is solved once.** Slot changes post notifications automatically. A scheduler batches and deduplicates them at the end of each event loop, detects sync loops, and applies the minimum DOM work. Observations are held by weak reference, so there is no unsubscribe step and no leak from forgotten listeners. This is the machinery every reactive app builds and debugs itself; here it is built and debugged once, in one place.

**Persistence without a serialization layer.** Mark a class storable and its slots persistent. The framework tracks dirty state, commits to IndexedDB in batches, and garbage-collects unreachable objects. Loaded and newly created objects go through the same initialization lifecycle, so there is no separate code path for "restored from storage." Object pools can additionally sync to Firebase Storage through a write-ahead log of delta files.

**Navigation derived from structure.** The object graph is the navigation graph. Nested objects produce drill-down columns; orientation is set per node. Breadcrumbs, column compaction on narrow viewports, keyboard navigation, and long-press reordering are built in. There is no routing configuration because there is nothing to route: the user is always somewhere in the graph.

**A constant-size AI tool surface.** Because every editable class is described by the same annotations, an agent needs a single pair of read/write tools to operate the whole application. The tool surface does not grow as the model grows. The same property is what makes the model layer runnable headlessly in Node.js for testing and server-side work.

**Cross-cutting concerns for free.** Accessibility (ARIA roles, labels, required/min/max states) and internationalization (translation at the model-to-view boundary) are derived from slot metadata rather than wired into each component. Adding a property gets them automatically. Styling follows the same principle: views are styled through named methods (`setBackgroundColor()`, `setPadding()`) and themes are swappable dictionaries scoped to any subtree, so there is no CSS selector space to grow combinatorially across interactive states.

## Where the complexity goes

It is fair to ask where the coordination cost went, since it did not disappear. It moved into the framework, and the trade should be stated plainly.

A conventional application has *distributed, explicit* fragility: many small pieces of glue, each visible in your own code, each independently breakable. STRVCT has *centralized, implicit* machinery: one scheduler, one persistence pool, one view-discovery convention. Centralizing is the right trade — the machinery is written and tested once instead of per-feature — but implicit systems have a known failure mode: when something is wrong, the cause is action at a distance rather than a line in your file.

The framework takes this seriously. Sync-loop detection reports the cycle rather than hanging. Notification flow can be inspected at runtime. View classes are discovered by a naming convention that is easy to reason about (`Contact` → `ContactTile` / `ContactView`), and the fallback chain up the superclass hierarchy is deterministic. The debugging surface is the framework's scheduler and pool, and those are designed to be legible.

The remaining hard problem is schema evolution: what happens to a persisted object graph already sitting in users' browsers when the model changes. Today the framework handles the additive cases on load. A slot added to a class receives its default value — or its `setFinalInitProto` instance — when an older record is loaded. A slot removed from a class is dropped from the record with a console warning, and the object is re-saved without it. A stored value that the current slot's setter rejects is logged and the slot keeps its default. A record whose class no longer exists loads as `null`. What the framework does not do is infer intent: renaming a slot looks like a removal plus an addition, so the old value is discarded unless the old slot is kept declared long enough to copy it across in `finalInit()`; splitting a class is a hand-written migration in the same place. There is no versioned migration system. The honest summary is: automatic for additive change, manual for everything else.

## When to use it, and when not to

STRVCT fits applications whose primary job is **managing structured information**: CRM, project management, records systems, knowledge bases, messaging, media libraries, configuration-heavy tools. In these domains nearly the whole product is object traversal plus collection projection, and the generated interface covers it.

It fits poorly where the primary surface is a **specialized medium** whose geometry carries domain meaning: code editors, drawing canvases, maps, 3D scenes, waveforms, games. Those need custom views. STRVCT supports custom views — it uses them for exactly these cases — but if they *are* the product rather than its periphery, a component framework may be the better tool.

Adopting STRVCT also means adopting its conventions. It uses its own module system rather than ES imports, its own build, and programmatic styling rather than CSS. Knowledge of React, Vue, or Svelte does not transfer. This is a deliberate trade of familiarity for the guarantees above.

## Production use

STRVCT is used in production by [undreamedof.ai](https://undreamedof.ai), an AI-powered virtual tabletop for D&D. The application has roughly 90 domain classes covering characters, campaigns, multiplayer sessions, and AI integration. About 90% of screens are framework-generated; fewer than 10 custom views exist, all for inherently graphical domains (3D dice, chat, maps).

## Architecture

```
Model layer          SvNode → slots, subnodes, notifications
                        ↕ (automatic, bidirectional)
View layer           SvDomView hierarchy → tiles, columns, navigation
                        ↕ (automatic)
Persistence layer    SvPersistentObjectPool → IndexedDB
```

The model posts notifications but never references views. Views observe notifications but never modify model internals directly; they call action methods the model defines. Persistence hooks into slot change tracking transparently. Each layer can be understood, tested, or replaced independently.

### View class hierarchy

Each layer adds one capability:

`SvElementDomView` → `SvCssDomView` → `SvSubviewsDomView` → `SvListenerDomView` → `SvVisibleDomView` → `SvGesturableDomView` → `SvResponderDomView` → `SvControlDomView` → `SvSelectableDomView` → `SvEditableDomView` → `SvDomView` → `SvFlexDomView` → `SvStyledDomView` → `SvNodeView`

### Node initialization

A three-phase lifecycle that is identical for new and deserialized objects:

1. **`init()`** — primitives, slot defaults
2. **`finalInit()`** — complex child objects (skipped for slots already loaded from storage)
3. **`afterInit()`** — full object graph is ready

## Self-contained

In the browser, STRVCT uses no package manager and no bundler. The handful of third-party libraries it needs (pako, htmlparser2, jwt-decode, js-sha256, simple-peer) are checked in as source under `external-libs/` and loaded through the framework's own resource loader, so there are no transitive dependencies or post-install scripts, and the entire browser dependency tree is auditable in the repository. State management, persistence, navigation, gesture recognition, and the build are all built in.

Dependencies are declared in `_imports.json` files. The build produces SHA-256 content-addressed bundles: unchanged content is never re-downloaded across deployments, identical content across files is stored once, and second-load time depends on cache hits rather than bundle size.

The root `package.json` exists only for headless Node.js execution and tooling — an IndexedDB shim, a LevelDB backend, a canvas implementation. Nothing in it is shipped to the browser.

## Documentation

Full documentation, the design essay, FAQ, and example app are at [strvct.net](https://strvct.net). For AI agents: [llms.txt](https://strvct.net/llms.txt) and [llms-full.txt](https://strvct.net/llms-full.txt).

## License

MIT. See [LICENSE.txt](LICENSE.txt).
