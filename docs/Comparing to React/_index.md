# Comparing to React

A guide for React developers exploring Strvct — what's different, what's similar, and when each approach makes more sense.

## The Core Difference

React and Strvct solve the same fundamental problem — keeping a UI in sync with application state — but start from opposite ends.

**React** is a view library. You describe what the UI looks like for a given state, and React makes the DOM match. The model, persistence, routing, and everything else are your problem (or your choice of libraries).

**Strvct** is a naked objects framework. You describe the domain model — its properties, relationships, and annotations — and the framework generates the UI, handles persistence, and manages navigation automatically. Custom views can be added where the defaults aren't sufficient.

They represent genuinely different philosophies about where developer effort should go.

## Architecture

React is a client-side library at its core, but the modern React ecosystem is increasingly server-first. Next.js Server Components, server-side rendering, and server actions mean a typical React application relies on server round trips for data fetching and rendering. React has no built-in persistence — for anything beyond ephemeral component state, you need a server, a cloud service, or hand-wired IndexedDB/localStorage code.

Strvct is **local-first** by design. Data is persisted client-side in IndexedDB automatically, rendering happens entirely on the client, and the UI is responsive without waiting on network round trips. Cloud sync is available for backup and cross-device access, but the application works fully offline. The local database also serves as a cache for cloud data — subsequent loads automatically use local copies from IndexedDB when the cloud version hasn't changed, making applications significantly faster and more bandwidth-efficient than architectures that re-fetch on every visit.

### What You Write

In React, the bulk of application code is components — functions that return JSX describing the UI for a given state. Domain logic lives elsewhere — in hooks, utility modules, API layers, or state management stores — and the component wires it all together:

```jsx
function Contact({ contact }) {
    const dispatch = useDispatch();
    return (
        <div className="contact">
            <h1>{contact.name}</h1>
            <p>{contact.email}</p>
            <button onClick={() => dispatch(archiveContact(contact.id))}>
                Archive
            </button>
        </div>
    );
}
// To make this actually work, you'd also need ~200-500 lines across:
// - a Redux slice or store with actions and reducers
// - an API service layer with fetch/axios calls
// - a server endpoint and database schema
// - loading/error state handling in the component
// - CSS or styled-components for the layout
```

In Strvct, the bulk of application code is model classes — domain objects with annotated properties. Data, behavior, and persistence live together on the same object:

```javascript
(class Contact extends SvStorableNode {
    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);  // auto-persist to IndexedDB
            slot.setSyncsToView(true);      // view updates when value changes
            slot.setCanEditInspection(true);// user can edit in the generated UI
            slot.setIsSubnodeField(true);   // show as a navigable field
        }
        {
            const slot = this.newSlot("email", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setIsSubnodeField(true);
        }
    }

    initPrototype () {
        this.setTitle("Contact");
        this.setShouldStore(true);          // enable persistence for this class
        this.setShouldStoreSubnodes(false);
    }

    // This is the complete implementation — no separate UI, state
    // management, persistence wiring, or routing code needed.
}.initThisClass());
```

The Strvct version has no UI code at all. The framework generates editable fields, navigation tiles, and persistence from the slot annotations. No dispatch, no reducer, no API call, no server round trip. The React version is more explicit about appearance but says nothing about storage, navigation, or where domain logic belongs — each requires additional code in separate files and libraries.

This difference compounds as an application grows. A React application with equivalent functionality typically needs separate code for the component, its styling, a state management slice, serialization logic, persistence wiring, route definitions, and navigation components. In Strvct, the model definition handles all of these at once — often an order of magnitude less total code for data-model-driven applications, and far fewer places for things to fall out of sync.

### State Management

React uses unidirectional data flow. State lives in components (via `useState` or `useReducer`) or in external stores (Redux, Zustand, MobX). Views are pure functions of state. When state changes, the component tree re-renders and React diffs a virtual DOM against the real DOM to compute minimal updates.

Strvct uses an asymmetric communication pattern. Views hold direct references to the model objects they present and can send messages to them. Model objects, however, have no knowledge of views — they only post notifications, which views may choose to observe. This means the model layer functions independently of the UI and doesn't require it to exist at all. The same model runs headlessly in Node.js for testing or server-side logic with no view layer. When a slot value changes, the setter posts a notification; views observing that node sync in response. When a user edits a value in a view, the view writes back to the slot, which posts another notification — but only if the value actually differs, preventing loops.

| | React | Strvct |
|---|---|---|
| State location | Components or external stores | Model objects (slots) |
| Change detection | Virtual DOM diffing | Notification-based, per-slot |
| Data flow | Unidirectional (state down, events up) | Asymmetric (views message models; models post notifications) |
| Update granularity | Component subtree re-render | Individual slot/view sync |
| Model-view coupling | Interleaved (logic in components) | Decoupled (model has no knowledge of views) |
| Headless execution | Requires mocking | Native (model runs without UI) |

**React's strength**: Unidirectional flow is easy to reason about. Given the same props, a component always renders the same output. This predictability scales well in large teams.

**Strvct's strength**: No intermediate representation to diff. Changes propagate directly from the specific slot that changed to the specific view displaying it. For deeply nested or frequently updating models, this avoids the overhead of diffing unchanged subtrees. The strict model-view separation also means the entire application can be tested without a browser.

### UI Generation

React requires you to write every view explicitly. This gives complete control over appearance and layout but means more code — and more surface area for bugs — as the application grows. Each new entity type needs its own component, often with duplicate patterns for forms, lists, detail views, and navigation.

Strvct generates views from model annotations. A property marked `setCanEditInspection(true)` gets an editable field. A property marked `setIsSubnodeField(true)` gets a navigable tile. The framework selects the appropriate field tile based on the slot type — string fields, boolean toggles, image wells, pointers to other objects, and so on. Custom views are added by naming convention: create a class called `ContactView` and the framework automatically uses it for `Contact` nodes. No registration or routing code needed.

**React's strength**: Complete control over every pixel. Bespoke UIs — marketing pages, data visualizations, highly branded experiences — are straightforward to build.

**React's weakness**: The virtual DOM reconciliation cycle adds overhead for high-frequency updates. Animations, real-time interactive graphics, and continuously updating visualizations work against React's render model. Libraries like Framer Motion and React Spring address this by manipulating the DOM directly — effectively bypassing React for the parts that need to be fast. For Canvas or WebGL, React components are thin wrappers around imperative code that operates outside React's paradigm entirely.

**Strvct's strength**: Uniform, consistent UI with minimal code. Applications with many model types get a working UI from the model definition alone — adding a new entity type requires zero view code. Because Strvct manipulates the DOM directly, custom views that need high-frequency updates (animations, live graphics) work with the framework rather than against it.

## Persistence

React has no built-in persistence. You choose and integrate your own solution — REST APIs, GraphQL, Firebase, local storage wrappers, or ORMs. Each brings its own patterns, boilerplate, and potential for state synchronization bugs between the client model and the persistence layer. In practice, persistence is often the most time-consuming part of a React application to get right.

Strvct includes persistence as a core feature. Mark a class with `setShouldStore(true)` and slots with `setShouldStoreSlot(true)`, and the framework handles serialization, IndexedDB storage, dirty tracking, and transactional commits automatically. Changes are batched and committed at the end of each event loop. Garbage collection removes unreachable objects from storage. Adding persistence to a new entity type is a single annotation — not a new endpoint, schema, and serialization layer.

**React's strength**: Freedom to choose the right persistence strategy for each use case. Server-rendered apps, offline-first PWAs, and real-time collaborative tools all have different needs, and React doesn't constrain you.

**Strvct's strength**: Zero-effort client-side persistence that's always consistent with the model. Because data is stored locally and the UI renders client-side, there are no network round trips between the user and their data — the interface feels immediate in a way that server-dependent architectures struggle to match. Strvct also supports cloud persistence for backup and cross-device sync, so local-first doesn't mean local-only.

## Navigation

React relies on external routing libraries (React Router, Next.js routing, etc.). Routes are defined as mappings from URL paths to components, and navigation state is managed separately from application state.

Strvct generates navigation from the model graph itself. The UI is a Miller Column browser — selecting an item reveals its children in the next column. Navigation depth is unlimited and automatic. Breadcrumbs, column compaction on small screens, and keyboard navigation are built in.

**React's strength**: URL-driven routing fits naturally with the web's architecture. Deep linking, server-side rendering, and SEO are straightforward. Any navigation pattern (tabs, modals, drawers, wizards) can be implemented.

**React's limitation**: Every level of navigation requires explicit code — route definitions, component mappings, parameter handling, and layout wiring. Adding depth to the data model means writing corresponding routing and navigation code at each level.

**Strvct's strength**: Navigation is always consistent with the data structure. Adding a new level of hierarchy to the model automatically creates a new level of navigation — no routing configuration to maintain. Navigation is reactive to arbitrary depth; the model graph defines the hierarchy and the UI follows with no per-level wiring.

**Strvct's limitation**: The Miller Column pattern works well for hierarchical data but is not always the right fit. Flat page-based layouts, dashboard grids, or wizard flows require custom views to override the default navigation.

## Dependency Management

A typical React application depends on dozens of npm packages for functionality that Strvct provides out of the box. A real-world React project might include React itself, React DOM, React Router, Redux or Zustand, a form library, a component library, a CSS-in-JS solution, a persistence layer, a build tool, and their transitive dependencies — often hundreds of packages in `node_modules`.

This creates ongoing maintenance burden: dependency updates, breaking changes between packages, security advisories, and version conflicts. The JavaScript ecosystem moves fast, and keeping dependencies current is a continuous cost.

Strvct is self-contained. It has no npm dependencies for its core functionality. The framework, UI generation, state management, persistence, navigation, and resource loading are all part of a single codebase. External libraries are included as source files, not as versioned packages. This eliminates dependency churn and ensures that all parts of the framework are designed to work together.

## Boilerplate and Ceremony

React applications accumulate significant boilerplate as they grow. Creating a new feature typically involves:

1. A component file with JSX
2. A CSS module or styled-components file
3. A state slice or store module
4. Action creators and reducers (or equivalent)
5. API service functions
6. Type definitions (if using TypeScript)
7. Route configuration
8. Test files for each of the above

In Strvct, a new feature is typically a single model class file. The framework derives the UI, persistence, navigation, and type information from the model's slot annotations. Tests can exercise the model directly without mocking a browser environment. This isn't just less code — it's fewer files, fewer abstractions, and fewer conventions to learn and maintain.

## Ecosystem and Tooling

This is where the two approaches differ most starkly.

**React** has one of the largest ecosystems in frontend development. Thousands of component libraries, extensive tooling (DevTools, testing frameworks, linters, type checkers), comprehensive documentation, and a massive hiring pool. Almost any problem you encounter has a documented solution.

**Strvct** is a self-contained framework with a small community. It bundles what React applications typically assemble from multiple packages — UI generation, state management, persistence, resource loading, and caching — but the tradeoff is fewer third-party integrations, less documentation, and a steeper initial learning curve for developers coming from the React ecosystem.

| | React | Strvct |
|---|---|---|
| Component libraries | Thousands (MUI, Ant Design, etc.) | Built-in tile system |
| State management | Redux, Zustand, MobX, Jotai, etc. | Built-in (slots + notifications) |
| Persistence | Choose your own | Built-in (IndexedDB + cloud sync) |
| Routing | React Router, Next.js, etc. | Built-in (model-driven navigation) |
| Build tooling | Vite, Webpack, esbuild, etc. | Built-in (CAM resource system) |
| Testing | Jest, Testing Library, Playwright | Playwright + headless model testing |
| TypeScript | First-class support | Not used (dynamic evaluation) |
| npm dependencies | Dozens to hundreds | None (self-contained) |
| Community size | Very large | Small |

## Resource Loading and Caching

React applications use standard ES module imports and bundlers (Vite, Webpack, esbuild). Cache invalidation relies on filename hashing — when a file changes, its hash changes, and browsers fetch the new version. Changing one file in a chunk invalidates the entire chunk.

Strvct uses a custom Content-Addressable Memory (CAM) system. Resources are stored in IndexedDB by their SHA-256 content hash. On load, the framework compares hashes in a small index file against the local cache and only downloads what's changed — either individually for small updates or as a compressed bundle for large ones. Identical content across different files is stored only once.

**React's strength**: Standard tooling means broad compatibility, source maps, hot module replacement, tree shaking, and code splitting out of the box.

**React's limitation**: Bundler-based loading doesn't scale gracefully to large numbers of files. As a codebase grows to hundreds or thousands of modules, build times increase, chunk splitting strategies become complex to tune, and cache invalidation gets coarser. Developers end up spending significant time configuring and debugging the build pipeline itself.

**Strvct's strength**: True content-based caching with automatic deduplication. After the first load, only genuinely changed content is transferred — no cache-busting URL changes needed, no re-downloading unchanged modules because a sibling in the same chunk changed. The CAM system scales linearly with the number of files and requires no build configuration to maintain.

### Estimated Load Times vs. Strvct

Approximate Strvct speedup over React, assuming ~10KB average file size and typical broadband.

| Files | Strvct 1st load | Strvct 2nd load |
|------:|:---------------:|:---------------:|
| 100   | 1.5x faster     | 3x faster       |
| 200   | 1.8x faster     | 4x faster       |
| 800   | 2.5x faster     | 6x faster       |
| 1600  | 3x faster       | 10x faster      |

On first load, Strvct downloads a single compressed bundle rather than multiple chunks. On second load, the gap widens dramatically: React must validate or look up each cached chunk (conditional HTTP requests or per-chunk disk cache hits), and this cost grows with file count. Strvct fetches only the small index file, compares hashes locally against IndexedDB, and — if nothing has changed — makes no further network requests at all. Its second-load time barely increases regardless of how many files the application contains.

## When to Consider Each

### React is likely the better choice when:

- You need a highly custom, bespoke visual design
- Your team is large and benefits from React's predictable, well-documented patterns
- You need server-side rendering or static site generation
- SEO is critical
- You want access to a large ecosystem of third-party components
- Your application is primarily view-driven (the UI structure doesn't mirror a domain model)

### Strvct is worth considering when:

- Your application is data-model-driven (admin tools, content management, configuration editors, domain-heavy apps)
- You want built-in persistence without integration work
- You want a working UI from model definitions alone, with custom views only where needed
- You want to minimize total code and the number of moving parts
- You value a single cohesive framework over assembling pieces from the ecosystem
- You're building a local-first or offline-capable application
- You want your model layer to be testable without a browser

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
| JSX | No equivalent — UI generated from model annotations |
| Virtual DOM | No equivalent — direct DOM updates via NodeView |
| Component library (MUI, etc.) | Built-in tile and field tile system |
| localStorage / IndexedDB wrapper | Built-in persistence via `setShouldStore` |
| Webpack / Vite | Built-in CAM resource system |
| npm install | No equivalent — framework is self-contained |
| package.json dependencies | No equivalent — no external dependencies |
