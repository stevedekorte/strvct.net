# Strvct

Strvct is a client-side JavaScript framework for creating single page web applications using a [naked objects](https://en.wikipedia.org/wiki/Naked_objects) system in which only the domain model objects need to be defined and the user interfaces and storage are handled automatically.

**NOTE:** This project is currently under active development, has very limited documentation, and is not yet ready for production use.

### Guides

[Project Overview](./docs/ProjectOverview.md)<br>
[Getting Started Guide](./docs/GettingStartedGuide.md)<br>

<!--
[Developer Documentation](./docs/Developer.md)<br>
[Case Study](./docs/CaseStudy.md)<br>
-->

### Reference

[Modules](./docs/reference/module_hierarchy.md)<br>
[Classes](./docs/reference/class_hierarchy.md)<br>
[Protocols](./docs/reference/protocols.md)<br>
[Source Code](https://github.com/stevedekorte/Strvct.net/)

### FAQ

#### How does Strvct differ from React?

1. Strvct uses a "Naked Objects" pattern where model objects automatically generate UI, while React uses components that explicitly define their UI with JSX.
2. In Strvct, the model hierarchy directly determines the view hierarchy. React requires manual composition of components.
3. Strvct uses a slot system with notifications for reactivity, while React uses immutable state with Virtual DOM diffing.
4. Strvct has built-in persistence with IndexedDB, while React requires external libraries.
5. Strvct directly manipulates the DOM through NodeView objects, while React abstracts DOM operations through reconciliation.

#### What does Strvct do for you that you'd need to implement yourself in React?

1. **Automatic UI Generation**: Strvct creates complete UI components from your model objects with no additional code.

   ```javascript
   // Just define a model with properties:
   {
     const slot = this.newSlot("modelName", null);
     slot.setLabel("name");
     slot.setIsSubnodeField(true);
   }
   // The UI is automatically generated with appropriate fields and labels
   ```

2. **Bidirectional Data Binding**: Properties marked with `setSyncsToView(true)` trigger automatic UI updates when changed.

   ```javascript
   didUpdateSlot(aSlot, oldValue, newValue) {
     if (aSlot.syncsToView()) {
       this.scheduleSyncToView(aSlot.name());
     }
   }
   ```

3. **Built-in Persistence**: Simple property flagging for automatic IndexedDB storage.

   ```javascript
   // Mark a class for storage:
   this.setShouldStore(true)
   // Mark a property to be stored:
   slot.setShouldStoreSlot(true)
   // Changes automatically commit at end of event loop
   ```

4. **Hierarchical View Management**: Parent-child relationships in models automatically create matching view hierarchies.

5. **Centralized Notification System**: Built-in observer pattern for cross-component communication without prop drilling.

In React, you'd need separate libraries and manual code for each of these features (Redux/MobX, React Router, form libraries, persistence adapters, etc.).
