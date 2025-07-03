# STRVCT Framework Lifecycle Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Application Boot Sequence](#application-boot-sequence)
3. [App Lifecycle (SvApp)](#app-lifecycle-svapp)
4. [Node Lifecycle (SvNode)](#node-lifecycle-svnode)
5. [View/UI Lifecycle](#viewui-lifecycle)
6. [Persistence Lifecycle](#persistence-lifecycle)
7. [Notification System](#notification-system)
8. [Common Patterns and Best Practices](#common-patterns-and-best-practices)

## Introduction

This guide provides a comprehensive overview of the STRVCT framework's lifecycle events, from initial boot through application initialization, node creation and management, UI synchronization, and persistence. Understanding these lifecycles is essential for building robust STRVCT applications.

## Application Boot Sequence

### 1. Initial Bootstrap
- Browser loads the boot loader script
- Core boot files loaded in parallel, evaluated sequentially
- Boot files include: Object extensions, Promise extensions, IndexedDB support, HashCache, ResourceManager

### 2. Resource Loading Phase
- `ResourceManager.shared().setupAndRun()` initiated
- Loads `_index.json` containing resource metadata
- Checks HashCache for cached resources
- Downloads `_cam.json.zip` if cache miss
- Evaluates resources in dependency order

### 3. App Creation
- `SvApp.loadAndRunShared()` creates app singleton
- Opens persistent store (IndexedDB)
- Loads or creates root object
- Initializes UI framework

## App Lifecycle (SvApp)

### Initialization Flow

```
SvApp.loadAndRunShared()
  ├── setStore(defaultStore())
  ├── loadFromStore()
  │   ├── store.promiseOpen()
  │   └── store.rootOrIfAbsentFromClosure()
  └── run()
      └── setup()
          ├── pauseSchedulers()
          ├── setupModel()
          ├── setupUi()
          ├── appDidInit()
          │   ├── setHasDoneAppInit(true)
          │   ├── postNoteNamed("appDidInit")
          │   ├── unhideRootView()
          │   └── afterAppUiDidInit()
          │       ├── handleSearchParams()
          │       └── didInitPromise.resolve()
          └── resumeSchedulers()
```

### Key App Methods

- **`setupModel()`** - Override to initialize data model (store already open)
- **`setupUi()`** - Override to customize UI setup (store already open)
- **`appDidInit()`** - Called when app fully initialized
- **`afterAppUiDidInit()`** - Override to handle URL params and final initialization
- **`handleSearchParams(searchParams)`** - Override to process URL parameters
- **`rootSubnodeWithTitleForProto(title, proto)`** - Add top-level objects

### Waiting for App Initialization

- **`didInitPromise`** - Promise that resolves when app is fully initialized
  ```javascript
  await SvApp.shared().didInitPromise();
  // App is now fully initialized
  ```

### App Notifications

- **`"appDidInit"`** - Posted when app initialization complete
- **`"onAppDeveloperModeChangedNote"`** - Developer mode toggled

## Node Lifecycle (SvNode)

### Class Hierarchy
```
Object → ProtoClass → SvNode → ViewableNode → StyledNode → SvStorableNode
```

### Initialization Sequence

1. **Object Creation**
   - `new ClassName()` or `ProtoClass.clone()`
   - Allocates memory and sets up prototype chain

2. **`init()`** - Basic Initialization
   - Calls `super.init()`
   - Initializes slots via `initializeSlots()`
   - Sets up notification observers
   - Configures mutation watching

3. **`finalInit()`** - Complex Initialization
   - Calls `super.finalInit()`
   - Creates objects for slots with `setFinalInitProto()`
   - Establishes object relationships
   - Good place to detect new vs loaded objects

4. **`afterInit()` → `didInit()`** - Post-Initialization
   - Sets `_hasDoneInit = true`
   - Triggers initial notifications
   - Can be scheduled for end of event loop

### Parent-Child Relationships

**Adding Subnodes:**
- `addSubnode(node)` - Add to end
- `addSubnodeAt(node, index)` - Add at specific position
- Automatically sets `parentNode`
- Triggers `didChangeSubnodeList()`

**Removing Subnodes:**
- `removeSubnode(node)` - Remove specific node
- Clears `parentNode` reference
- Triggers `didChangeSubnodeList()`

### Update Notifications

**Slot Updates:**
```
setSlotValue(newValue)
  └── didUpdateSlot(slot, oldValue, newValue)
      ├── didUpdateSlot[SlotName](oldValue, newValue)
      └── didMutate() [for storable nodes]
```

**Node Updates:**
- `didUpdateNode()` - Manual update trigger
- `didUpdateNodeIfInitialized()` - Safe update check
- `didChangeSubnodeList()` - Subnode array changed

### State Tracking

- `hasDoneInit()` - Initialization complete?
- `hasSubnodes()` - Has child nodes?
- `isKindOf(aClass)` - Type checking

## View/UI Lifecycle

### View Discovery and Creation

1. **View Class Resolution**
   - Node calls `nodeViewClass()`
   - Searches for `NodeClassNameView` or `NodeClassNameTile`
   - Falls back up inheritance chain

2. **View Instantiation**
   ```
   NodeView.newSubviewForSubnode(node)
     ├── Determine view class
     ├── Create instance via clone()
     └── Associate via setNode()
   ```

### View-Node Synchronization

**Node → View Updates:**
1. Node property with `setSyncsToView(true)` changes
2. Node calls `scheduleSyncToView()`
3. View observes notification
4. `syncFromNode()` scheduled via SyncScheduler
5. View updates DOM and subviews

**View → Node Updates:**
1. User interaction in view
2. View calls node action method
3. Node updates internal state
4. Triggers Node → View sync

### View Lifecycle Events

- `willAddSubview(subview)` - Before adding child
- `willRemoveSubview(subview)` - Before removing child
- `willRemove()` - Before removal from parent
- `onVisibility()` - Element becomes visible
- `didChangeNode()` - Node reference changed

### Performance Features

- **Batched Updates** - SyncScheduler coalesces updates
- **Loop Detection** - Prevents infinite sync cycles
- **Lazy Creation** - Views created only when needed
- **Visibility Tracking** - IntersectionObserver integration

## Persistence Lifecycle

### Storing Objects

1. **Marking Dirty**
   - `didMutate()` called on property change
   - Object added to store's dirty set
   - Auto-commits at end of event loop

2. **Serialization**
   ```
   recordForStore(store)
     ├── Serialize slots marked with setShouldStoreSlot(true)
     ├── Convert object references to puuids
     └── Return JSON-compatible record
   ```

### Loading Objects

1. **Instance Creation**
   ```
   instanceFromRecordInStore(record, store)
     ├── Create blank instance
     ├── Call init()
     └── Return for population
   ```

2. **Data Population**
   ```
   loadFromRecord(record, store)
     ├── Restore slot values
     ├── Resolve object references
     └── Skip slots with setFinalInitProto()
   ```

3. **Relationship Restoration**
   - `finalInit()` re-establishes relationships
   - Reference resolution via puuids
   - Parent-child links restored

### Store Events

- `didLoadFromStore(store)` - After all objects loaded
- `willStore()` - Before serialization (optional)

## Notification System

### Key Notifications

**App Level:**
- `"appDidInit"` - Application ready
- `"onAppDeveloperModeChangedNote"` - Dev mode change

**Node Level:**
- `"didUpdateNode"` - Node data changed
- `"shouldFocusSubnode"` - Request UI focus
- `"didReorderParentSubnodes"` - Order changed

### Posting Notifications

```javascript
// Direct notification
this.postNoteNamed("myNotification");

// With info
SvNotificationCenter.shared().post(this, "myNotification", { data: value });
```

### Observing Notifications

```javascript
// One-time observation
this.watchOnceForNote("appDidInit").then(() => {
    // App is ready
});

// Persistent observation
const obs = SvNotificationCenter.shared().newObservation()
    .setName("didUpdateNode")
    .setTarget(targetNode)
    .setObserver(this)
    .setAction("handleUpdate");
```

## Common Patterns and Best Practices

### 1. Lazy Initialization

```javascript
prepareForFirstAccess() {
    if (!this._didPrepareForFirstAccess) {
        super.prepareForFirstAccess();
        // Expensive initialization here
        this._didPrepareForFirstAccess = true;
    }
}
```

### 2. Conditional Updates

```javascript
didUpdateSlotFoo(oldValue, newValue) {
    if (this.hasDoneInit()) {
        this.didUpdateNode();
    }
}
```

### 3. App Readiness Check

```javascript
// Synchronous check
if (SvApp.hasShared() && SvApp.shared().hasDoneAppInit()) {
    // Safe to interact with app
}

// Async wait for initialization
await SvApp.shared().didInitPromise();
// App is now ready
```

### 4. Clean Node Removal

```javascript
shutdown() {
    this.stopWatchingNode();
    this.subnodes().forEach(node => node.shutdown());
    this.removeFromParent();
}
```

### 5. Efficient View Updates

```javascript
// Batch multiple updates
this.scheduleSyncToView();
this.otherProperty().scheduleSyncToView();
// Both handled in single update cycle
```

### 6. Persistence-Aware Initialization

```javascript
finalInit() {
    super.finalInit();
    // Only randomize new objects
    if (!this.hasStoredData()) {
        this.randomizeValues();
    }
}
```