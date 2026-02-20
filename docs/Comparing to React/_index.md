# Comparing to React

A guide for React developers exploring Strvct — what's different, what's similar, and when each approach makes more sense.

## The Core Difference

React and Strvct solve the same fundamental problem — keeping a UI in sync with application state — but start from opposite ends.

**React** is a view library. You describe what the UI looks like for a given state, and React makes the DOM match. The model, persistence, routing, and everything else are your problem (or your choice of libraries).

**Strvct** is a naked objects framework. You describe the domain model — its properties, relationships, and annotations — and the framework generates the UI, handles persistence, and manages navigation automatically. Custom views can be added where the defaults aren't sufficient.

This isn't a matter of one being better. They represent genuinely different philosophies about where developer effort should go.

## Architecture

### What You Write

In React, the bulk of application code is components — functions or classes that return JSX describing the UI for a given state:

```jsx
function UserProfile({ user }) {
    return (
        <div className="profile">
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            <button onClick={() => editUser(user.id)}>Edit</button>
        </div>
    );
}
```

In Strvct, the bulk of application code is model classes — domain objects with annotated properties:

```javascript
(class UserProfile extends SvStorableNode {
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
}.initThisClass());
```

The Strvct version has no UI code. The framework generates editable fields, navigation tiles, and persistence from the slot annotations. The React version is more explicit about appearance, but says nothing about storage or navigation.

### State Management

React uses a unidirectional data flow. State lives in components (via `useState` or `useReducer`) or in external stores (Redux, Zustand, MobX). Views are pure functions of state. When state changes, the component tree re-renders and React diffs the virtual DOM against the real DOM to determine minimal updates.

Strvct uses bidirectional synchronization via notifications. Model objects own their state in slots. When a slot value changes, the slot setter posts a notification. Views observing that node receive the notification and sync. When a user edits a value in a view, the view writes back to the slot, which posts another notification — but only if the value actually differs, preventing loops.

| | React | Strvct |
|---|---|---|
| State location | Components or external stores | Model objects (slots) |
| Change detection | Virtual DOM diffing | Notification-based, per-slot |
| Data flow | Unidirectional (state down, events up) | Bidirectional (slot notifications) |
| Update granularity | Component subtree re-render | Individual slot/view sync |

**React's strength**: Unidirectional flow is easy to reason about. Given the same props, a component always renders the same output. This predictability scales well in large teams.

**Strvct's strength**: No intermediate representation (virtual DOM) to diff. Changes propagate directly from the specific slot that changed to the specific view displaying it. For deeply nested or frequently updating models, this avoids the overhead of diffing unchanged subtrees.

### UI Generation

React requires you to write every view explicitly. This gives total control over appearance and layout, but means more code — and more surface area for bugs — as the application grows.

Strvct generates views from model annotations. A property marked with `setCanEditInspection(true)` gets an editable field. A property marked with `setIsSubnodeField(true)` gets a navigable tile. The framework selects the appropriate field tile type based on the slot type (string fields, boolean toggles, image wells, etc.).

Custom views are added by naming convention: create a class called `UserProfileView` and the framework automatically uses it for `UserProfile` nodes. No registration or routing code needed.

**React's strength**: Complete control over every pixel. Complex, bespoke UIs (marketing pages, data visualizations, highly branded experiences) are straightforward to build.

**Strvct's strength**: Uniform, consistent UI with minimal code. Applications with many model types (admin panels, data-heavy tools, content management systems) get a working UI from the model definition alone. Adding a new model type doesn't require writing any view code.

## Persistence

React has no built-in persistence. You choose and integrate your own solution — REST APIs, GraphQL, Firebase, local storage wrappers, or ORMs. Each choice brings its own patterns, boilerplate, and potential for state synchronization bugs between the client model and the persistence layer.

Strvct includes persistence as a core feature. Mark a class with `setShouldStore(true)` and slots with `setShouldStoreSlot(true)`, and the framework handles serialization, IndexedDB storage, dirty tracking, and transactional commits automatically. Changes are batched and committed at the end of each event loop. Garbage collection removes unreachable objects from storage.

This is a significant difference in practice. In a React application, wiring up persistence for a new entity type typically involves defining a schema, writing serialization/deserialization logic, creating API endpoints or store actions, and handling loading states. In Strvct, it's a slot annotation.

**React's strength**: Freedom to choose the right persistence strategy for each use case. Server-rendered apps, offline-first PWAs, and real-time collaborative tools all have different persistence needs, and React doesn't constrain you.

**Strvct's strength**: Zero-effort client-side persistence that's always consistent with the model. For applications where local-first storage is appropriate, the built-in system eliminates an entire category of bugs.

## Navigation

React relies on external routing libraries (React Router, Next.js routing, etc.). Routes are typically defined as a mapping from URL paths to components, and navigation state is managed separately from application state.

Strvct generates navigation from the model graph itself. The UI is a Miller Column browser — selecting an item reveals its children in the next column. Navigation depth is unlimited and automatic. Breadcrumbs, column compaction on small screens, and keyboard navigation are built in.

**React's strength**: URL-driven routing fits naturally with the web's architecture. Deep linking, server-side rendering, and SEO are straightforward. Any navigation pattern (tabs, modals, drawers, wizards) can be implemented.

**Strvct's strength**: Navigation is always consistent with the data structure. Adding a new level of hierarchy to the model automatically creates a new level of navigation. No routing configuration to maintain.

**Strvct's limitation**: The Miller Column pattern works well for hierarchical data but is not always the right fit. Flat page-based layouts, dashboard grids, or wizard flows require custom views to override the default navigation.

## Ecosystem and Tooling

This is where the two approaches differ most starkly.

**React** has one of the largest ecosystems in frontend development. Thousands of component libraries, extensive tooling (DevTools, testing frameworks, linters, type checkers), comprehensive documentation, and a massive hiring pool. Almost any problem you encounter has a documented solution.

**Strvct** is a self-contained framework with a small community. It bundles what React applications typically assemble from multiple packages — UI generation, state management, persistence, resource loading, and caching — but the tradeoff is fewer third-party integrations, less documentation, and a steeper initial learning curve for developers coming from the React ecosystem.

| | React | Strvct |
|---|---|---|
| Component libraries | Thousands (MUI, Ant Design, etc.) | Built-in tile system |
| State management | Redux, Zustand, MobX, Jotai, etc. | Built-in (slots + notifications) |
| Persistence | Choose your own | Built-in (IndexedDB) |
| Routing | React Router, Next.js, etc. | Built-in (model-driven navigation) |
| Build tooling | Vite, Webpack, esbuild, etc. | Built-in (CAM resource system) |
| Testing | Jest, Testing Library, Playwright | Playwright |
| TypeScript | First-class support | Not used (dynamic evaluation) |
| Community size | Very large | Small |

## Resource Loading and Caching

React applications use standard ES module imports and bundlers (Vite, Webpack, esbuild). Cache invalidation relies on filename hashing — when a file changes, its hash changes, and browsers fetch the new version.

Strvct uses a custom Content-Addressable Memory (CAM) system. Resources are stored in IndexedDB by their SHA-256 content hash. On load, the framework compares hashes in a small index file against the local cache and only downloads what's changed — either individually for small updates, or as a compressed bundle for large ones. Identical content across different files is stored only once.

**React's strength**: Standard tooling means broad compatibility, source maps, hot module replacement, tree shaking, and code splitting out of the box.

**Strvct's strength**: True content-based caching with automatic deduplication. After the first load, only genuinely changed content is transferred — no cache-busting URL changes needed, no re-downloading unchanged modules because a sibling changed.

## When to Consider Each

### React is likely the better choice when:

- You need a highly custom, bespoke visual design
- Your team is large and benefits from React's predictable, well-documented patterns
- You need server-side rendering or static site generation
- SEO is important
- You want access to a large ecosystem of third-party components and integrations
- Your application is primarily view-driven (the UI structure doesn't mirror a domain model)

### Strvct is worth considering when:

- Your application is data-model-driven (admin tools, content management, configuration editors, domain-heavy apps)
- You want built-in local persistence without integration work
- A consistent, automatically-generated UI is acceptable (with custom views where needed)
- You want to minimize the amount of view code you write and maintain
- You value a single cohesive framework over assembling pieces from the ecosystem
- You're building a local-first or offline-capable application

## Concepts Mapping

For React developers getting oriented, here's how familiar concepts map:

| React Concept | Strvct Equivalent |
|---|---|
| Component | NodeView (auto-generated or custom) |
| Props | Slot values (accessed via getters) |
| State (useState) | Slots with `setSyncsToView(true)` |
| Context | SvNotificationCenter (publish/subscribe) |
| useEffect | Notification observations |
| Redux / Zustand | Slots + notification system |
| React Router | Model graph navigation (automatic) |
| JSX | No equivalent — UI generated from model annotations |
| Virtual DOM | No equivalent — direct DOM updates via NodeView |
| Component library (MUI, etc.) | Built-in tile and field tile system |
| localStorage / IndexedDB wrapper | Built-in persistence via `setShouldStore` |
| Webpack / Vite | Built-in CAM resource system |
