# <a href="../index.html">STRVCT</a> / FAQ

#### How does Strvct differ from React?

# Strvct vs React Comparison

| Feature           | Strvct                                                                     | React                                                                                  |
| ----------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Architecture**  | Uses "Naked Objects" pattern where model objects automatically generate UI | Uses components that explicitly define their UI with JSX                               |
| **UI Definition** | Developer never touches HTML directly. Uses view objects.                  | HTML-like JSX syntax to define component structure                                     |
| **Composition**   | Model structure directly determines the view hierarchy                     | Requires manual composition of components                                              |
| **Reactivity**    | Uses a slot system with notifications with automatic reactivity            | Uses immutable state with Virtual DOM diffing                                          |
| **Persistence**   | Has built-in persistence with IndexedDB                                    | Requires external libraries                                                            |
| **Rendering**     | Directly manipulates the DOM through NodeView objects                      | Abstracts DOM operations through reconciliation                                        |
| **Packaging**     | Built-in resource packaging and client-side caching                        | Requires external tools like Webpack/Vite for bundling and Service Workers for caching |

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
