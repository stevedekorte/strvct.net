# Comparing to React

A guide for React developers exploring Strvct — what's different, what's similar, and when each approach makes more sense.

## The Core Difference

React and Strvct solve the same fundamental problem — keeping a UI in sync with application state — but start from opposite ends.

**React** is a view library. You describe what the UI looks like for a given state, and React makes the DOM match. Everything else — the model, persistence, routing, styling — is yours to choose.

**Strvct** is a naked objects framework. You describe the domain model — its properties, relationships, and annotations — and the framework generates the UI, handles persistence, and manages navigation automatically. Custom views override the defaults when needed.

They represent genuinely different philosophies about where developer effort should go.

## Architecture

React is flexible about where it runs. A React app can be a client-side SPA, a server-rendered application, or a hybrid. The modern ecosystem includes server-side rendering (Next.js, Remix), static site generation, and server components — but none of these are required. Many React applications are purely client-side.

Strvct is **local-first** by design. Data is persisted client-side in IndexedDB automatically, rendering happens entirely on the client, and the UI is responsive without waiting on network round trips. Cloud sync is available for backup and cross-device access, but the application works fully offline.

### What You Write

In React, application code is primarily components — functions that return JSX describing the UI for a given state:

```jsx
function Contact({ contact, onSave }) {
    const [name, setName] = useState(contact.name);
    const [email, setEmail] = useState(contact.email);
    return (
        <div className="contact">
            <input value={name} onChange={e => setName(e.target.value)} />
            <input value={email} onChange={e => setEmail(e.target.value)} />
            <button onClick={() => onSave({ name, email })}>Save</button>
        </div>
    );
}
```

This component handles rendering and editing but says nothing about persistence, navigation, or how the contact fits into a larger application. Those are separate concerns handled by other code — which is React's deliberate design choice. You compose the pieces you need.

In Strvct, application code is primarily model classes — domain objects with annotated properties:

```javascript
(class Contact extends SvStorableNode {
    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
        }
        {
            const slot = this.newSlot("email", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
        }
    }

    initPrototype () {
        this.setTitle("Contact");
        this.setShouldStore(true);
    }
}.initThisClass());
```

This defines the data model, persistence, and UI behavior in one place. The framework generates editable fields, navigation tiles, and handles storage from the slot annotations. The tradeoff: you get less control over exactly how things look, and the annotation-driven style takes some getting used to.

### State Management

React uses unidirectional data flow. State lives in components (via `useState` or `useReducer`) or in external stores (Redux, Zustand, MobX). Views are pure functions of state. When state changes, React re-renders the affected component subtree and diffs a virtual DOM against the real DOM to compute minimal updates. This model is predictable and easy to reason about — given the same props, a component always renders the same output.

Strvct uses an asymmetric notification pattern. Views hold direct references to their model objects and can send messages to them. Model objects post notifications when they change but have no knowledge of views. When a slot value changes, the setter posts a notification; views observing that node sync in response. The model layer functions independently of the UI — the same model runs headlessly in Node.js with no view layer at all.

| | React | Strvct |
|---|---|---|
| State location | Components or external stores | Model objects (slots) |
| Change detection | Virtual DOM diffing | Notification-based, per-slot |
| Data flow | Unidirectional (state down, events up) | Asymmetric (views message models; models notify) |
| Update granularity | Component subtree re-render | Individual slot/view sync |
| Model-view coupling | Flexible (pure components to tightly coupled) | Strict separation (model has no knowledge of views) |
| Headless execution | Requires mocking DOM APIs | Native (model runs without UI) |

### UI Generation

React requires you to write every view explicitly. This gives full control over appearance, layout, and interaction — and it means the UI can look like anything. The cost is that each new entity type needs its own component, often with repeated patterns for forms, lists, and detail views.

Strvct generates views from model annotations. A property marked `setCanEditInspection(true)` gets an editable field. A property marked as a subnode gets a navigable tile. The framework selects field types based on slot type. Custom views override the defaults by naming convention: create `ContactView` and the framework uses it for `Contact` nodes automatically.

**React's strength**: Complete control over presentation. Bespoke UIs, data visualizations, highly branded experiences, and unconventional layouts are all straightforward.

**Strvct's strength**: Consistent UI with minimal code. Applications with many model types get a working interface from model definitions alone. The tradeoff is that the generated UI follows the framework's visual conventions — stepping outside them requires custom views.

## Persistence

React has no built-in persistence — you choose and integrate your own solution. This is intentional flexibility: REST APIs, GraphQL, Firebase, local storage, or ORMs all work. The tradeoff is integration effort and keeping the client model in sync with the persistence layer.

Strvct includes persistence as a core feature. Mark a class with `setShouldStore(true)` and slots with `setShouldStoreSlot(true)`, and the framework handles serialization, IndexedDB storage, dirty tracking, and transactional commits automatically. Changes are batched and committed at the end of each event loop.

**React's strength**: Freedom to choose the right persistence strategy for each use case. Server-rendered apps, offline-first PWAs, and real-time collaborative tools all have different needs.

**Strvct's strength**: Zero-effort client-side persistence. Because data is stored locally, there are no network round trips between the user and their data. Cloud sync adds backup and cross-device access without replacing the local store.

## Navigation

React relies on external routing libraries (React Router, Next.js routing). Routes map URL paths to components, and the resulting architecture supports deep linking, server-side rendering, and SEO naturally.

Strvct generates navigation from the model graph. The UI is a Miller Column browser — selecting an item reveals its children in the next column. Breadcrumbs, column compaction on small screens, and keyboard navigation are built in. Adding a new level of hierarchy to the model automatically creates a new level of navigation.

**React's strength**: URL-driven routing fits the web's architecture. Any navigation pattern — tabs, modals, drawers, wizards — can be implemented.

**Strvct's strength**: Navigation is always consistent with the data structure, with no routing configuration to maintain. The limitation is that the Miller Column pattern works best for hierarchical data. Flat layouts, dashboards, or wizard flows require custom views.

## Internationalization

React has no built-in i18n. Libraries like `react-intl` require maintaining separate translation files for each language and wrapping every visible string. Mature tooling exists for extraction, translation management, and CI checks.

Strvct translates the UI automatically. Because all UI text flows from model slots through a single rendering pipeline, translation is injected at that boundary without per-component work. The framework uses AI-powered translation with persistent caching, so adding a language is a configuration change rather than a translation project. The tradeoff is that AI translation quality, while generally good, may not match professional human translation for all domains.

## Resource Loading

React applications use standard ES module imports and bundlers (Vite, Webpack, esbuild). These provide source maps, hot module replacement, tree shaking, and code splitting. Cache invalidation relies on filename hashing.

Strvct uses a custom Content-Addressable Memory (CAM) system. Resources are stored by SHA-256 content hash. On load, the framework compares hashes against a local cache and only downloads what's changed. This provides efficient content-based caching but means standard bundler tooling and source maps aren't available — debugging relies on sourceURL comments instead.

## Ecosystem and Tradeoffs

This is where the two approaches differ most significantly.

**React** has a vast ecosystem. Component libraries, dev tools, testing frameworks, extensive documentation, and a large developer community mean that most problems have documented solutions and available help.

**Strvct** bundles its core functionality — UI generation, state management, persistence, navigation, resource loading, and caching — and includes a small number of third-party libraries as vendored source files rather than npm packages. This avoids package manager churn and ensures the pieces work together, but the tradeoff is real: fewer third-party integrations, less documentation, a non-standard module system that can't use npm packages directly, and a smaller community. When you hit a problem, you're more likely to need to read the framework source than find a Stack Overflow answer.

| | React | Strvct |
|---|---|---|
| Component libraries | Thousands (MUI, Ant Design, etc.) | Built-in tile system |
| State management | Redux, Zustand, MobX, Jotai, etc. | Built-in (slots + notifications) |
| Persistence | Choose your own | Built-in (IndexedDB + cloud sync) |
| Routing | React Router, Next.js, etc. | Built-in (model graph navigation) |
| Build tooling | Vite, Webpack, esbuild, etc. | Built-in (CAM resource system) |
| TypeScript | First-class support | Not used (dynamic evaluation) |
| npm ecosystem | Full access | Not used (vendored external libs) |
| Debugging | React DevTools, source maps | sourceURL-based, read the source |

## When to Consider Each

### React is likely the better choice when:

- You need a highly custom or branded visual design
- Your team benefits from React's well-documented patterns and large talent pool
- You need server-side rendering or static site generation
- SEO is critical
- You want access to the npm ecosystem and third-party components
- Your UI structure doesn't mirror a hierarchical domain model

### Strvct is worth considering when:

- Your application is data-model-driven (admin tools, content management, domain-heavy apps)
- You want persistence and UI generation without integration work
- You want a working UI from model definitions, with custom views only where needed
- You prefer a single cohesive framework over assembling pieces
- You're building a local-first or offline-capable application
- You want your model layer testable without a browser

### A note on SSR and SEO

The "SEO is critical" and "needs server-side rendering" criteria above rule Strvct out for marketing sites, content platforms, and traditional e-commerce — cases where first-paint latency and search discoverability are competitive necessities. That category is smaller than the defaults of modern web frameworks make it appear. A large share of high-value consumer software today — ChatGPT, Claude, Cursor, Figma, Linear, Notion, Discord, Character.ai, Suno, Midjourney — is app-shell SPAs, where the logged-in product is the product and the marketing site, if there is one, sits on a different stack. For that class of product, SSR isn't load-bearing, and framework choices that center it (Next.js, Remix, server components) are solving a problem these apps don't have. Strvct targets this shape of software directly: an authenticated client-side application with heavy state, real-time interaction, and no meaningful SEO surface.

## Concepts Mapping

For React developers getting oriented, here's how familiar concepts map:

| React Concept | Strvct Equivalent |
|---|---|
| Component | NodeView (auto-generated or custom) |
| Props | Slot values (accessed via getters) |
| State (useState) | Slots with `setSyncsToView(true)` |
| Context / prop drilling | SvNotificationCenter (publish/subscribe) |
| useEffect | Notification observations |
| Redux / Zustand | Slots + notification system (built in) |
| React Router | Model graph navigation (automatic) |
| JSX | No equivalent — UI generated from annotations |
| Virtual DOM | No equivalent — direct DOM updates via NodeView |
| npm install | No equivalent — external libs vendored as source |
