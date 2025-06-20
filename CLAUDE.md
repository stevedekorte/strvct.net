# STRVCT Framework Guide

## Framework Overview

- Naked objects pattern implementation for JavaScript
- Node-based object hierarchy with automatic UI generation
- Reactive properties via slot system
- Notification-based synchronization between components

## Core Features

### Class Definition

- Classes are defined using ES6 class syntax inside an IIFE:
  ```javascript
  (class ClassName extends ParentClass {
      // Class definition
  }.initThisClass());
  ```
- Core class methods:
  - `initPrototypeSlots()`: Defines instance properties using slots
  - `initPrototype()`: Sets up general class behavior
  - `init()`: Basic instance initialization
  - `finalInit()`: Complex initialization and object relationships
- Static methods defined with `static` keyword
- Singleton pattern with `static shared()` method
- Class registration via `.initThisClass()` call

### Class Definition Format

- Always use the self-initializing class pattern:

  ```javascript
  (class MyClass extends ParentClass {
    // Class methods and properties
  }.initThisClass());
  ```

- Always include `static jsonSchemaDescription()` for model classes
- Implement required initialization methods in this order:

  1. `initPrototypeSlots()` - Define all instance properties
  2. `initPrototype()` - Configure class-wide settings
  3. `init()` - Basic initialization
  4. `finalInit()` - Post-initialization setup

- Return `this` from all initialization methods to support method chaining
- Remember to call parent methods with `super.methodName()`

### Category System

STRVCT supports a category system that allows extending existing classes with additional functionality without modifying the original class files. This promotes clean separation of concerns and modular code organization.

#### Creating Category Classes

Categories are implemented as classes that extend the target class and use `.initThisCategory()` instead of `.initThisClass()`:

```javascript
// Base class
(class MyClass extends ParentClass {
    initPrototypeSlots() {
        // Core functionality slots
    }
    
    coreMethod() {
        // Core functionality
    }
}.initThisClass());

// Category class extending MyClass
(class MyClass_patches extends MyClass {
    // Additional functionality
    patchMethod() {
        // Patch-related functionality
    }
}.initThisCategory());
```

#### Loading Order Requirements

**CRITICAL**: Base classes must be loaded before their categories. In `_imports.json` files:

```json
[
    "MyClass.js",           // Base class first
    "MyClass_patches.js",   // Category second
    "MyClass_utilities.js"  // Additional categories after
]
```

#### Category Naming Convention

- Use underscore to separate the base class name from the category name
- Examples: `JsonGroup_patches.js`, `SvJsonArrayNode_patches.js`, `JsonGroup_clientState.js`
- Category names should describe the functionality they add

#### Benefits of Categories

1. **Separation of Concerns**: Keep different types of functionality in separate files
2. **Maintainability**: Easier to locate and modify specific functionality
3. **Clean Base Classes**: Core classes remain focused on essential functionality
4. **Modularity**: Categories can be added or removed independently
5. **Framework Organization**: Distinguish between core framework and extended functionality

#### Example Usage

```javascript
// JsonGroup.js - Core JSON functionality
(class JsonGroup extends SvJsonCachedNode {
    asJson() { /* core JSON methods */ }
}.initThisClass());

// JsonGroup_patches.js - JSON Patch functionality
(class JsonGroup_patches extends JsonGroup {
    applyJsonPatches(patches) { /* patch methods */ }
}.initThisCategory());

// JsonGroup_clientState.js - Tool call functionality  
(class JsonGroup_clientState extends JsonGroup {
    patchClientState(toolCall) { /* tool methods */ }
}.initThisCategory());
```

### Slot System

- Properties declared with `this.newSlot("propertyName", defaultValue)`
- Configure slots with additional methods:
  - `setSlotType("String")` - Document expected type. This is used for type checking.
  - `setFinalInitProto(SomeClass)` - Auto-initialize property during object initialization
  - `setSyncsToView(true)` - Updates views when property changes
  - `setShouldStoreSlot(true)` - Persist property to storage
- Class properties with `this.newClassSlot()`

### Subnodes vs. Subnode Fields

The framework provides two different ways to handle child objects:

1. **Stored Subnodes** (`setIsSubnode(true)`):
   - Creates a permanent parent-child relationship
   - The child object is added to the parent's subnodes array
   - Typically used with `shouldStoreSubnodes(true)` for collections
   - Best for arrays of similar objects (e.g., items in a list)
   - Common pattern: Classes extending `SvJsonArrayNode`

2. **Subnode Fields** (`setIsSubnodeField(true)`):
   - Creates temporary UI navigation tiles
   - The actual data remains in the parent's slot
   - Field objects are non-stored (`shouldStore(false)`)
   - Provides clickable navigation in the UI inspector
   - Best for structured objects with named properties
   - Common pattern: Classes extending `BMStorableNode` with `shouldStoreSubnodes(false)`

Example distinction:
```javascript
// For collections - use stored subnodes
class ItemList extends SvJsonArrayNode {
    initPrototype() {
        this.setShouldStoreSubnodes(true); // Stores actual items
    }
}

// For structured objects - use subnode fields
class ConfigObject extends BMStorableNode {
    initPrototypeSlots() {
        const slot = this.newSlot("settings", null);
        slot.setFinalInitProto(SettingsObject);
        slot.setIsSubnodeField(true); // Creates UI navigation
    }
    initPrototype() {
        this.setShouldStoreSubnodes(false); // Data in slots, not subnodes
    }
}
```

### Slot Definition Guidelines

- Declare instance properties in `initPrototypeSlots()` with `this.newSlot()`
- Always wrap each slot definition in block scope:

  ```javascript
  {
    const slot = this.newSlot("propertyName", defaultValue);
    slot.setSlotType("String"); // Document expected type
    // Additional slot configuration...
  }
  ```

- For subnode properties, use the convenience method:

  ```javascript
  {
    const slot = this.newSubnodeFieldSlot("propertyName", PropertyClass);
    // Additional slot configuration...
  }
  ```

- Configure slots with additional methods:
  - `setSlotType("String")` - Document expected type
  - `setFinalInitProto(SomeClass)` - Auto-initialize property during object initialization
    - Creates instance of specified class during object initialization phase
    - Initialization happens in the `finalInitSlots()` method, not on property access
    - Won't override loaded objects during deserialization
  - `setIsSubnode(true)` - Add property to subnodes array
  - `setShouldStoreSlot(true)` - Persist property to storage
  - `setSyncsToView(true)` - Updates view when property changes
  - `setIsSubnodeField(true)` - Show property in summary view
  - `setCanEditInspection(true)` - Allow property to be edited in inspector

### Protocol System

- Interface definitions via `Protocol` subclasses
- Runtime verification of interface compliance
- Method requirement declarations
- Protocol naming convention: `NameProtocol`

### Instance Initialization

- Three-phase initialization process:
  1. `init()`: Basic setup, primitive values, parent class initialization
  2. `finalInit()`: Complex initialization, object instances, relationships
  3. `afterInit()`: Post-initialization tasks
- `ProtoClass.clone()` handles the full sequence
- `finalInit()` is critical for persistence (called after deserialization)

## Instance Initialization Lifecycle

- Three-phase initialization process:
  1. `init()`: Basic setup, primitive values, parent class initialization
  2. `finalInit()`: Complex initialization, object instances, relationships
  3. `afterInit()`: Post-initialization tasks
- For creating new instances:
  - `ProtoClass.clone()` handles the full sequence automatically
  - Subclasses typically override `init()` for custom initialization logic
- For persistence:
  - After deserializing from storage, `finalInit()` is called explicitly
  - Handles reconstruction of object relationships and hierarchies
  - Uses `setFinalInitProto(SomeClass)` to create default instances when needed
  - Ensures partially loaded objects still have complete structure
  - Preserves parent-child relationships via `isSubnode` and `setOwnerNode`

### UI/View System

- NodeView connects model nodes to visual representation
- View hierarchy mirrors node hierarchy
- Views found by naming convention (NodeNameView)
- Bidirectional synchronization via notifications
- CSS variables defined by nodes and applied to views

## UI/View System

- Implements Naked Objects pattern - model objects generate UI automatically
- Core components:
  - `NodeView`: Connects model nodes to visual representation
  - `ViewableNode`: Base class for nodes that have a visual representation
  - `TileContainer`: Manages specific UI layouts for nodes
- Bidirectional communication:
  - Node → View: Changes in node data trigger view updates via notifications
  - View → Node: User interactions in views call action methods on nodes, which then update their own internal state
- View discovery and creation:
  - Views found by naming convention (e.g., `NodeNameView` for `NodeName`)
  - Nodes can specify custom view class via `nodeViewClass()`
  - View hierarchy mirrors node hierarchy automatically
- Properties control UI behavior:
  - `slot.setSyncsToView(true)` - Updates view when property changes
  - `slot.setIsSubnode(true)` - Adds property to visual hierarchy
  - `setNodeIsVertical(true/false)` - Controls subnode visual layout direction
- CSS variables can be defined by nodes and applied to views
- Scheduled synchronization batches updates for efficiency

### Notification System

- Central to framework's reactivity
- Components:
  - `BMNotification`: Event object with name, sender, and info
  - `BMNotificationCenter`: Global event dispatcher
  - `BMObservation`: Subscription to specific notifications
- Common notification patterns:
  - Property changes via `didUpdateSlot()`
  - Node hierarchy changes
  - View updates

## Notification System Details

- Central to framework's reactivity and component communication
- Key components:
  - `BMNotification`: Event object with name, sender, and info
  - `BMNotificationCenter`: Global event dispatcher
  - `BMObservation`: Subscription to specific notifications
- Common notification patterns:
  - Property changes: `this.didUpdateSlot(slot, oldValue, newValue)`
  - Node hierarchy changes: `this.didAddSubnode()`, `this.willRemoveSubnode()`
  - View updates: `this.postNeedsDisplay()`, `this.scheduleSyncToView()`
- Sending notifications:
  ```javascript
  BMNotificationCenter.shared().post(this, "myNotificationName", {extraInfo: value})
  ```
- Observing notifications:
  ```javascript
  const observation = BMNotificationCenter.shared().newObservation()
    .setObserver(this)
    .setName("myNotificationName")
    .setTarget(targetObject)
    .setAction("handleNotification")
  ```

### Persistence System

- Based on `PersistentObjectPool` and `BMStorableNode`
- IndexedDB with cache layer (`PersistentAtomicMap`)
- Object references via persistent unique IDs (puuids)
- Changes auto-commit at the end of event loop
- See full persistence system documentation in section below

## Persistence System

- Based on `PersistentObjectPool` and `BMStorableNode`
- Uses IndexedDB with a cache layer (`PersistentAtomicMap`)
- Key configuration steps:
  - Enable persistence with `this.setShouldStore(true)` on node classes
  - Mark slots for storage with `slot.setShouldStoreSlot(true)`
  - Object references handled via persistent unique IDs (puuids)
- Serialization and storage lifecycle:
  - `recordForStore(aStore)`: Creates a serialized record of an object for persistence
  - `loadFromRecord(aRecord, aStore)`: Populates an object from a stored record
  - `instanceFromRecordInStore(aRecord, aStore)`: Creates new instance from stored record
  - `addDirtyObject(anObject)`: Marks object as needing to be saved
  - `didMutate()`: Called when an object is modified (usually via `didUpdateSlot`)
  - `shouldStoreSlot(slotName)`: Controls which slots get persisted
  - `refValue(v)/unrefValue(v)`: Handles object references via persistent UUIDs
- Integration with initialization lifecycle:
  1. **Instance Creation**: `instanceFromRecordInStore` creates a blank instance
  2. **Basic Initialization**: `init()` is called to set up basic properties
  3. **Data Loading**: `loadFromRecord` populates the instance with stored data
  4. **Final Initialization**: `finalInit()` sets up complex relationships:
     - Properties with `setFinalInitProto()` only create instances if not loaded from storage
     - Subnode relationships reconstructed through reference resolution
     - Parent/child references re-established with `setOwnerNode()` as needed
  5. **Post-Initialization**: `afterInit()` called after all objects are loaded
- Performance features:
  - Changes auto-commit at the end of event loop
  - Dirty tracking to only persist modified objects
  - Object pooling for memory efficiency
  - Optimistic locking for concurrent modifications

### JSON Serialization for Data Exchange

- Separate from storage serialization, used for:
  - Data exchange between clients
  - Communication with AI services
  - Import/export functionality
  - Clipboard operations
- Core JSON methods:
  - `asJson()`: Converts object to a plain JavaScript object suitable for JSON
  - `setJson(json)`: Updates object from a JSON representation
  - `updateJson(json)`: Applies partial updates (can handle patch arrays)
  - `applyJsonPatches(patches)`: Applies JSON patch format changes
  - `mergeJson(json)`: Merges JSON data with existing object state
- Format considerations:
  - Created for human readability and editability
  - Typically omits system properties and metadata
  - May include type information for proper reconstruction
  - Can handle circular references with specific patterns
- Used with AI integration:
  - Character JSON sent to AI for updates
  - AI returns patches or complete objects
  - Changes applied through `updateJson()` or `applyJsonPatches()`
  - Handles collaborative editing between user and AI

## Resource Loading System

- CRITICAL: STRVCT does not use npm
  - Strvct does not use a conventional JS import/require system, so when writing/editing strvct files, do *not* convert them to use import/require. 
  - The npm-pkg is only used for allowing external build systems to easily include enough of strvct to "boot" the rest using strvct's own resource loading system.
  - The package.json & package-lock.json files are only used for building strvct's own npm package and should contain *no external npm dependencies*
  - All dependencies are contained as source in external-libs, are part of the repo, and are in a form which can be loaded and evaled in a browser.
- Two-file architecture for efficient loading:
  - `_index.json`: Metadata catalog with paths and content hashes
  - `_cam.json.zip`: Compressed content-addressable memory bundle
- Build process:
  1. `ImportsIndexer` scans `_imports.json` files for resource declarations
  2. Creates hash-indexed content bundle (`_cam.json`)
  3. Compresses bundle for network efficiency (`_cam.json.zip`)
  4. Generates separate resource index file (`_index.json`)
- Runtime behavior:
  1. `ResourceManager` loads the small index file first
  2. Checks client-side cache (via `HashCache`) using content hashes
  3. Downloads compressed bundle only if cache is empty
  4. CSS resources evaluated sequentially (order matters)
  5. JS resources evaluated in dependency order
- Enables incremental loading and efficient caching based on content hashes
- Resource declaration:
  - Resources and their dependencies declared in `_imports.json` files
  - Each module/directory can have its own `_imports.json` specifying needed resources
  - File format supports dependencies between resources (loading order requirements)
- Dependency resolution:
  - Resources loaded in proper order based on their dependencies
  - Circular dependencies detected and reported
  - CSS files evaluated in declaration order (cascading preserved)
  - JavaScript files evaluated according to dependencies
  - Single resource only loaded once even if required by multiple modules

## Documentation Style

- Code uses JSDoc-style comments with custom extensions
- Class documentation uses descriptive block comments:
  ```javascript
  /**
   * A class that represents a player character.
   * @class Character
   * @extends BMStorableNode
   * @category Characters
   */
  ```
- Method documentation includes purpose and parameters:
  ```javascript
  /**
   * Calculates the ability score modifier based on the ability score.
   * @param {Number} score - The ability score value
   * @returns {Number} The calculated modifier
   * @category Ability Scores
   */
  ```
- Use `@category` tag to group related methods
- Important implementation notes use `// NOTE: explanation` format
- Use `@private` for internal methods not meant to be called externally
- Use `@deprecated` for methods scheduled for removal

## Key Classes

### Base Classes

- `ProtoClass`: Base class with slot system
- `BMNode`: Base node class
- `ViewableNode`: Node with view capabilities
- `BMStorableNode`: Persistent node

### View System

- `DomView`: Base view class
- `NodeView`: Connects nodes to DOM
- `StyledDomView`: View with CSS styling

### Services

- `AiService`: Base class for AI service integration
- `BMNotificationCenter`: Event dispatcher
- `ResourceManager`: Handles resource loading
- `PersistentObjectPool`: Manages object persistence

## Development Workflow

1. Define model classes (nodes) with properties as slots
2. Configure views or use default view generation
3. Enable persistence where needed
4. Implement layered communication pattern:
   - Model → View: Notification system for property changes (push)
   - View → Model: Action methods on nodes triggered by user interactions (command)
   - Between models: Notification center for loose coupling (publish/subscribe)

## Debugging STRVCT Applications

### Dynamic Code Evaluation and Source Mapping
STRVCT uses a custom resource loading system that evaluates JavaScript and CSS at runtime. For debugging to work properly:

1. **SourceURL Comments**: All dynamically evaluated code must include sourceURL comments:
   ```javascript
   //# sourceURL=strvct/path/to/file.js
   ```

2. **Format Requirements**:
   - **No leading slash**: `strvct/path/to/file.js` (not `/strvct/path/to/file.js`)
   - **URL encoding required**: Use `encodeURI()` for paths with spaces or special characters
   - **No quotes**: Chrome DevTools fails if the path is quoted
   - **Relative to site directory**: Paths should be relative to the webRoot for VSCode mapping

3. **Implementation**: The boot system handles this in three locations:
   - `source/boot/Helpers.js` - `evalStringFromSourceUrl()` for general JS evaluation
   - `source/boot/UrlResource.js` - `evalDataAsJS()` and `evalDataAsCss()` for resources
   - `source/boot/BootLoader.js` - Boot file evaluation

### VSCode Debugging Configuration
The framework works with VSCode's Chrome debugger extension:

1. **Path Mapping**: Configure `.vscode/launch.json` with appropriate `pathMapping`:
   ```json
   "pathMapping": {
       "/": "${webRoot}/"
   },
   "webRoot": "${workspaceFolder}/Servers/GameServer/site"
   ```

2. **No Source Maps**: Do NOT enable `sourceMaps` - STRVCT uses sourceURL comments, not source maps

3. **Certificate Handling**: Modern Chrome no longer supports `--ignore-certificate-errors`
   - Trust certificates in system keychain, or
   - Click through security warnings, or  
   - Use HTTP for local development

This setup ensures eval'd code files are editable in the debugger regardless of where the project is located on disk.

## Key Patterns

- Node hierarchy for model representation
- Notification-based synchronization between layers
- Automatic UI generation from node structure
- NodeView connects nodes to their visual representation

## Coding Style

- Always use semicolons at the end of statements in JavaScript
- Follow the formatting examples in existing code
- Use consistent indentation (2 spaces) for all code blocks
- Use the Map class instead of dictionaries for maps
- When declaring a method, put a space between the method name and the ()
- All custom Strvct framework classes (not including categories of JS classes) should have the "Sv" prefix to indicate they are part of the STRVCT framework. External code in the external-libs folder is exempt from this naming convention.

# Important

- Strvct is an independent framework and you should avoid making any changes that include information about the applications using it (i.e. maintain separation of concerns).