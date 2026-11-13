---
modelName: Gemini 4 Carbon
model: gemini-4-carbon
reviewed: 2026-11-13
summary: An ambitious, cohesive Naked Objects framework delivering extraordinary leverage for structured-data SPAs, traded against severe ecosystem isolation.
stamp: STRVCT · 2026-11-12 · 9698cc3d
inputHash: 6fa702f1aeddfe2a
---
# Gemini

## What STRVCT Is

**STRVCT** (pronounced "struct") is an open-source, client-side, local-first JavaScript application framework in the **Naked Objects** tradition, developed since 2016 and used in production for [undreamedof.ai](https://undreamedof.ai).

Instead of treating models, views, state stores, routers, persistence layers, and AI tool definitions as separate artifacts, STRVCT treats the **annotated domain model** as the sole authoritative source of truth. Developers write domain classes inheriting from `SvStorableNode` and declare properties as **Slots** (`newSlot()`) decorated with metadata annotations (`setSlotType`, `setShouldStoreSlot`, `setSyncsToView`, `setIsSubnodeField`, `setCanEditInspection`). 

At runtime—with no template compilation or virtual DOM—independent framework subsystems read those slot annotations to automatically derive:
1. **The UI:** Lazy, live-synced views built from a compositional grammar of tiles, orientation-flexible recursive Miller columns (`SvStackView` / `SvNavView`), inline flowing documents, anchored tabs, and docked companion panes.
2. **Persistence & Sync:** Synchronous in-memory reads backed by end-of-event-loop atomic IndexedDB transactions (`SvLocalRecordStore`), a SHA-256 content-addressed binary blob store (`SvBlobPool`), and versioned delta commits to cloud storage (`SvCloudRecordStore`).
3. **AI Agent Operability:** Auto-generated JSON Schemas and a constant-size two-tool interface (`schema-fetch` and `apply-patch`) that lets LLMs inspect and mutate the live object graph through the exact same validation and sync pipeline as human users.
4. **Cross-Cutting Infrastructure:** Framework-level ARIA roles/states, AI-powered runtime UI translation (`SvI18n`), drag-and-drop MIME serialization, headless Node.js execution (via LevelDB shims), and a built-in live property inspector (`Option+Click`).

Stylistically and architecturally, STRVCT brings Smalltalk, Self, Objective-C, and NeXTSTEP/Cocoa idioms (`ProtoClass.clone()`, Objective-C-style Categories, runtime-checked Protocols, `SvNotificationCenter`, responder chains, gesture recognizers, and programmatic CSS) to browser JavaScript, loaded via a custom Content-Addressable Memory (CAM) bundler (`_imports.json` + `eval` with `sourceURL`).

---

## Strengths

### 1. Extreme Leverage via the "Multi-Reader Annotation Bridge"
In a conventional stack, adding a single property touches a database migration, ORM model, API schema, client store, form component, i18n file, and LLM tool definition. In STRVCT, a single slot declaration propagates across UI, storage, sync, ARIA, i18n, and AI schemas simultaneously, making structural drift between layers nearly impossible.

### 2. A Credible Answer to the Naked Objects Usability Trap
Classic Naked Objects frameworks failed outside enterprise back-offices because every object looked like a database form and every collection looked like a table. STRVCT's "lens" grammar—combining horizontal and vertical recursive master-detail navigation, automatic viewport compaction into mobile push-stacks with breadcrumbs, multi-column inline documents (`nodeChildrenLayout`), width-arbitrated anchored tabs, and presentation delegation (`nodePresentedNode`)—covers a remarkably wide swath of real application UIs. Its flagship app (`undreamedof.ai`) reportedly runs ~90 domain classes while needing only 11 custom views (mostly 3D dice, battle maps, and print previews).

### 3. First-Class AI Operability and AI-Assisted Coding Fit
Exposing a constant $O(1)$ tool surface (`schema-fetch` + `apply-patch`) that returns offending slot schemas on rejected patches is a standout design for human/AI co-editing apps. Equally important, STRVCT is unusually friendly to AI coding agents ("vibe coding"): because features are mostly self-contained model classes with regular slot conventions, an LLM doesn't have to coordinate state across routes, hooks, reducers, CSS, and endpoints.

### 4. Thoughtful Local-First & Memory Engineering
STRVCT's runtime mechanics are carefully engineered:
* **Coalesced event-loop scheduling (`SvSyncScheduler`):** View-to-model updates (priority 0), notifications (priority 1), model-to-view updates (priority 2), and atomic IndexedDB dirty-object flushes happen in a deterministic end-of-tick order without virtual DOM diffing.
* **GC hygiene:** Extensive use of `WeakRef` and `WeakMap` in `SvNotificationCenter` and `addWeakTimeout()` prevents the listener and timer memory leaks common in long-lived object-oriented SPAs.
* **Clean headless execution:** Because models never reference views, domain graphs and storage tests run directly in Node.js against LevelDB without `jsdom` or Playwright.
* **Live introspection:** Every app ships as its own DevTools via `Option+Click` property inspectors and `Option+Shift+D` developer mode.

---

## Weaknesses, Gaps, and Risks

### 1. Total Ecosystem and Tooling Isolation
STRVCT rejects almost the entire modern web toolchain:
* **No npm or ES modules:** Distributed as a Git submodule; dependencies are vendored source files wired via `_imports.json` arrays and dynamically `eval()`ed from a zip/hash cache. Drop-in adoption of standard npm UI or utility libraries is off the table.
* **No TypeScript:** Relies on runtime slot checks and startup protocol verification rather than static analysis, sacrificing modern IDE refactoring, autocomplete, and compile-time safety across method calls.
* **No CSS stylesheets:** Styling is done via 100+ programmatic JS methods on `SvCssDomView` and custom theme dictionaries, cutting teams off from Tailwind, CSS Grid workflows, and standard design-to-code pipelines.
* **Non-idiomatic JS:** Mutates built-in prototypes (`Object`, `Array`, `Promise`, `String`), forbids `new` in favor of `.clone()`, and forbids `super` in `initPrototypeSlots()`. Onboarding mainstream JS developers carries a real relearning tax.

### 2. Unbuilt Collection Primitives and Scale Ceilings
The documentation is admirably candid about where implementation currently lags theory:
* **Missing layouts:** Aligned tables/spreadsheets, wrapping grids, charts, and spatial/grid maps are still *Future Work* proposals—today, linear `SvTilesView` stacks, anchored tabs, and inline documents carry the load.
* **Eager loading & synchronous navigation:** Object pools hydrate eagerly on open, and the navigation stack assumes subnodes are synchronously in memory. Without virtualized scrolling, `Lazy Slots`, or `Async Navigation` (all still unbuilt), collections of $10^4+$ items or massive remote graphs will hit memory and startup walls.

### 3. Permissions, Schema Evolution, and Concurrency Limits
* **No built-in ACL/capabilities layer yet:** Permission checks are currently ad-hoc; *Future Work* documents a real bug where an unauthorized local edit appeared to save before being silently dropped during cloud sync.
* **Coarse concurrency:** Cloud sync uses optimistic per-pool version checks where conflicts trigger a reload ("cloud wins") rather than field- or CRDT-level collaborative merging.
* **Minimal schema migration:** `ClassRenames.json` handles class renames and dropped slots are ignored, but versioned slot-type migrations are not yet supported—a risk for long-lived IndexedDB + cloud client caches.

### 4. Bus Factor, Single-App Validation, and Codebase Rough Edges
STRVCT is primarily a solo-authored framework extracted from one developer's projects, with no community ecosystem (no Discord, Stack Overflow presence, or corporate backing—the docs explicitly recommend feeding `llms-full.txt` to an AI assistant for support). The *Cleanup Notes* and *Future Work* also note ~170 TODOs, 71 unused files, recursive GC stack-overflow risks on very deep graphs, a few model-to-DOM boundary leaks, and accessibility/i18n implementations that have strong architectural bones but have not yet been audited against real screen readers (VoiceOver/NVDA) or RTL locales.

---

## Who Should and Shouldn't Use It

### Who Should Use STRVCT
* **Solo founders, researchers, and small teams** building complex, domain-heavy, logged-in "app-shell" SPAs (CRMs, campaign/world-building tools, structured knowledge bases, issue trackers, IoT/admin consoles) where the schema evolves rapidly.
* **Developers building AI-collaborative software** where humans and LLM agents co-edit rich structured state and need a unified, self-validating schema/patch surface out of the box.
* **AI-assisted ("vibe coding") workflows** where an LLM agent can rapidly spin up persistent, offline-capable apps by writing declarative domain classes rather than wiring full-stack boilerplate.

### Who Shouldn't Use STRVCT
* **Public content, publishing, or e-commerce sites** where SSR, fast cold first-contentful-paint, URL-driven SEO, and standard link routing are core requirements.
* **Design-led or pixel-bespoke consumer products** where every screen is a custom visual statement, or **media/canvas-first apps** (video editors, CAD, heavy spreadsheets/data-grids) where 90% of the app would bypass STRVCT's generated views anyway.
* **Large engineering organizations** that depend on TypeScript static guarantees, standard npm/React hiring pipelines, fine-grained multi-user RBAC, or real-time collaborative merging (CRDTs).

---

## How STRVCT Compares to Alternatives

| Alternative | How It Compares to STRVCT |
| :--- | :--- |
| **React / Vue / Svelte Stacks** *(+ Next.js, TanStack, shadcn)* | **Opposite tradeoffs.** Mainstream stacks give unmatched ecosystem depth, TypeScript safety, SSR/SEO, and pixel-level control, but impose $O(N)$ manual glue across DB, API, state, forms, ARIA, and AI tools. STRVCT eliminates the glue at the cost of ecosystem isolation and constrained layout freedom. |
| **Apache Causeway (Isis) / Classic Naked Objects** | **Philosophical cousins, different eras.** Causeway brings Naked Objects to enterprise Java backends with Wicket/REST viewers that still feel like traditional CRUD forms and tables. STRVCT modernizes the paradigm for local-first browser SPAs, AI agents, and fluid spatial/document navigation. |
| **Low-Code Builders** *(Retool, Appsmith, OutSystems)* | **Faster bespoke screens vs. no screens.** Low-code tools speed up dragging tables and forms onto canvases, but layouts and data bindings remain separate artifacts to maintain as models change, usually with proprietary hosting lock-in. STRVCT derives the UI from plain, MIT-licensed JS code. |
| **Local-First Sync Engines** *(Zero, ElectricSQL, Jazz, Automerge)* | **Storage layer vs. vertical framework.** Modern sync engines offer stronger relational queries or CRDT conflict resolution than STRVCT's pool-versioned store, and they plug into standard React/TypeScript stacks—but they stop at the data layer, leaving UI, navigation, accessibility, and AI tool surfaces to you. |
