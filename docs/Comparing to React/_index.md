# Comparing to React

A guide to Strvct for developers who know React.

## The Short Version

React and Strvct start from opposite ends. React starts from the view: you write the screens, and the model, storage, and sync are yours to connect. Strvct starts from the model: you write the domain objects, and the screens, storage, and sync are derived from them.

React is a view library. You write the screens as components, and you choose and connect the rest yourself: state stores, forms, routing, persistence, and any tools you give an AI agent.

Strvct is a model-first framework. You write the domain model as classes with annotated properties (**slots**). The framework builds the rest from that model: the screens, navigation, local storage, cloud sync, JSON import and export, and an interface agents can use to read and edit the data.

In a typical React stack, adding one field to a record touches about five places: a database migration, an ORM model, an API schema, a state store, and a form component. In Strvct, you add one slot declaration.

---

## One Record, Both Ways

### React

```jsx
// ContactForm.jsx
function ContactForm({ contactId, onSave }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        api.getContact(contactId).then(data => {
            setName(data.name);
            setEmail(data.email);
        });
    }, [contactId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.updateContact(contactId, { name, email });
        onSave();
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>Name: <input value={name} onChange={e => setName(e.target.value)} /></label>
            <label>Email: <input value={email} onChange={e => setEmail(e.target.value)} /></label>
            <button type="submit">Save</button>
        </form>
    );
}
```

This is just the form. The API endpoints, the database schema, the route that reaches this screen, and the list screen that links to it are all separate.

### Strvct

```javascript
// Contact.js
(class Contact extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);   // saved locally, synced to the cloud
            slot.setSyncsToView(true);       // the UI updates when it changes
            slot.setCanEditInspection(true); // shown as an editable field
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

This is the whole thing. A `Contacts` collection holding these objects gets a list, a detail view with editable fields, navigation between them, storage, and sync. There is no save button, because every edit is committed at the end of the event loop.

---

## Concept Map

| In React | In Strvct | The difference |
|---|---|---|
| Component (JSX) | A view derived from the node, or a custom view class | Views are created at runtime, as the user navigates, from the node and its slots. |
| `useState` | A slot, read with `name()` and set with `setName(v)` | State lives on model objects, not in components. |
| Context, Redux, Zustand | The object graph itself | There is one model. Views observe it, and nothing copies it into a store. |
| `useEffect` | A notification observation, or a `didUpdateSlot<Name>()` method | Declaring `didUpdateSlotEmail()` is the subscription. Observations are weak, so there is nothing to unsubscribe. |
| React Router | The navigation path through the object graph | A screen is a path of nodes, so there is no route table to maintain. |
| TanStack Query, REST, an ORM | Object pools in IndexedDB, synced to the cloud | Changed objects are marked dirty and committed in a batch. |
| TypeScript, PropTypes | Slot types, checked at runtime | The same type information validates setters, imported JSON, and agent patches. |
| Tool definitions for an LLM | A generic schema-and-patch interface | Agents read a class's schema and send JSON patches. Adding a class adds no tools. |

---

## How Screens Are Decided

In React you design each screen. In Strvct, a screen comes from a few decisions about the model, which you state as hints on the node class:

- **Beside or inside.** When you open a child, does it get its own column or tab beside its parent, or is it drawn inside the parent as a section of a document? The default is a column. `nodeChildrenLayout()` returning `"inline"` shows the next levels in place as a document, and `nodeSubnodesAreAnchoredTabs()` shows children as tabs that open side by side when there is room.
- **What shows.** A node can present a different node in its place with `nodePresentedNode()`. For example, a character can present a readable character sheet built from its data.
- **How items look.** Hints such as `nodeTileLayout()` and `nodeChildrenTileWidth()` name a role, like `"status"` or `"roster"`, and the theme decides what that role looks like.

The framework takes care of the mechanics: the navigation path, collapsing columns into a stack on a phone, turning side-by-side panes into tabs when space runs out, editing in place, and keyboard and screen-reader support. A layout change is usually a one-line hint, not a new screen.

---

## How State Flows

**React:** A state change re-renders the component subtree. React diffs the new virtual DOM against the old one and patches the real DOM. To persist the change, you add an effect, a mutation hook, or a sync layer.

**Strvct:** A view calls a setter on the model. The setter updates the slot, marks the object dirty for storage, and posts a notification. At the end of the event loop, the sync scheduler merges duplicate updates, and each observing view reads the new values from its node. Nothing is diffed, and persistence is part of the same step.

The model never refers to views. Because of this, the same model code runs under Node.js with no browser, so domain tests don't need jsdom or a headless browser.

---

## When the Generated UI Isn't Enough

Everyone asks this first: what happens when I need a kanban board, a canvas, or a layout that doesn't follow the object hierarchy?

The answer comes in steps, from least code to most:

1. **Use an existing hint.** Many "custom" layouts turn out to be an inline document, a set of anchored tabs, or a presented node.
2. **Add a new hint.** If a look is missing, add a hint that names the role and teach the generic view to read it. Every node can use it after that, and it follows the theme.
3. **Write a custom view.** For genuinely custom drawing, such as a canvas, a map, or a board, write a view class. Views are found by name: a `Contact` node uses a `ContactView` if one exists. You can also name the class with `nodeViewClassName()`. The view observes the node and calls its methods, and everything else in the app stays generated.

A custom view is simpler to write here than a React component, and simpler for a coding agent to write too. The data contract already exists: the node's slots, their types, and its notifications. The view doesn't fetch, cache, or store anything. It reads the node, draws, and calls methods on the node. Its scope is limited to the one node it replaces, and it can still hand that node's children back to the generated views.

The cost is real, though. A custom view is UI that is no longer derived from the model, so it doesn't follow theme changes automatically and you maintain it by hand. That is why it is the last step, not the first.

---

## Trade-offs

**What you give up with Strvct:**

- **The ecosystem.** Strvct doesn't use npm in the browser or React component libraries. Third-party code is vendored as source. You won't find a shadcn/ui or MUI equivalent.
- **Control over every screen.** You shape screens through the model and hints. If your product is mainly a sequence of designed screens, such as a landing page, a storefront, or a branded onboarding flow, you will be working against the framework.
- **SEO.** There is no server-side rendering. The UI is built in the browser.
- **The style.** Strvct uses classes, mutable objects, and declared slots. If you are used to functional components and hooks, it will take some adjustment.

**What you get:**

- One model drives the UI, storage, sync, exchange, and agent access, so they can't drift apart.
- Local-first by default: the app works offline and syncs when it can.
- An AI interface that doesn't grow with the model. Agents read schemas and send patches, and a rejected patch can return the slot's schema so the agent can correct itself.
- Domain tests that run under plain Node.js.

**Strvct fits** structured-information apps: CRMs, project and issue trackers, editors for structured documents, settings panels, admin tools, game tools, and apps where people and AI agents work on the same data.

**React fits** apps where the screens are the product: marketing sites, storefronts, media-heavy pages, and anything that depends on SEO or on a specific component library.
