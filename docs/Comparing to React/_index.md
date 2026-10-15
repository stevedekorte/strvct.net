# Comparing to React

A technical guide and conceptual "Rosetta Stone" for React developers exploring Strvct.

## Core Architectural Divergence

React and Strvct both keep user interfaces synchronized with application state, but they start from opposite design philosophies:

- **React is a View-First Library:** You author component trees in JSX, manage component state (`useState`, `useReducer`, Redux, Zustand), and write custom render functions. You are responsible for integrating state management, form components, ORMs, REST/GraphQL APIs, routing, internationalization, and accessibility.
- **Strvct is a Model-First Naked Objects Framework:** You declare the domain model (`SvStorableNode` classes) with annotated property **slots**. The framework automatically derives the user interface, manages local IndexedDB persistence and cloud sync, generates Miller column navigation, and provides an AI tool surface without hand-authored UI code.

<svg viewBox="0 0 820 410" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
  </style>

  <rect class="box" x="90" y="20" width="290" height="370"/>
  <text x="105" y="42" class="b">React (View-First)</text>
  <text x="105" y="62" class="dim">Component &amp; Rendering Library</text>

  <rect class="fill" x="105" y="85" width="260" height="124"/>
  <text x="120" y="105" class="b">You Must Author &amp; Maintain:</text>
  <text x="120" y="123" class="dim">• UI Components (JSX / TSX)</text>
  <text x="120" y="141" class="dim">• Form Controls &amp; Validation</text>
  <text x="120" y="159" class="dim">• State Stores (Redux/Zustand)</text>
  <text x="120" y="177" class="dim">• Routing &amp; Navigation Graphs</text>
  <text x="120" y="195" class="dim">• REST/GraphQL/ORM Sync Logic</text>

  <rect class="fill" x="105" y="224" width="260" height="106"/>
  <text x="120" y="244" class="b">Framework Provides:</text>
  <text x="120" y="262" class="dim">• Virtual DOM Reconciliation</text>
  <text x="120" y="280" class="dim">• Component Lifecycle &amp; Hooks</text>
  <text x="120" y="298" class="dim">• Event Delegation System</text>

  <text x="105" y="354" class="dim">Requires continuous manual sync</text>
  <text x="105" y="372" class="dim">across model, UI, &amp; API schemas.</text>

  <rect class="box" x="440" y="20" width="290" height="370"/>
  <text x="455" y="42" class="b">Strvct (Model-First)</text>
  <text x="455" y="62" class="dim">Naked Objects Framework</text>

  <rect class="fill" x="455" y="85" width="260" height="106"/>
  <text x="470" y="105" class="b">You Author:</text>
  <text x="470" y="123" class="dim">• Domain Models (SvNode classes)</text>
  <text x="470" y="141" class="dim">• Slot Annotations (metadata)</text>
  <text x="470" y="159" class="dim">• Action Methods (business logic)</text>

  <rect class="fill" x="455" y="206" width="260" height="124"/>
  <text x="470" y="226" class="b">Framework Provides Automatically:</text>
  <text x="470" y="244" class="dim">• Miller Column UI Generation</text>
  <text x="470" y="262" class="dim">• Local IndexedDB &amp; Cloud Sync</text>
  <text x="470" y="280" class="dim">• Native AI Tool Surface</text>
  <text x="470" y="298" class="dim">• Headless Node.js Execution</text>
  <text x="470" y="316" class="dim">• Universal Accessibility &amp; i18n</text>

  <text x="455" y="354" class="dim">Zero UI maintenance cost;</text>
  <text x="455" y="372" class="dim">model change updates all layers.</text>
</svg>

---

## Code Comparison: Defining a Editable Contact Record

### The React Approach (Manual Component + State + Persistence Wiring)

```jsx
// ContactForm.jsx - Hand-authored UI component
function ContactForm({ contactId, onSave }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState({});

    useEffect(() => {
        // Fetch from API or local store
        api.getContact(contactId).then(data => {
            setName(data.name);
            setEmail(data.email);
        });
    }, [contactId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.includes("@")) {
            setErrors({ email: "Invalid email address" });
            return;
        }
        await api.updateContact(contactId, { name, email });
        onSave();
    };

    return (
        <form onSubmit={handleSubmit} className="contact-form">
            <label>Name:
                <input value={name} onChange={e => setName(e.target.value)} />
            </label>
            <label>Email:
                <input value={email} onChange={e => setEmail(e.target.value)} />
                {errors.email && <span className="error">{errors.email}</span>}
            </label>
            <button type="submit">Save Changes</button>
        </form>
    );
}
```

*Summary:* Requires manually coding state hooks, form inputs, validation error handlers, API serializers, and submit listeners.

### The Strvct Approach (Model-First Slot Declaration)

```javascript
// Contact.js - Annotated domain model
(class Contact extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);   // Persist to IndexedDB
            slot.setSyncsToView(true);       // Live UI update
            slot.setCanEditInspection(true); // Editable field
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

*Summary:* Declares properties and metadata once. Strvct automatically derives editable UI input fields, handles IndexedDB persistence, emits change notifications, generates Miller column navigation tiles, and exposes an AI tool specification.

---

## Concept Mapping ("Rosetta Stone")

| React Concept | Strvct Equivalent | Architectural Difference |
|---|---|---|
| **Component (`JSX`)** | `SvNodeView` (Auto-generated or custom subclass) | React components render JSX trees. Strvct views are derived lazily at runtime from `SvNode` slot metadata. |
| **State (`useState`)** | Slot getters/setters (`this.name()`, `this.setName(v)`) | React state lives in components. Strvct state lives in model slots (`setSyncsToView(true)`). |
| **Context / Redux Store** | `SvNotificationCenter` & `SvModel` Object Graph | React uses context or external stores for global state. Strvct uses a single local object graph with notification observers. |
| **Effects (`useEffect`)** | Notification Observations (`SvNotificationCenter`) | React runs effect hooks after render passes. Strvct observes model events via weak notifications. |
| **React Router / Next.js** | Miller Column Navigation (`SvStackView`, `SvNavView`) | React maps URLs to components manually. Strvct derives navigation paths directly from parent-child object relationships. |
| **ORM / REST API Sync** | `SvPersistentObjectPool` (IndexedDB + Cloud) | React requires custom API calls (Axios/TanStack Query). Strvct commits dirty nodes automatically at the end of each event loop. |
| **Virtual DOM Reconciliation** | Per-Slot Notification Sync (`SvSyncScheduler`) | React diffs full virtual DOM trees. Strvct updates individual DOM elements directly via coalesced slot change passes. |
| **Bundlers (Vite / Webpack)** | Content-Addressable Memory (`CAM`) System | React bundles code into chunks. Strvct caches individual source files in IndexedDB by SHA-256 hash. |
| **TypeScript / Prop Types** | Slot Type Declarations (`slot.setSlotType("String")`) | React uses compile-time type checking. Strvct enforces runtime type checking on setters and AI JSON patches. |

---

## State & Change Propagation

<svg viewBox="0 0 820 280" width="820" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 12px; fill: #111; }
    .b { font-weight: 600; }
    .dim { fill: #666; }
    .box { fill: none; stroke: #111; stroke-width: 1; }
    .fill { fill: #f0ede5; stroke: #111; stroke-width: 1; }
    .flow { stroke: #111; stroke-width: 1; fill: none; }
    .flow-dashed { stroke: #111; stroke-width: 1; fill: none; stroke-dasharray: 4 3; }
  </style>
  <defs>
    <marker id="aro" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#111"/>
    </marker>
  </defs>

  <rect class="box" x="30" y="20" width="360" height="240"/>
  <text x="45" y="42" class="b">React (Unidirectional Data Flow)</text>

  <rect class="fill" x="45" y="55" width="330" height="35"/>
  <text x="60" y="77" class="dim">1. State Change (useState / Redux)</text>

  <line class="flow" x1="210" y1="90" x2="210" y2="105" marker-end="url(#aro)"/>

  <rect class="fill" x="45" y="105" width="330" height="35"/>
  <text x="60" y="127" class="dim">2. Component Subtree Re-Render</text>

  <line class="flow" x1="210" y1="140" x2="210" y2="155" marker-end="url(#aro)"/>

  <rect class="fill" x="45" y="155" width="330" height="35"/>
  <text x="60" y="177" class="dim">3. Virtual DOM Tree Diffing</text>

  <line class="flow" x1="210" y1="190" x2="210" y2="205" marker-end="url(#aro)"/>

  <rect class="fill" x="45" y="205" width="330" height="35"/>
  <text x="60" y="227" class="dim">4. Real DOM Minimal Patch</text>


  <rect class="box" x="430" y="20" width="360" height="240"/>
  <text x="445" y="42" class="b">Strvct (Asymmetric Notification)</text>

  <rect class="fill" x="445" y="55" width="330" height="35"/>
  <text x="460" y="77" class="dim">1. View Calls Model Setter</text>

  <line class="flow" x1="610" y1="90" x2="610" y2="105" marker-end="url(#aro)"/>

  <rect class="fill" x="445" y="105" width="330" height="35"/>
  <text x="460" y="127" class="dim">2. Model Slot Updates Internal State</text>

  <line class="flow-dashed" x1="610" y1="140" x2="610" y2="155" marker-end="url(#aro)"/>

  <rect class="fill" x="445" y="155" width="330" height="35"/>
  <text x="460" y="177" class="dim">3. Notification Posted via Center</text>

  <line class="flow" x1="610" y1="190" x2="610" y2="205" marker-end="url(#aro)"/>

  <rect class="fill" x="445" y="205" width="330" height="35"/>
  <text x="460" y="227" class="dim">4. Coalesced View Pull &amp; Render</text>
</svg>

- **React:** Uses unidirectional data flow with Virtual DOM diffing. A state update triggers a re-render of the component subtree, computing a Virtual DOM delta to patch the real DOM.
- **Strvct:** Uses an asymmetric notification model. Views call setter methods on model nodes. Setters update slot state and post named notifications via `SvNotificationCenter`. `SvSyncScheduler` coalesces multiple updates within the event loop, notifying observing views to pull updated values directly.

---

## Detailed Paradigm Comparison

| Dimension | React Ecosystem | Strvct Framework |
|---|---|---|
| **Primary Artifact** | Authored Component Trees (`JSX`) | Annotated Domain Models (`SvNode`) |
| **UI Derivation** | Manual per screen | 100% Derived automatically |
| **Persistence Strategy** | Custom integration (REST, GraphQL, Firebase) | Built-in local IndexedDB pools + Cloud Sync |
| **Offline Support** | Complex PWA / Service Worker setup | Native local-first (offline by default) |
| **AI Agent Interop** | Custom per-screen tool definitions | Native constant-size tool surface (`schema-fetch` / `apply-patch`) |
| **Headless Testing** | Requires jsdom / Puppeteer | Native Node.js execution (zero DOM dependencies) |
| **Internationalization** | Manual string wrapping & translation files | Intercepted centrally at tile primitive boundary |
| **Module Ecosystem** | Full npm ecosystem & Vite / Webpack | Vendored libraries & Content-Addressable Memory (`CAM`) |

---

## Decision Matrix: When to Use Which?

### Choose React When:
- You are building a marketing site, landing page, or media-rich portal requiring highly branded, bespoke visuals.
- Server-Side Rendering (SSR) or Search Engine Optimization (SEO) is a primary business requirement.
- Your application relies heavily on third-party npm UI component libraries (e.g., shadcn/ui, MUI, Ant Design).
- Your UI design bears no structural relationship to a structured domain model.

### Choose Strvct When:
- You are building a data-model-intensive application (CRMs, ERPs, project management, RPG gaming tools, settings panels).
- You want zero-maintenance UI generation and client-side persistence without writing component or glue code.
- You want native, zero-cost AI agent operability over your entire data model.
- You are building a local-first application that must function offline with cloud synchronization.
- You want ultra-fast, headless unit and integration testing under Node.js without browser automation.
