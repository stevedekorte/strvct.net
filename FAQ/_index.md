# FAQ

Frequently asked questions about STRVCT.

## What is the naked objects pattern?

The idea that the domain model should be the user interface. Instead of writing separate view code for every screen, you annotate model classes with metadata (which properties are editable, which should persist, how they relate to each other) and the framework generates a complete, navigable UI from those annotations. The pattern was proposed by Richard Pawson in his 2004 PhD thesis. STRVCT's contribution is a set of composable UI primitives — tiles, tile stacks, and nested master-detail views — that make the generated interfaces feel like hand-crafted ones.

## Do I have to use the generated UI?

No. The auto-generated views cover the common case, but you can override any node's view by creating a custom view class that follows the naming convention (e.g., `MyNodeView` for `MyNode`). In practice, most applications need very few custom views — undreamedof.ai has ~90 domain classes and fewer than 10 custom views, all for inherently graphical things like 3D dice, maps, and chat.

## Does STRVCT use npm or standard ES modules?

STRVCT does not use npm or standard ES module imports. It has its own content-addressable resource loading system — you declare dependencies in `_imports.json` files, and the build tools produce optimized, hash-indexed bundles. This gives true content-based caching — unchanged code is never re-downloaded, even across deployments — which standard bundlers can't achieve. The tradeoff is that standard import/export syntax isn't used within the framework, and npm packages can't be used directly. A handful of third-party libraries (pako, htmlparser2, jwt-decode, js-sha256, simple-peer) are included as source files in `external-libs/` rather than managed through a package manager.

This approach also has a security benefit: there are no transitive dependencies, no post-install scripts, and no exposure to supply chain attacks through compromised or malicious npm packages. The entire dependency tree is vendored source in the repository — auditable and version-controlled.

## How does persistence work?

Mark a class with `setShouldStore(true)` and its slots with `setShouldStoreSlot(true)`. The framework handles everything else: dirty tracking, batched commits at the end of each event loop, and transparent IndexedDB storage. Objects loaded from storage go through the same initialization lifecycle as new objects — no separate code paths. Cloud sync to Firebase Storage is available by extending `SvSyncableArrayNode` and providing a folder name.

## Is STRVCT local-first?

Yes. Data lives in the browser's IndexedDB by default. The application works fully offline. Cloud sync is opt-in and additive — it backs up data and enables cross-device access, but the local database is always the primary store and serves as a cache for cloud data on subsequent loads.

## How does STRVCT handle styling?

All styling uses named JavaScript methods (`setBackgroundColor()`, `setFlexDirection()`, `setPadding()`) rather than CSS files. Themes are swappable dictionaries that can be scoped to any subtree. This avoids the combinatorial explosion of CSS selectors when views have multiple independent states (selected, disabled, highlighted, error, etc.) that interact visually. See the [Programmatic Styling](docs/Views/Programmatic%20Styling/index.html) docs for details.

## What about routing?

There is no router. The object graph is the navigation structure. Nested objects produce drill-down columns. Breadcrumbs, column compaction on narrow viewports, and keyboard navigation are built in. Adding a new object type to the model automatically makes it navigable — no route configuration needed.

## What browsers does STRVCT support?

Modern evergreen browsers (Chrome, Firefox, Safari, Edge). STRVCT uses contemporary JavaScript features like WeakRef, FinalizationRegistry, and private class fields. There is no transpilation step or polyfill layer.

## Is STRVCT production-ready?

STRVCT is in active development and used in production by [undreamedof.ai](https://undreamedof.ai), an AI-powered virtual tabletop for D&D with ~90 domain classes, multiplayer sessions, cloud sync, and AI integration. The framework has been in continuous development since 2018. It is not yet widely adopted and the API may still change.

## What's the history of this project?

STRVCT began as internal infrastructure, not as a framework project. The earliest code was written in 2016 as part of an application called bitmarkets.js — Miller columns, a node hierarchy, and slot-based persistence — and was carried into a second unrelated application, voluntary.app, starting in 2017. The framework code was progressively separated from application code and extracted into its own repository, strvct.net, in 2020. It has since grown to include the object pool persistence system, gestures and drag-and-drop, content-addressable builds, cloud sync, and internationalization. The [Timeline](../Timeline/index.html) has the full list of milestones.

The project has not been publicly marketed or announced. Its only public presence is the GitHub repository and links from the author's GitHub and Twitter profile subtitles. It is not a commercial product, has no funding or sponsoring organization, and is developed as a personal framework — used in production by [undreamedof.ai](https://undreamedof.ai).

## How does STRVCT work with AI-assisted development?

STRVCT's architecture is well suited to AI-assisted "vibe coding." In a conventional framework, building a feature means coordinating across components, stylesheets, state management, persistence wiring, route definitions, and API layers — an AI has to understand and keep all of these in sync. In STRVCT, a feature is typically a single model class with annotated slots. The AI only needs to describe the domain — what properties an object has, which should persist, which are editable — and the framework handles the rest.

This means an AI can produce working, persistent, navigable applications from high-level descriptions of the domain model without needing to generate or coordinate view code, storage logic, or navigation. The consistent slot annotation pattern is easy to learn from examples, and the same pattern applies to every class in the system. For complex, data-model-driven applications, this can dramatically reduce the amount of code an AI needs to generate and the number of places things can go wrong.

## How do I get started?

See the [Example App](Example%20App/index.html) for a complete working application in four classes, or the [Getting Started](docs/Getting%20Started/index.html) guide for setup and project structure.
