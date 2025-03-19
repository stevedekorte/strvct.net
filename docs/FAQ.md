# <a href="../index.html">STRVCT</a> / FAQ

#### How does Strvct differ from React?

# Strvct vs React Comparison

# Strvct vs React Comparison

<style>
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
  }
  h1 {
    color: #2c3e50;
    text-align: center;
    margin-bottom: 30px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
  }
  th {
    background-color: #3498db;
    color: white;
    text-align: left;
    padding: 12px 15px;
    font-weight: bold;
    vertical-align: top;
  }
  td {
    padding: 12px 15px;
    border-bottom: 1px solid #ddd;
    vertical-align: top;
    text-align: left;
  }
  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  tr:hover {
    background-color: #f1f1f1;
  }
  .feature-name {
    font-weight: bold;
    width: 15%;
  }
  .strvct {
    width: 42.5%;
  }
  .react {
    width: 42.5%;
  }
</style>

<h1>Strvct vs React Comparison</h1>

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
      <td class="feature-name">UI Architecture</td>
      <td class="strvct">UI dynamically auto generated from model objects</td>
      <td class="react">UI hand coded with JSX</td>
    </tr>
    <tr>
      <td class="feature-name">Custom UI Elements</td>
      <td class="strvct">Developer writes view objects.</td>
      <td class="react">Developer writes HTML-like JSX syntax.</td>
    </tr>
    <tr>
      <td class="feature-name">Composition</td>
      <td class="strvct">Model structure directly determines UI navigation and layout</td>
      <td class="react">Manual composition of navigation and layout</td>
    </tr>
    <tr>
      <td class="feature-name">Reactivity</td>
      <td class="strvct">Uses a slot system with notifications for reactivity</td>
      <td class="react">Uses immutable state with Virtual DOM diffing</td>
    </tr>
    <tr>
      <td class="feature-name">Persistence</td>
      <td class="strvct">Has built-in persistence with IndexedDB</td>
      <td class="react">Requires external libraries</td>
    </tr>
    <tr>
      <td class="feature-name">Rendering</td>
      <td class="strvct">Directly manipulates the DOM through NodeView objects</td>
      <td class="react">Abstracts DOM operations through reconciliation</td>
    </tr>
    <tr>
      <td class="feature-name">Packaging</td>
      <td class="strvct">Built-in resource packaging and client-side caching</td>
      <td class="react">Requires external tools like Webpack/Vite for bundling and Service Workers for caching</td>
    </tr>
  </tbody>
</table>

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
