---
modelName: Grok 4.7
model: grok-4.7
reviewed: 2026-11-12
summary: Serious solo naked-objects framework for structured local-first tools, not a safe platform bet.
stamp: STRVCT · 2026-11-12 · 9698cc3d
inputHash: ffbc523eb91f32af
---
# Grok

STRVCT is a client-side, model-first JavaScript framework in the Naked Objects tradition. You declare domain classes and annotated properties (slots). At runtime the framework derives a Miller-column UI, local IndexedDB persistence, optional Firebase cloud sync, JSON import/export, and a generic schema-and-patch surface for AI agents. Nothing is compiled into screens ahead of time. It is one person's long-running framework (Steve Dekorte, roots in 2016, public repo from 2020), MIT-licensed, and used in production by [undreamedof.ai](https://undreamedof.ai). It is not a component library, not a low-code builder, and not part of the npm/React ecosystem.

The pitch is real, and narrower than the homepage implies. For structured information apps, one annotated model can drive navigation, fields, storage, and agent edits so those layers cannot drift. That is the actual product. "Write the model, get the application" is true only inside a small layout grammar, and only if you accept that grammar as the product.

## Strengths

**One declaration, several consumers.** A slot's type, storage flag, editability, and description are read independently by the UI, the object pool, sync, accessibility attributes, i18n, and JSON Schema. Adding a field is one slot, not a migration plus an API type plus a form. The React comparison page is honest about what that replaces and what it does not.

**Local-first by default.** Edits commit to IndexedDB at the end of the event loop. The app works offline. Cloud sync is a separate, versioned commit of changed rows, with conflict detection rather than silent merge. Blobs are content-addressed. The same model runs under Node.js without a DOM, so domain tests do not need a browser. That separation is consistently enforced in the architecture, even where a few model classes still touch `window` or `document` (called out as future cleanup).

**A fixed agent interface.** Agents fetch a class schema and apply JSON patches through the same setters a human edit uses. The tool list does not grow with the number of classes. Rejected patches can return the slot schema. For apps where people and agents edit the same graph, this is the most differentiated feature, and it falls out of the annotation bridge rather than a second API.

**Navigation that is actually implemented.** Recursive master-detail, phone collapse with breadcrumbs, inline documents, anchored tabs, and presented nodes are in production, not just proposed. The lens idea (visibility, beside-vs-inside, arrangement) is a clearer account of generated UI than "forms and tables." Custom views are an explicit last resort, scoped to one node, and the docs admit they fall out of theming and automatic updates.

**Cross-cutting behavior paid once.** Keyboard navigation, ARIA emission, reduced motion, and AI translation sit in a small set of view classes. When those primitives are right, every app inherits the fix. The inspector (Option-click) and developer mode are genuine consequences of naked objects, not a bolted-on devtool.

**The author does not hide the residue.** The docs say there is no measured productivity study, no SSR, no npm, no component ecosystem, and that tables, charts, virtualized mega-lists, and a real permissions protocol are unfinished. The production inventory (~90 domain classes, 11 specialized views) is offered as an existence proof, not a coverage ratio. That restraint is a strength of the project, not a weakness of the idea.

## Weaknesses and risks

**Bus factor of one, and an idiosyncratic stack.** No community, no package ecosystem, no TypeScript, no standard modules. Source is loaded by a custom content-addressable indexer and `eval`. Third-party code is vendored. Debugging works via `sourceURL`, not source maps. A motivated fork is possible — the code is plain JavaScript — but hiring, onboarding, and "ask Stack Overflow" are not. The FAQ says the API may still change.

**The classic Naked Objects problem is reduced, not gone.** Generated UI is a consistent object browser: columns, tiles, fields, documents, tabs. That is a good admin, CRM, and game-tool shell. It is a poor storefront, marketing site, or brand surface. Tables with aligned columns, kanban, timelines, charts, and virtual scrolling are still proposals. If those are the primary screens, you will write and maintain custom views, which is the cost the framework exists to avoid.

**Claims run ahead of verification.** A WCAG 2.2 matrix is presented as addressed, while accessibility testing against VoiceOver, NVDA, JAWS, and TalkBack is explicitly future work, including a known clash between custom Tab routing and screen-reader conventions. Case-study comparisons against React are designed, not run. The current paper counts 11 custom views; an older revision of the same paper still on the site counts 2 and says ~90% generated. Treat coverage numbers as the author's inventory, not a result.

**Multi-user safety is not there yet.** There is no first-class permission model. The docs describe a real failure: a non-admin drop was accepted locally, animated as saved, and dropped at sync. Cloud concurrency is optimistic and per document: the later writer reloads; edits are not merged. Agents can patch whatever the exposed schema allows. Do not put untrusted users, or an untrusted agent, on a shared graph until capabilities exist and are enforced on the server, not only in the client.

**Operational rough edges.** Future-work notes are unusually candid: `Slot.js` near 2,000 lines, a 3,000-line CSS view, recursive mark-and-sweep that can blow the stack, notification lookup that is O(n), no slot-type migrations, duplicated IndexedDB implementations, ~170 TODOs, and 71 files in `_unused/`. Schema evolution is mostly "drop unknown slots and resave." Cloud is Firebase-shaped. i18n sends UI strings to an AI service; that is convenient and also a cost, latency, quality, and data-sharing dependency.

**Security and supply chain are a trade, not a free win.** Vendoring avoids npm install scripts. `eval` of the app bundle, client-side API keys unless you proxy them, and a rendering path that must encode all model data are the new trust roots. Runtime AI type-minting is sketched as future work and correctly flagged as unsafe without isolation the project has not built.

## Who should use it

Use it if you are a solo developer or a very small team building a logged-in, state-heavy tool: CRM, issue tracker, settings and admin, structured editor, or game tool, where people and agents edit the same objects, offline matters, and a consistent object browser is an acceptable interface. You should be willing to learn slots, categories, and Cocoa-like mutable objects, and to read the framework when stuck.

It is a reasonable bet when the model changes often and the screens are mostly navigation plus fields. The contacts example — four classes, no view code, optional cloud sync by changing the base class — is the happy path, and it is believable.

## Who should not

Skip it for marketing sites, storefronts, SEO, or anything whose product is a designed sequence of screens. Skip it if you need a hiring pool, TypeScript, shadcn/MUI, or a router and design system your designers already know.

Skip it, for now, if the product is multi-tenant collaboration, fine-grained ACL, or conflict-heavy co-editing. Skip it if the primary UI is a spreadsheet, kanban, chart, map, or a list of hundreds of thousands of rows. Skip it if you cannot accept a single-maintainer project with no corporate backing. A static marketing site beside a STRVCT app, as undreamedof.ai does, is the split the docs themselves recommend.

## Alternatives

| Need | Closer fit | What you give up vs STRVCT |
|---|---|---|
| Screens are the product | React, Vue, Svelte, plus your own state and storage | You write the glue STRVCT deletes. You keep the ecosystem. |
| Java Naked Objects, enterprise | Apache Causeway | Mature, form-and-table, not this navigation grammar or this agent surface. |
| Admin over an existing API | Refine, AdminJS, Directus, Retool, Appsmith | Faster to an admin UI; the UI is still a separate artifact, and you do not get headless domain tests or a constant agent tool list for free. |
| Local-first data, hand-built UI | RxDB, TinyBase, ElectricSQL, PowerSync, Yjs/Automerge | Real sync or CRDTs, no generated app. Better if the interface must be custom. |
| Schema-driven forms only | JSON Schema / react-jsonschema-form | Forms, not an application shell, sync, or navigation. |
| Agent-editable app state | Your own schema plus MCP or function calling | You can copy the schema-and-patch idea without adopting the framework. You must keep that schema from drifting. |

Causeway is the serious prior art. STRVCT's difference is the lens grammar (columns, inline documents, tabs, presented nodes), local-first pools, and the derived agent interface — not "we invented generating UI from a model." React remains the default when the screen is the product. A hybrid — STRVCT or Causeway for the structured core, a normal frontend for the brand surface — is usually wiser than forcing either to do both.

## Bottom line

STRVCT is a coherent, unusually well-documented research-and-production framework, not a sketch. The architecture does what it says for hierarchical, editable, local-first data, and the agent projection is the part most worth stealing even if you never adopt the stack. It is a poor default for a team that needs ecosystem, permissions, measured accessibility, or layouts outside a browser of objects. Adopt it as an application platform only if that object browser is the product you want, and you can live with one author.
