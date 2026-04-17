# Emergent Capabilities

Capabilities that the naked objects architecture makes possible at the framework level.

## Context

In a conventional web framework, cross-cutting concerns -- accessibility, internationalization, search, undo -- must be implemented per component. The cost scales linearly with the number of components, and coverage is always incomplete.

STRVCT's architecture inverts this. All state lives in typed slots with rich metadata (type, description, min/max, required, read-only). All UI passes through a small set of view classes (~15 tile and container classes render every application). This means a capability implemented once at the framework level automatically covers every application built on the framework.

Two capabilities already demonstrate this pattern:

- **[Accessibility](../../Accessibility/index.html)** -- Slot metadata maps to ARIA attributes, view classes emit roles and states, and every application inherits WCAG 2.2 AA support without per-component accessibility code.
- **[Internationalization](../../Internationalization/index.html)** -- Translatable nodes and a batched translation service give every application multilingual support through the model layer.

The candidates below are additional capabilities that the same architectural properties make possible. Each would be difficult or impractical to add after the fact in a conventional framework, but in STRVCT they can be implemented at the framework level and applied uniformly.

## Candidates

### Undo / Redo

Every state change flows through `didUpdateSlot()` with both old and new values. A command history captured at the slot level would give automatic undo/redo to every editable field and action. The notification system already provides the hook points; what's missing is a journal that records slot mutations and can replay them in reverse.

The slot system's granularity is an advantage here -- each undo step corresponds to a single slot change with a known previous value, avoiding the complexity of diffing arbitrary state trees.

### Search & Filtering

The entire node graph is structured, typed, and labeled. A framework-level search could traverse all nodes and slots, using slot metadata (type, description) to build both full-text and structured queries -- without per-component indexing code.

Slot types inform how to search (string matching on text slots, range queries on numeric slots, boolean filtering on flags), and node titles and descriptions provide natural result labels. The same traversal could support filtering a tile container's visible subnodes by query.

### Data Validation

Slot annotations already drive three consumers: JSON Schema for AI tool calls, ARIA attributes for screen readers, and persistence constraints. A fourth consumer -- a validation layer -- would use the same metadata (type, min, max, required, pattern) to provide automatic error messages and visual feedback on invalid input.

Because the metadata is already there, validation rules wouldn't need to be declared separately from the slot definitions. A field tile with `setAnnotation("minimum", 0)` would automatically reject negative input and display an appropriate message, just as it already emits `aria-valuemin="0"` and `"minimum": 0` in JSON Schema.

### Automated Testing

The model is effectively its own specification. Slot metadata declares what types, ranges, and constraints each field accepts. This makes generative testing possible: the framework could automatically produce test cases for every editable slot (valid and invalid input for its type), exercise every action, and walk every navigation path in the node graph.

This is a stronger property than conventional snapshot or integration testing -- the tests derive from the model's structural definition rather than from manually written expectations, so they stay in sync as the model evolves.

### Analytics & Telemetry

Every user interaction passes through the same tile, navigation, and action paths. Instrumenting once at the framework level would capture usage data (which nodes are visited, which fields edited, which actions taken, how users navigate the hierarchy) for every application -- without per-feature tracking code.

The node hierarchy provides natural grouping for analytics events, and slot metadata provides labels and types for structured event properties.

### Debug Inspection

STRVCT applications are already their own inspectors -- the node hierarchy is directly navigable, every slot's current value is visible in the UI, and the notification system shows the flow of changes in real time. This isn't a feature to build; it's an inherent property of the naked objects pattern worth calling out as a capability.

Conventional frameworks require separate developer tools (React DevTools, Vue DevTools) to inspect component state. In STRVCT, the production UI and the debug inspector are the same thing.

### Migration & Schema Evolution

When slot definitions change across versions, the framework knows both the stored schema (from the persisted record) and the current schema (from live slot definitions). This structural knowledge makes automatic migration possible: detecting renamed, added, or removed slots and transforming stored records to match the current definition.

In conventional systems, schema migration requires manually written migration scripts. In STRVCT, the slot system provides enough information to detect and potentially automate many common migrations.

## The Common Pattern

Each candidate above follows the same structural argument:

1. **Slot metadata already describes the data** -- types, constraints, descriptions, and relationships are declared once in `initPrototypeSlots()`.
2. **A small set of view classes renders everything** -- behavior added to the ~15 tile and container classes covers every application.
3. **The notification system provides hook points** -- `didUpdateSlot()`, `scheduleSyncToView()`, and the notification center make it possible to intercept and react to changes at the framework level.
4. **The node hierarchy provides structure** -- traversal, search, serialization, and inspection all operate on a uniform graph rather than an ad-hoc component tree.

The cost of each capability is proportional to the number of view classes (small and fixed), not the number of application components (large and growing). This is the fundamental leverage of the naked objects pattern.
