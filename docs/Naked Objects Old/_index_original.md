# Naked Objects

Closing the Usability Gap in Naked Objects

## Abstract

Also available as a [PDF](compiled/Closing_the_Usability_Gap_in_Naked_Objects.pdf).

The naked objects pattern promised to generate user interfaces directly from domain models, eliminating bespoke UI code while keeping interface and business logic consistent. The promise is largely unfulfilled. The cause was not automatic generation but its output: generic forms, tables, and menus that lacked the spatial organization and navigational fluency users expect.

The gap was avoidable. The design space for presenting structured information is narrower than the software industry assumes. A few composable primitives — tiles, tile stacks, and recursively nested master-detail views — cover it. HCI research on mental models, information foraging, and Gestalt perception explains why a deliberately constrained UI grammar turns uniformity into an asset.

We present Strvct, an open-source JavaScript framework built on this idea. Centralizing the model-to-view pipeline yields capabilities that conventional component frameworks pay for per screen: an AI-operable domain model, automatic responsive design, headless testability, and annotation-driven persistence with cloud sync. The same centralization points toward further directions, such as runtime AI-extensibility and a narrowed UI trust boundary. A production application, undreamedof.ai, comprises ~90 domain classes with roughly 90% auto-generated views. Only two custom views remain, both for inherently graphical components: a 3D dice roller and a battle map.

## 1. Introduction

Most application frameworks treat the user interface as a separate engineering problem from the domain model. Each screen is designed, implemented, and maintained on its own. Every new model class or schema change propagates into view code, form layouts, navigation logic, and responsive design. This duplication is structural, not incidental, and its cost grows linearly with the number of domain objects.

Naked objects [1] proposed a different path: expose domain objects directly to users and generate the interface automatically. Developers write only the domain model; the UI follows. Consistency is guaranteed, because there is no separate representation to fall out of sync — the interface always reflects the model's actual state and shape.

Pawson and Matthews described the pattern in 2000. Several frameworks have implemented it, most notably Apache Isis (now Apache Causeway) for Java [2]. These implementations proved the core thesis: automatic UI generation from domain models is feasible and produces functionally complete interfaces. Yet adoption stayed confined to internal tools, administrative interfaces, and prototypes.

The reason is perceptual, not technical. Generated interfaces — generic forms for objects, tables for collections, menus for navigation — are correct and complete but *feel wrong*. They lack spatial hierarchy, navigational depth, and responsive behavior. They resemble database administration tools, not the applications people use daily. This usability gap, not any limit of the underlying pattern, has held naked objects back.

Component frameworks (React, Vue, Svelte) attack the same cost from the opposite direction: rather than eliminating view code, they make it cheaper to write. Component libraries push that further. But the view tree still exists, must be authored, and must be kept in sync with the model. Adding a property still touches a form, a validator, a serializer, and a translation file. Naked objects, done well, eliminates the view tree as an authored artifact. The view is derived. No component library closes that gap.

This paper describes how to close the usability gap. We argue the design space for presenting structured information is narrow, identify a small set of composable primitives that cover it, and present Strvct, a framework demonstrating the approach in production.

The contributions are:

1. The *narrow design space* hypothesis: informational UIs converge on a small set of spatial conventions, making uniform application of those conventions an asset rather than a constraint.
2. A small set of composable primitives — tiles, tile stacks, and recursively nested master-detail views — that we claim covers this space.
3. An annotation system in which independent framework layers (UI, persistence, sync, AI, i18n) read metadata from the same slot declarations without coordinating.
4. A working framework, Strvct, implementing the approach.
5. A production application, undreamedof.ai, in which roughly 90% of views across ~90 domain classes are auto-generated.

## 2. The Usability Gap

Prior naked objects implementations present each object as a form of property fields and each collection as a table or list, with navigation through menus, links, or search. This is functionally sufficient but creates four specific problems.

**Lack of spatial hierarchy.** Users expect spatial relationships to carry meaning: hierarchy top-to-bottom, navigation depth left-to-right, containment for ownership. Generic forms and tables flatten these relationships. Users must navigate menus instead of perceiving structure.

**No viewport adaptation.** Modern applications invest heavily in responsive design: collapsing navigation, stacking layouts, hiding secondary content. Form-based interfaces either ignore the viewport or bolt on ad-hoc responsive behavior that does not generalize across the model.

**Inconsistent navigation depth.** As users go deeper into an object hierarchy, form-based interfaces either replace the current view (losing context) or open new windows (fragmenting it). Neither tells users where they are in the larger structure.

**No visual continuity.** Without a consistent spatial model, users cannot build a mental map. Each navigation action feels like arriving at a new, disconnected screen rather than moving within a coherent space.

These problems are not inherent to naked objects. They are artifacts of one UI strategy — generic forms and tables — that prior implementations chose because it was simple and sufficient for internal tools. The question is whether a different strategy can keep automatic generation while meeting the expectations set by modern hand-crafted applications.

## 3. A Narrow Design Space

Our central hypothesis: *most variation between informational interfaces is accidental, not essential*. The structural geometry of browsing, navigating, and editing data has converged on a small vocabulary. Most of what distinguishes one application from another is visual styling, not spatial logic.

Survey the informational interfaces where people spend most of their time, and the same conventions recur: hierarchy top-to-bottom, navigation depth left-to-right, containment for ownership, lists for collections. Consider four examples:

- **Email** (Gmail, Outlook): a vertical list of messages on the left, message content on the right. Selecting a message reveals its contents in a detail pane. Folders or labels add a second level of hierarchy. The metaphor is master-detail with optional grouping.

- **Facebook**: a vertical feed of posts, each expandable into comments and replies. A sidebar list navigates between sections (feed, groups, marketplace). Profile pages are vertical stacks of categorized content. The metaphor is list-of-lists with drill-down.

- **Twitter/X**: a vertical timeline of posts. Selecting one reveals a thread, a vertical stack of replies. A sidebar navigates between timelines (home, explore, notifications). The metaphor is master-detail where both master and detail are vertical lists.

- **Amazon**: a vertical list of search results, each clickable into a product detail page — a vertical stack of sections (images, description, reviews, related items). A hierarchical sidebar handles category browsing. The metaphor is master-detail with nested vertical stacks.

Four different companies built four different applications for four different purposes, yet all use the same spatial logic.

This convergence is grounded in decades of HCI and cognitive science research.

**Mental models and spatial metaphors.** Users build internal *mental models* of systems that are overwhelmingly spatial (Norman, 1988; Gentner & Stevens, 1983). They reason about digital information using the primitives they use for physical environments: location, containment, proximity, hierarchy. Tiles, stacks, and master-detail views map directly onto these.

**Information foraging and scanning patterns.** Eye-tracking research shows predictable Western reading behavior: an F-pattern for text-heavy pages, a Z-pattern for mixed layouts (Nielsen, 2006; Pernice, 2017). Interfaces aligned with these patterns cut cognitive load; those that fight them raise it. Our primitives reinforce natural scanning order.

**Consistency and Gestalt principles.** Jakob Nielsen ranks "Consistency and Standards" among the top usability heuristics (Nielsen, 1994). Gestalt laws of perceptual organization — proximity, similarity, closure, common fate (Wertheimer, 1923; Koffka, 1935) — explain why stacked tiles and recursive nesting feel immediately coherent. Baking these laws into the architecture makes consistency a structural guarantee, not an aspiration.

The design space is narrow because human cognition is narrow in how it organizes and navigates information. What feels like creative freedom in traditional UI design is often accidental complexity layered on these constraints. Bespoke UI developers already converge on the same patterns, unconsciously and inconsistently. The variation between hand-crafted interfaces is largely superficial: different styling, spacing, and component libraries atop the same spatial logic.

This supports two claims that must be kept apart, because they are not equally strong:

- The **coverage claim**: most informational interfaces decompose into tiles, stacks, and master-detail views, so a framework restricted to those primitives can express them. This is a count of domain classes, which the case study (§8) measures directly.
- The **preference claim**: applying the conventions uniformly is *preferable* to a patchwork of bespoke screens, because users get consistent navigation and the framework cannot produce the arbitrary layouts that create inconsistency. This is the headline, and the weaker claim. It rests on a judgment of *value*, not a count, and we do not measure it here.

The two must not substitute for each other. A small percentage of UI *code* spent on bespoke screens (which we can show) does not establish a small percentage of UI *value* lost by generating them (which we cannot).

### Scope and Counterexamples

The narrow design space covers a large and important class of applications, but not all. These adversarial cases fall outside it:

- **Data visualizations and dashboards.** Charts, graphs, heatmaps, and interactive analytics need specialized rendering and direct-manipulation gestures that cannot be derived from domain model structure.
- **Creative canvases and spatial editors.** Design tools (Figma, Miro), diagramming, CAD, and map editors, where objects have free-form 2D or 3D positions.
- **Real-time media and games.** Video editors, 3D renderers, audio workstations, and games — including our own case study, where the dice roller and battle map required custom views.
- **Highly unusual workflows.** Non-hierarchical navigation, complex state machines with many transient modes, or domain-specific interaction metaphors (timeline-based video editing, node-based programming).

In our case study (§8), fewer than 10% of domain classes required custom view code (2 of ~90). The rest were generated and felt natural to users. We believe this ratio is representative for many enterprise, productivity, and data-management applications, but we do not claim universality.

**The narrowness is partly true by construction.** We scoped dashboards, canvases, games, and timeline editors *out*, then called the remainder narrow. Some of the narrowness is therefore definitional, not discovered, and an honest reading must say so. The defense is not that the scoping is unbiased but that the class scoped *in* is large and economically central: the navigation and editing shells of email, social, commerce, productivity, line-of-business, and administrative software — the surfaces where most users spend most of their time. A true-by-construction claim about a marginal class would be uninteresting; the same claim about the bulk of everyday informational software is not.

**Residue: product or periphery?** Every real application leaves some surface that does not conform. The existence of a residue is never in question. The useful test is whether the residue is the *product* or the *periphery*. The navigation shell — lists, drill-downs, inspectors, settings — is master-detail almost everywhere and rarely what a product is valued for. The differentiator is often the one non-conforming surface: the feed-ranking view, the editor canvas, the map, the chart. Consumer products often concentrate disproportionate value in a few such surfaces, even when those are a small fraction of total screens. This bounds the narrow-space claim precisely: it covers the shell, which is most of the screens, but says nothing about how much of a product's *value* lives in the residue.

**The pointer analogy, and its honest limit.** The computer mouse won not by being universal but by owning the bulk-of-value tasks — selection, direct manipulation, navigation — while ceding a permanent residue: text entry and keyboard shortcuts. "You can't do everything with a mouse" was true and never counted against it, because the part it could not do was not the point of the tasks it was used for. Generated UIs are in the same position: "not universal" was wrongly deployed as "not valuable." The analogy also marks the boundary honestly. "You can't do everything with X" *is* decisive exactly when the part X cannot do is the whole point. A generated UI is the wrong tool for a competitive-programming editor or a node-based shader graph, where the bespoke surface *is* the product. The question is never whether a residue exists but whether it is product or periphery.

**Deliberate trade-off.** Refusing arbitrary layouts buys structural consequences a more general system loses: consistency, responsiveness, AI interoperability, and near-zero view-layer maintenance. Applications mostly inside the narrow space gain dramatically lower maintenance cost and higher consistency. Those dominated by adversarial cases are better served by traditional component frameworks.

Future work could explore hybrid approaches — for example, allowing selected custom view components inside an otherwise auto-generated tile/stack hierarchy — or expand the primitive set in a disciplined way. We have intentionally kept the core grammar minimal.

## 4. Approach: Composable UI Primitives

We define a small set of composable UI primitives that embody the spatial conventions above. Each primitive handles one aspect of presentation. Composed, they cover the navigation and layout patterns of typical informational applications.

The guiding principle is simplicity and power through conceptual unification. Each primitive eliminates distinctions that conventional frameworks maintain separately:

| Concept | Unifies |
| --- | --- |
| Annotated slots | Properties, form fields, storage records, schema, translation keys, ARIA attributes |
| Tiles | Summary views, property editors, list items, navigation elements |
| Master-detail views | Menus, inspectors, drill-downs, settings panels, breadcrumbs, responsive layouts |
| Domain nodes | Objects, navigation hierarchy, persistence graph, AI-operable surface |

The sections below describe each primitive.

### 4.1 Tiles

The fundamental unit of presentation is the **tile**: a view of a single domain object or a single property of one.

**Summary tiles** present domain objects with a title, subtitle, and optional sidebars. They are the primary navigation element: selecting a summary tile reveals the object's contents in an adjacent detail area.

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em 0 0.5em; margin: 0; text-align: center;">
    Summary Tile
  </div>
  <object type="image/svg+xml" data="diagrams/svg/summary-tile.svg" style="display: block; margin: 0 auto; max-width: 400px; width: 80%;">[SVG diagram]</object>
</div>

**Property tiles** present individual properties as key-value pairs, with optional notes and validation errors. Specialized property tiles handle common types — strings, numbers, dates, images, booleans — with type-appropriate editing.

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em 0 0.5em; margin: 0; text-align: center;">
    Property Tile
  </div>
  <object type="image/svg+xml" data="diagrams/svg/property-tile.svg" style="display: block; margin: 0 auto; max-width: 400px; width: 80%;">[SVG diagram]</object>
</div>

Tiles support direct-manipulation gestures: slide-to-delete, long-press reordering, and drag-and-drop between tile stacks, across browser windows, and to or from the desktop and other applications. Domain objects register which MIME types they accept, enabling type-safe import and export through standard drag interactions.

Tiles can be subclassed for domain-specific presentation, but the default tiles aim to be sufficient for most cases. Custom tiles should be the exception.

### 4.2 Tile Stacks

A **tile stack** is a scrollable, ordered sequence of tiles presenting the subnodes of a domain object. Tile stacks support either orientation (vertical or horizontal) and gestures for adding, removing, and reordering items.

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em 0 0.5em; margin: 0; text-align: center;">
    Tile Stack
  </div>
  <object type="image/svg+xml" data="diagrams/svg/tiles.svg" style="display: block; margin: 0 auto; max-width: 200px; width: 60%;">[SVG diagram]</object>
</div>

### 4.3 Master-Detail Views

A **master-detail view** pairs a tile stack (the master) with a detail area showing the currently selected item. The detail area may itself contain another master-detail view, enabling arbitrarily deep navigation through recursive composition.

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em 0 0.5em; margin: 0; text-align: center;">
    Master-Detail View
  </div>
  <object type="image/svg+xml" data="diagrams/svg/master-detail.svg" style="display: block; margin: 0 auto; max-width: 400px; width: 80%;">[SVG diagram]</object>
</div>

Three features make this composition practical.

**Flexible orientation.** The detail area can sit to the right of or below the master, as the domain object specifies or the interface overrides. The same primitive expresses both horizontal navigation (like a file manager) and vertical drill-down (like a settings panel).

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em 0 0.5em; margin: 0; text-align: center;">
    Master-Detail Orientations
  </div>
  <object type="image/svg+xml" data="diagrams/svg/orientations.svg" style="display: block; margin: 0 auto; max-width: 500px; width: 90%;">[SVG diagram]</object>
</div>

**Automatic collapsing.** When the viewport is too narrow for the full chain of master-detail views, earlier columns collapse automatically. A breadcrumb bar tracks the navigation path and provides back-navigation. The same structure works on a wide desktop monitor and a narrow mobile screen with no per-object responsive design.

<div style="max-width: 600px; margin: 0 auto;">
  <div style="padding: 0.2em 0 0.5em; margin: 0; text-align: center;">
    Expanded
  </div>
  <object type="image/svg+xml" data="diagrams/svg/expanded.svg" style="display: block; width: 100%; height: auto;">[SVG diagram]</object>
</div>
<br>

<div style="max-width: 600px; margin: 0 auto;">
  <div style="padding: 0.2em 0 0.5em; margin: 0; text-align: center;">
    Collapsed
  </div>
  <object type="image/svg+xml" data="diagrams/svg/collapsed.svg" style="display: block; width: 100%; height: auto;">[SVG diagram]</object>
</div>
<br>

**Header and footer areas.** The master section supports optional header and footer views for search, message input, or group actions. Common interaction patterns fit within the same compositional framework.

### 4.4 Composition

Nesting master-detail views with varying orientations produces navigation structures that match many common application patterns: Miller column file browsers, settings hierarchies, email clients, chat applications, inspector panels. These are not special cases implemented individually. They are natural compositions of the same three primitives.

<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 2%; width: 100%;">
  <div style="min-width: 150px; width: 30%; text-align: center;">
    <div style="padding: 0.2em 0 0.5em; margin: 0;">Vertical</div>
    <object type="image/svg+xml" data="diagrams/svg/vertical-hierarchical-miller-columns.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
  </div>
  <div style="min-width: 150px; width: 30%; text-align: center;">
    <div style="padding: 0.2em 0 0.5em; margin: 0;">Horizontal</div>
    <object type="image/svg+xml" data="diagrams/svg/horizontal-hierarchical-miller-columns.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
  </div>
  <div style="min-width: 150px; width: 30%; text-align: center;">
    <div style="padding: 0.2em 0 0.5em; margin: 0;">Hybrid</div>
    <object type="image/svg+xml" data="diagrams/svg/hybrid-hierarchical-miller-columns.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
  </div>
</div>

Composability is the key insight. Rather than implementing a fixed set of application templates, the framework provides building blocks that compose into appropriate layouts for each part of the domain model.

Real-world evidence for the thesis predates this paper by years. Recursive, auto-collapsing master-detail is now the dominant navigation pattern on phones, watches, and other small screens — settings apps, mail clients, and file browsers that show one column at a time and push or pop columns as the user drills in and backs out. That is exactly the narrow-viewport collapse described in §4.3, arrived at independently by platform designers. Small viewports do not merely *permit* the narrow grammar; they *enforce* it. There is no room for bespoke per-screen layout on a watch face, so designers converge on master-detail collapse whether or not they would choose it on a desktop. The pattern's prevalence on the most constrained devices is evidence that the design space is narrow where it is most tested. The Miller Column pattern [3] has been used since NeXTSTEP for file browsing. Our contribution is not discovering it but making it recursive (columns nest vertically or horizontally), orientation-flexible (each level chooses its own orientation), and the *generated default*, composed from model annotations rather than hand-built per screen.

### 4.5 Examples

We decompose four widely-used applications into their constituent views:

<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 2%; width: 100%;">
  <div style="min-width: 300px; width: 48%; text-align: center;">
    <div style="padding: 0.2em 0 0.5em; margin: 0;">Email</div>
    <object type="image/svg+xml" data="diagrams/svg/gmail-composition.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
  </div>
  <div style="min-width: 300px; width: 48%; text-align: center;">
    <div style="padding: 0.2em 0 0.5em; margin: 0;">Twitter/X</div>
    <object type="image/svg+xml" data="diagrams/svg/twitter-composition.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
  </div>
  <div style="min-width: 300px; width: 48%; text-align: center;">
    <div style="padding: 0.2em 0 0.5em; margin: 0;">Facebook</div>
    <object type="image/svg+xml" data="diagrams/svg/facebook-composition.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
  </div>
  <div style="min-width: 300px; width: 48%; text-align: center;">
    <div style="padding: 0.2em 0 0.5em; margin: 0;">Amazon</div>
    <object type="image/svg+xml" data="diagrams/svg/amazon-composition.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
  </div>
</div>

These diagrams are simplifications, not exact reproductions; they capture structural form rather than every navigational element. The four serve very different domains — communication, social media, microblogging, e-commerce — yet all decompose into the same small set of primitives: horizontal menus, vertical lists, and custom content views nested in master-detail relationships. Each is, at its core, a hierarchy of menus interleaved with browsable lists of content nodes and an inspector pane for the selected item, plus a responsive strategy that decides what to show, hide, or collapse for the viewport. The structural variation between them is minimal. What users perceive as difference is mostly visual styling and the domain-specific content view.

## 5. From Model to Interface

To make "write the model, get the UI" concrete, consider a minimal domain class in Strvct:

```javascript
(class Character extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
        }
        {
            const slot = this.newSlot("level", 1);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }
        {
            const slot = this.newSlot("inventory", null);
            slot.setFinalInitProto(Inventory);
            slot.setIsSubnodeField(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
    }

    subtitle () {
        return "Level " + this.level();
    }

}.initThisClass());
```

This definition contains no UI code, no form layouts, no navigation logic, and no serialization code. Yet it produces:

- A **summary tile** showing the character's name as a title and "Level 1" as a subtitle
- **Property tiles** for `name` (editable string field) and `level` (editable number field), with appropriate input types
- A **navigable field** for `inventory` that opens a new master-detail view of the inventory's contents when selected
- **Automatic persistence** to IndexedDB, with dirty tracking and transactional commits
- **Bidirectional synchronization**: editing a field updates the model; programmatic model changes update the view
- **Automatic translation** of field labels and values when internationalization is active

The slot annotations — `setShouldStoreSlot`, `setSyncsToView`, `setCanEditInspection`, `setIsSubnodeField` — bridge the domain model and the framework's automatic behaviors. Each controls one aspect of the object's lifecycle. Together they give the UI, storage, and synchronization layers enough information to operate without additional code.

The screenshot below shows Strvct in undreamedof.ai, an AI-powered virtual tabletop for tabletop roleplaying games. Character sheets, campaign hierarchies, session management, and settings panels are all generated from domain model annotations. No bespoke layout code was written for any screen shown.

<a href="figures/GriffinScreenshot.png" target="_blank"><img src="figures/GriffinScreenshot.png" alt="Screenshot of undreamedof.ai, a Strvct-based application" style="width: 100%; height: auto;"></a>

## 6. Architecture

Strvct is a client-side JavaScript framework. Applications run as single-page apps in the browser, making heavy use of client-side persistent storage — both for caching code and resources via a content-addressable build system, and for an IndexedDB object database of application state.

Strvct does not compile or pre-render user interfaces. There is no build step that produces a view tree, no template system, and no static component hierarchy. Views are instantiated lazily at runtime, only when the user navigates to a node in the object graph. Each navigation step inspects the target node's class and slot annotations, discovers or creates an appropriate view, and binds it to the node for live bidirectional synchronization. Once created, a view persists as long as its node stays visible, kept in sync through the notification system. The result is closer to a live object browser than a conventional render pipeline: the UI that exists at any moment is determined by the user's current navigation path through the object graph, and it responds immediately to model changes.

### 6.1 Domain Model

The domain model is a graph of objects inheriting from a common base class. Each object has properties declared as *slots* with annotations, actions exposed as methods, a `subnodes` array of child objects, a `parentNode` reference, and a unique persistent identifier.

The model is fully independent of the UI layer. Model objects hold no references to views and communicate outward only by posting notifications. The same model code therefore runs headlessly in Node.js for testing or server-side processing.

### 6.2 The Annotation Bridge

The slot system makes automatic UI and storage possible. Rather than raw instance variables, properties carry metadata annotations that each framework layer consults independently:

- **Type**: selects the property tile and enables runtime type checking. Every generated setter validates its argument against the declared type, catching type errors at assignment rather than at compile time.
- **Persistence**: includes the slot in storage records.
- **View synchronization**: triggers view updates when the value changes.
- **Subnode relationship**: controls whether the value appears in the object's navigable hierarchy.
- **Editability**: determines whether the property can be modified through the UI.
- **Auto-initialization**: specifies a class to instantiate if no value was loaded from storage.
- **Translation context**: provides semantic context for AI-powered translation.

No single annotation knows about the others. The UI layer reads type and editability; the storage layer reads persistence; the synchronization layer reads sync flags. New layers — internationalization, cloud sync, schema generation — can be added without modifying existing annotations or the domain model.

### 6.3 Storage

Persistence is annotation-driven. The persistence layer watches slot mutations, batches dirty objects at the end of each event loop into atomic transactions, and commits them to IndexedDB. On load, stored records are deserialized back into live object instances with relationships re-established.

A separate content-addressable blob store handles large binary data using SHA-256 hashes as keys, giving automatic deduplication. Objects store hash references, not blob data.

Automatic garbage collection walks the stored object graph from the root and removes unreachable objects.

### 6.4 Synchronization

Model and view communicate through a deferred, deduplicated notification system. When a model property changes, a notification is posted; observing views schedule a sync pass. Multiple changes within one event loop are coalesced. Bidirectional sync stops automatically when values converge, preventing infinite loops. Observations use weak references, so garbage collection of either party cleans up subscriptions automatically.

## 7. Structural Consequences

When the framework controls the entire pipeline from model annotation to rendered view, capabilities that would otherwise cost per-component effort fall out of the architecture. These capabilities are not surprises. They are downstream consequences of one structural fact: the framework has complete knowledge of the domain model and controls the single point where model data flows to the UI.

We mark each capability's status explicitly. Some are demonstrated in the case study; some are architectural affordances; and two (§7.2 and §7.3) are forward-looking directions the architecture invites rather than features we have built.

### 7.1 AI-Operable Domain Model

The same annotations that drive UI generation make the domain model operable to AI agents — and operable *within the runtime*, not merely legible to a bolted-on assistant. A schema for any object is derived from its slot metadata. Edits arrive as JSON patches and are applied to the live object graph through the same setters, type checks, notifications, and sync passes a human edit takes. There is no separate AI-facing surface to drift out of sync. This is the eliminate-the-translation-layer thesis applied a second time: naked objects removed the layer between model and view; the same annotation bridge removes it between model and agent.

A single pair of tools — *schema-fetch* and *apply-patch* — covers the entire domain, regardless of how many classes are editable. A rejected patch carries the offending slot's schema, so the agent self-corrects without re-fetching context. This contrasts with the prevailing pattern for AI tool use — function calling, Model Context Protocol, OpenAPI specs — where each editable surface needs a hand-authored tool, schema, and error path, and the surface area grows linearly with the model. Here it is constant, and a new domain class is AI-operable the moment it is declared.

### 7.2 AI Extensibility (Proposed)

Operability moves an agent *within* a fixed space of types. The same architecture suggests an as-yet-unbuilt affordance that would *enlarge* it. Because every layer reads from slot annotations rather than per-type code, an agent could declare a new model class at runtime and have it become a full citizen immediately — navigable, editable, storable, synced, translatable, and itself AI-operable — with no build step. This turns *write the model, get the app* into *the running app writes its own model*. We have not built this; the case study exercises operability over existing types only.

It also raises an unsolved problem: minting types lets the agent mint the type contract itself. A safe form would need a **declared, immutable floor** of types and invariants the runtime AI may build on but not alter, with the annotation bridge as the natural seam. §7.3 sketches the security side.

### 7.3 Security (Proposed)

If runtime AI-extensibility (§7.2) is built, deriving views from trusted framework code also suggests a security advantage. View code is the least confinable surface in a browser: it touches the DOM and carries origin authority. Model objects do not. An untrusted extension would then supply **data and metadata, never DOM-touching code**, so "extending the UI" becomes "extending the model" — confinable like anything else. The layer naked objects eliminates was not only a maintenance cost but an attack surface.

Making this safe would need two primitives we have not built:

- **Isolation**: runtime-created code runs in a web worker with no ambient access.
- **Authority**: capabilities — an object gets only the references it is granted, which lets the *immutable floor* of §7.2 be expressed as the set of capabilities the runtime declines to grant.

Two limits would remain. The protection is only as wide as the derivation reaches; a genuine custom view reopens the hole. And the rendering path becomes a concentrated trust root that must output-encode all model data. Capability discipline is also hard to retrofit. We present this as a clear path, not a solved problem.

### 7.4 Automatic Responsive Design

Layout flows from model annotations, not screen-specific CSS, so the interface adapts to viewport size without per-view breakpoints. The recursive master-detail chain collapses when the viewport narrows, a breadcrumb bar preserves the navigation path, and the same composition scales from desktop to mobile with no per-screen code. Responsive behavior is paid once at the primitive level, not per screen.

### 7.5 Accessibility as an Architectural Affordance

Every interactive surface is generated from the same few primitives, so accessibility is paid once at the primitive level. Focus order, keyboard traversal, drill-in, and back-out belong to tiles and tile stacks. The slot metadata that drives type checking can also generate ARIA roles and constraints. The node hierarchy supplies landmarks and breadcrumb structure. In a conventional framework, accessibility is a per-component obligation that scales with screen count and routinely lapses. Here it cannot lapse selectively: fixing it once fixes it everywhere. We have not validated the result against the full WCAG checklist or with screen-reader users, and report this as an architectural property, not a measured outcome.

### 7.6 Transparent Internationalization

All UI text flows from slot annotations through a single rendering pipeline, so translation is injected at the model-to-view boundary with no per-component translation calls or extraction tools. New classes are translatable by default. Centralization also makes AI-powered translation tractable: the framework enumerates translatable strings by walking class prototypes, and slot-level context annotations travel with each string to give the translator domain-appropriate terminology. Adding a language becomes a configuration change, not a translation project. As with accessibility, full multi-language deployment and right-to-left layouts are not yet validated in production; the architectural surface exists.

### 7.7 Transparent Persistence and Cloud Sync

The framework owns the complete object graph and understands its structure through annotations, so persistence splits transparently into two strategies: a synchronous object pool for the model graph, keeping the UI immediately responsive, and an asynchronous content-addressable blob store for large binary resources, so they never block rendering. The same structural knowledge enables transparent cloud synchronization: the framework knows what changed, which blobs are referenced, and how to reconcile state. The developer annotates what should persist; the framework decides how and when.

### 7.8 Content-Addressable Resource Loading

The build system produces a content-addressable bundle keyed by content hash. Unchanged resources are never re-downloaded across deployments, and identical content across paths is stored only once — caching granularity that path-based bundlers cannot achieve. End-to-end control of the resource pipeline is the same structural fact that drives the other consequences in this section.

### 7.9 Built-in Inspector and Developer Mode

Every node carries enough slot metadata to drive its own UI, so the same metadata also drives a generic inspector: a view that exposes any node's slots directly as editable fields, reachable on any tile through a single modifier-click. A complementary developer-mode toggle lets applications reveal subnodes normally hidden from end users, so the same navigation pipeline serves as a debug surface. In a conventional framework, debug tooling means custom inspectors per type and a parallel description of model shape, growing linearly with the model. Here it is a free consequence of the model-to-view pipeline already covering every object.

### 7.10 Cross-Window and Cross-App Drag-and-Drop

Every tile is generated from the same view classes, so drag-and-drop works uniformly across the application in two modes that share one gesture:

- A **copy** drag serializes the source node to JSON (with its sub-object pool inlined) and delivers it via the declared MIME types. It extends naturally across browser windows, to and from the desktop, and to and from other applications that exchange those types.
- A **reference** drag transfers a persistent node UUID, for moving or linking within the application without copying contents.

Both modes are type-safe: the receiving side validates against the same slot metadata that drives form validation and AI patches. In a conventional framework, drag interop requires per-class handlers, per-screen serialization formats, and ad-hoc validation on receipt, and the cost scales with the number of draggable objects. Here it is free at the primitive level. (Cross-window reference drags, where a second client resolves the UUID against shared state, are a natural extension but not yet implemented.)

### 7.11 Headless Execution and Testability

Model classes hold no references to views or browser globals, so the same domain code runs unchanged under Node.js. Tests instantiate the model, drive it through action methods, and assert against slot values without a DOM. The notification system, persistence, and patch validation all operate without rendering, so behaviors that would normally require browser automation against a real DOM reduce to direct model assertions. The model/view separation that makes auto-generation possible is the same separation that makes the model headlessly executable: one architectural choice serves both ends.

## 8. Case Study: undreamedof.ai

Strvct has been used to build undreamedof.ai, an AI-powered virtual tabletop for Dungeons & Dragons and other tabletop roleplaying games. The breakdown by subsystem:

| Subsystem | Domain classes | Custom views |
| --- | ---: | ---: |
| Character system | ~30 | 0 |
| Campaign system | ~20 | 1 (map) |
| Session system | ~25 | 1 (3D dice) |
| AI integration | ~15 | 0 |
| **Total** | **~90** | **2** |

Fewer than 10% of classes required custom view code. The remainder — character sheets, campaign hierarchies, settings panels, administrative interfaces — use auto-generated tiles and master-detail views exclusively. The domain is non-trivial: character sheets nest deeply (character → ability scores → individual scores → modifiers), campaigns contain recursive location trees, and the session system maintains real-time state across multiple connected clients. The default primitives produce navigable, usable interfaces throughout.

**Scenario: AI-driven character creation.** A user asks an AI assistant to populate a character sheet. The assistant calls the same patch tools used internally; the same setters validate; the UI updates through the same notification system as direct edits. Adding a new character property requires a single slot declaration. The UI, the AI tool surface, the persistence layer, and the translation enumeration all pick it up without further code. In a component framework, the same change would touch the model, a form component, an AI tool spec, and a serializer.

The custom views that remain — a 3D dice roller and a battle map — fall into the category §3 identifies as outside the narrow design space: inherently graphical, domain-specific components that cannot be derived from model annotations. Their existence does not undermine the approach; it confirms that the boundary between auto-generated and bespoke views falls where predicted.

**The count is a pipeline-stage metric, not a fixed residue.** The number moved while this work was underway, which is itself informative. The chat interface began as a custom view; it has since been generalized into the framework as reusable message-list and input tiles, dropping the case study from three custom views to two. This reflects a recurring workflow: write a custom view, recognize the general pattern inside it, then promote that pattern into the framework. Chat was always the borderline case — a message list with a header and a footer input is master-detail-plus-footer wearing domain-specific styling — so its absorption is unsurprising in hindsight.

The implication should be stated plainly. "Two of ~90" is not a measurement of an essential residue. It is a count of what has not been generalized *yet*, so it depends partly on developer effort and skill, which reinforces the single-developer caveat below. It also makes the narrow-space hypothesis benignly self-fulfilling: as patterns are recognized and promoted, the residue grinds down toward a graphical floor (WebGL, canvas) almost regardless of where the "true" boundary between essential and accidental custom views lies. The honest open question is empirical, and one application cannot answer it: is there a hard floor well above zero — a class of non-graphical surfaces that genuinely resist generalization — or does the residue keep shrinking toward the graphical minimum as effort is applied? The dice roller and the battle map are almost certainly below any such floor. Whether anything non-graphical sits above it remains unknown.

This is an existence proof, not a generalization: one application, one primary developer. The claim it supports is feasibility, not optimality.

## 9. Related Work

**Naked objects implementations.** Apache Isis (now Apache Causeway) [2] is the most mature naked objects framework, providing automatic UI generation for Java domain models with both a web UI (Wicket viewer) and a REST API. JMatter [4] implemented naked objects for Java Swing. Both use form-and-table UI strategies and target enterprise/administrative use cases. Strvct differs in UI strategy — composable spatial primitives rather than forms and tables — and in target — end-user applications rather than internal tools.

**Model-based and automatic UI generation.** A long line of model-based user-interface development (MBUID) generates interfaces from abstract specifications. IFML [5] (Interaction Flow Modeling Language) and UsiXML [6] are representative, deriving concrete interfaces from explicit UI models. These typically require a separate UI model on top of the domain model — the specification that naked objects eliminates by treating the annotated domain model as the only source. More pointed for our hypothesis is the adaptive-generation line, above all SUPPLE [7] (Gajos & Weld), which casts interface generation as a constrained optimization over device, task, and user, and shows that *usable* interfaces, not merely complete ones, can be produced automatically. SUPPLE is the sharpest prior pressure-test of the narrow-design-space claim: it reaches usability through search over a flexible space, whereas we argue that a *small fixed* grammar of spatial primitives already covers the informational design space, making generation a problem of composition rather than optimization. The two are complementary readings of the same evidence — that good interfaces can be derived. Our specific contribution is the claim that the covering vocabulary is small and that uniformity over it is an asset.

**Concept design and legible software.** Jackson's *concept design* [8] (*The Essence of Software*) and the recent Meng & Jackson, *What You See Is What It Does* [9], pursue a structure-first, legibility-oriented program adjacent to ours: software organized around a small set of independent, reusable concepts whose behavior is directly inspectable. We share the premise that legibility and consistency follow from constraining structure rather than decorating it; these are the nearest neighbors in the same venue. The difference is the locus of the constraint. Concept design constrains the *behavioral* decomposition of a system into concepts; the narrow-design-space hypothesis constrains the *presentational* vocabulary and derives the interface from it. The two are composable in principle: concept-structured behavior rendered through a derived, uniform presentation.

**Miller Columns.** The column-based navigation pattern was introduced in NeXTSTEP and popularized by macOS Finder [3]. It provides spatial continuity when browsing hierarchical data. Its later dominance on small-screen platforms — one column shown at a time, columns pushed and popped on drill-in and back-out — is independent evidence that the grammar is narrow where it is most constrained (§4.4). Strvct extends the pattern by making it recursive (columns nest vertically or horizontally), orientation-flexible (each level chooses its own orientation), and self-composing (the layout follows from model annotations rather than application code).

**Component frameworks.** The dominant approach to modern UI development (React, Vue, Svelte) addresses the same cost problem as low-code, but at a different layer: rather than eliminating view code, they make it cheaper to write. Component libraries (shadcn, MUI, Ant Design) cut per-screen effort further with reusable building blocks. But the view tree still exists, must be authored, and must be kept in sync with the model. Adding a property still requires editing a form component, a validator, a serializer, and possibly a translation file. Naked objects, done well, eliminates the view tree as an authored artifact. The view is derived. No component library closes this gap.

**Low-code and no-code platforms.** Modern low-code platforms (Retool, Appsmith, OutSystems) aim to reduce UI development cost through visual builders and pre-built components. They approach the same problem as naked objects from the opposite direction: rather than eliminating bespoke UI, they make it faster to produce. The result is still a collection of individually designed screens that must be maintained as the data model evolves. Naked objects eliminates this maintenance cost.

**AI-generated UI.** Large language models can now generate UI code from natural-language descriptions. This automates the *creation* of bespoke interfaces but not their *maintenance*. Each generated screen is still a separate artifact that must be updated when the model changes. Naked objects is a fundamentally different approach: rather than automating the production of bespoke UIs, it eliminates the need for them.

## 10. Discussion

### The Crossover Point

Hand-crafted interfaces may look more polished early in an application's life, when screens are few and each gets individual design attention. But as the domain model grows, the cost of maintaining bespoke screens grows with it, and inconsistencies accumulate. At some point — the crossover point — a consistent, automatically generated interface produces a better user experience than a patchwork of hand-crafted screens, because the user can rely on uniform navigation throughout.

The composable primitive approach moves this crossover point earlier by improving the quality of the generated interface. The undreamedof.ai case study suggests it may occur sooner than expected: at ~90 domain classes, roughly 90% of views were generated, and in the primary developer's assessment gave more consistent navigation than hand-crafted screens would have. That is a coverage result. Whether end users *prefer* the uniform interface is the separate preference claim of §3, which this case study does not measure.

### Adoption versus Coverage

A coverage result and an adoption result are not the same thing, and the distinction governs how this paper's central claim should be read. Everything in §3 and §8 argues *coverage*: the patterns fit most informational UIs. But the reason naked objects stalled for twenty-five years was never that the patterns failed to fit — prior implementations already produced complete, correct interfaces. The binding constraint is **switch cost**. The pointer analogy (§3) is strong on coverage but misleading on adoption: the mouse carried a near-zero relearning tax, whereas adopting a derived-UI framework means giving up the React ecosystem, the component-library commons, and fine-grained per-screen control. "Most UIs fit the patterns" can be entirely true and still not produce pointer-style adoption, because the quantity being weighed is not coverage but the cost of leaving.

**The economic lever.** One force changes the *adoption* arithmetic rather than the *coverage* arithmetic: the shift to agent-mediated development. When an LLM is a routine co-editor of application state, the bespoke-UI path acquires a new recurring obligation — it must also expose, document, and keep in sync a tool surface for every mutable type, a cost that grows with the model and rots against it as the model changes. A derived architecture pays that cost once, structurally, because the tool surface *is* the model (§7.1). This reframes the value proposition from one that is easy to resist ("consistent UIs and lower view-maintenance") to one that React-plus-bespoke cannot match without converging on the same architecture: *natively agent-operable, and stays that way for free*. We present this as the decisive lever precisely because it is the first argument that targets the constraint that actually bound adoption, rather than re-arguing coverage.

### Strengths

The approach is strongest where the model itself is the volatile, high-value artifact — where requirements change often and the cost of keeping UI, storage, and synchronization in sync with a shifting model is the main bottleneck. A model change propagates automatically to the UI, persistence, cloud sync, AI integration, and internationalization, so the cycle from "requirement changed" to "working software" is compressed to the time it takes to modify a class definition. Adding a property, restructuring a hierarchy, or introducing a new entity requires no changes to view code, form layouts, serialization logic, or API schemas.

This suits exploratory or fast-evolving applications: tools for analysis, research, operations, or any domain where the data model is expected to grow and change throughout the application's life. Headless execution reinforces this: the same model that drives the UI can be tested, simulated, or batch-processed in Node.js with no browser dependency, enabling rapid validation of model changes before they reach users.

### Limitations

*Scope.* The approach suits informational and navigational interfaces: browsing, editing, and managing structured data. Inherently graphical interfaces — data visualizations, design canvases, game renderers, timeline editors — need domain-specific rendering and fall outside the auto-generation pipeline. Strvct supports custom view classes for these, but each is a return to the costs the approach was meant to eliminate.

*Locale.* The spatial conventions we rely on reflect Western reading order. Right-to-left layouts are within the framework's flexbox-based rendering but not validated end-to-end.

*Performance.* Lazy view instantiation keeps the initial UI cheap, but very large collections (10⁴+ tiles in one stack) are not stress-tested. The notification-and-sync model is built for graph-shaped UIs with modest fan-out, not stream-shaped UIs with high-volume updates.

*Tooling and ecosystem.* The framework forgoes the standard JavaScript module ecosystem for a custom content-addressable resource loader. This enables hash-based caching and the centralized model-to-view pipeline, but cuts the framework off from the React/Vue tooling commons: IDE component support, type-checked component props, hot reload, and the component-library ecosystem. Debugging dynamically evaluated code requires a sourceURL discipline rather than standard source maps. The trade is deliberate but real.

*Single-application evidence.* The case study is one application by one primary developer. Whether the approach scales to multi-team development, third-party plugins, or large existing codebases is open.

*Server-side compute and concurrency.* Strvct runs entirely client-side, with IndexedDB persistence and optional cloud sync. This gives excellent offline operation and snappy local interactions, but constrains use cases needing very large datasets, heavy server-side computation, or strict multi-user concurrency control.

*External validation.* Accessibility, internationalization, and mobile experience are architecturally supported but have not undergone external audits, large-scale user studies, or production deployment beyond the primary application.

### Future Directions

*Hybrid view composition.* Letting custom view components participate in the auto-generated tile/stack hierarchy would close the gap for the adversarial cases of §3: embedding a chart, a canvas, or a 3D viewport at a known node in the navigation tree without losing the structural guarantees of the surrounding interface.

*Server-side execution variants.* Pairing Strvct's headless mode with a server-side coordinator could support workloads that exceed pure-client constraints — large datasets, heavy compute, strict multi-user concurrency — while keeping the same model and annotations as the source of truth.

*Empirical studies.* Controlled comparisons against component-based frameworks, measuring mental-model formation, task completion time, and maintenance cost as the model evolves, would replace the existence proof in §8 with quantitative evidence.

*Disciplined primitive expansion.* Adding primitives for patterns the current set does not cover — timelines, graphs, free-form 2D positions — while preserving the narrow-design-space property: each new primitive should express a generalizable spatial pattern, not a one-off layout.

## 11. Conclusion

The naked objects pattern has offered a compelling proposition for twenty-five years: write the domain model, and the rest follows. Its limited adoption is not a failure of this proposition but of the UI strategies prior implementations chose. Generic forms and tables were sufficient for internal tools but never met the expectations of modern consumer software.

The gap is closable because the design space is narrow. A small set of composable primitives — tiles, tile stacks, and recursively nested master-detail views — covers the navigation and editing patterns shared by most informational applications. The same annotation system that drives the UI drives persistence, synchronization, AI tool surfaces, and translation without per-layer coordination. Strvct demonstrates this in a production application of ~90 domain classes, with roughly 90% of views auto-generated and custom views only where the narrow-space hypothesis predicts.

We close with a prediction. The pressure that may finally push naked objects past its twenty-five-year stall is economic, not aesthetic, and it bears on the constraint that actually bound adoption — switch cost — rather than on coverage. As AI agents become routine co-editors of application state, the cost of keeping a bespoke UI synchronized with a model an LLM can rewrite at any moment, and of maintaining a separate agent-facing tool surface for every mutable type, will exceed the cost of generating both UI and tool surface from the model in the first place. The applications that survive this transition will be the ones whose UI is a projection of their model, not an authored artifact running alongside it.

## References

[1] Pawson, R., & Matthews, R. (2002). *Naked Objects.* Wiley. See also Pawson, R. (2004). *Naked Objects.* PhD Thesis, Trinity College, Dublin.

[2] Apache Software Foundation. *Apache Causeway* (formerly Apache Isis). https://causeway.apache.org/

[3] Becker, N. (2005). Miller Columns. Wikipedia. https://en.wikipedia.org/wiki/Miller_columns

[4] Arteaga, J. M. *JMatter: A Naked Objects Framework for Java Swing.* http://jmatter.org/

[5] Brambilla, M., & Fraternali, P. (2014). Interaction Flow Modeling Language. In *Proceedings of the 23rd International Conference on World Wide Web (WWW '14 Companion).* ACM.

[6] Limbourg, Q., Vanderdonckt, J., Michotte, B., Bouillon, L., & López-Jaquero, V. (2005). UsiXML: A Language Supporting Multi-path Development of User Interfaces. In *Engineering Human Computer Interaction and Interactive Systems (EHCI-DSVIS 2004),* LNCS 3425, Springer.

[7] Gajos, K., & Weld, D. S. (2004). SUPPLE: Automatically Generating User Interfaces. In *Proceedings of the 9th International Conference on Intelligent User Interfaces (IUI '04).* ACM. See also Gajos, K. Z., Weld, D. S., & Wobbrock, J. O. (2010). Automatically generating personalized user interfaces with Supple. *Artificial Intelligence,* 174(12–13), 910–950.

[8] Jackson, D. (2021). *The Essence of Software: Why Concepts Matter for Great Design.* Princeton University Press.

[9] Meng, E., & Jackson, D. (2025). What You See Is What It Does: A Structural Pattern for Legible Software. In *Proceedings of Onward! 2025 (SPLASH).* ACM.

### Works cited by author and year

Gentner, D., & Stevens, A. L. (Eds.). (1983). *Mental Models.* Lawrence Erlbaum Associates.

Koffka, K. (1935). *Principles of Gestalt Psychology.* Harcourt, Brace & World.

Nielsen, J. (1994). Enhancing the Explanatory Power of Usability Heuristics. In *Proceedings of CHI '94.* ACM. See also Nielsen, J. "10 Usability Heuristics for User Interface Design," Nielsen Norman Group.

Nielsen, J. (2006). F-Shaped Pattern for Reading Web Content (original eyetracking research). Nielsen Norman Group. https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content-discovered/

Norman, D. A. (1988). *The Design of Everyday Things.* Basic Books.

Pernice, K. (2017). F-Shaped Pattern of Reading on the Web: Misunderstood, But Still Relevant (Even on Mobile). Nielsen Norman Group. https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/

Wertheimer, M. (1923). Untersuchungen zur Lehre von der Gestalt II. *Psychologische Forschung,* 4, 301–350. (Translated as "Laws of Organization in Perceptual Forms.")

### Software and platforms cited

React. Meta Open Source. https://react.dev/ — Vue.js. https://vuejs.org/ — Svelte. https://svelte.dev/

shadcn/ui. https://ui.shadcn.com/ — MUI (Material UI). https://mui.com/ — Ant Design. https://ant.design/

Retool. https://retool.com/ — Appsmith. https://www.appsmith.com/ — OutSystems. https://www.outsystems.com/
