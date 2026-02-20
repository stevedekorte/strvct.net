# FAQ

#### How does Strvct differ from React?

<table>
  <thead>
    <tr>
      <th>Feature</th>
      <th>Strvct</th>
      <th>React</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="feature-name" style="width:fit-content;">Navigation & Layout</td>
      <td class="strvct">Runtime generated from model w/hints</td>
      <td class="react">Hand coded JSX</td>
    </tr>
    <tr>
      <td class="feature-name">Custom Elements</td>
      <td class="strvct">Write View objects in JS</td>
      <td class="react">Write HTML-like JSX syntax</td>
    </tr>
    <tr>
      <td class="feature-name">Reactivity</td>
      <td class="strvct">Slots auto sync model and view</td>
      <td class="react">Immutable state with Virtual DOM diffing</td>
    </tr>
    <tr>
      <td class="feature-name">Rendering</td>
      <td class="strvct">NodeViews abstract DOM ops</td>
      <td class="react">Abstracts DOM ops via reconciliation</td>
    </tr>
    <tr>
      <td class="feature-name">Persistence</td>
      <td class="strvct">Built-in<br> via annotations</td>
      <td class="react">Requires external libraries</td>
    </tr>
    <tr>
      <td class="feature-name">Packaging</td>
      <td class="strvct">Built-in</td>
      <td class="react">Requires external tools</td>
    </tr>
    <tr>
      <td class="feature-name">Resource Caching</td>
      <td class="strvct">Built-in</td>
      <td class="react">Requires Service Workers</td>
    </tr>
  </tbody>
</table>


<!--
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

-->
