# Node Lifecycle

Creation, three-phase initialization, parent-child relationships, and update notifications.

## Class Hierarchy

```
Object → ProtoClass → SvNode → ViewableNode → StyledNode → SvStorableNode
```

## Three-Phase Initialization

Every node goes through the same sequence, whether freshly created or loaded from storage:

### 1. `init()` — Primitives and slots

- Calls `super.init()`
- Initializes slots via `initializeSlots()`
- Sets up notification observers
- Configures mutation watching

Only set primitive values and simple defaults here. Don't create child objects — they may be about to arrive from the store.

### 2. `finalInit()` — Complex objects and relationships

- Calls `super.finalInit()`
- Creates objects for slots with `setFinalInitProto()` — but only if the slot wasn't already populated from storage
- Establishes object relationships

This is where you detect whether the object is new or loaded:

```javascript
finalInit () {
    super.finalInit();
    if (!this.hasStoredData()) {
        this.randomizeValues();
    }
}
```

### 3. `afterInit()` → `didInit()` — Post-initialization

- Sets `_hasDoneInit = true`
- Triggers initial notifications
- Can be scheduled for end of event loop

By this point the full object graph is ready and it's safe to interact with other objects.

## Creating Instances

Always use `ProtoClass.clone()` rather than `new`. `clone()` runs the full three-phase sequence automatically.

## Parent-Child Relationships

**Adding subnodes:**
- `addSubnode(node)` — Add to end
- `addSubnodeAt(node, index)` — Add at specific position
- Automatically sets `parentNode`
- Triggers `didChangeSubnodeList()`

**Removing subnodes:**
- `removeSubnode(node)` — Remove specific node
- Clears `parentNode` reference
- Triggers `didChangeSubnodeList()`

## Update Notifications

When a slot value changes, the framework fires a notification chain:

```
setSlotValue(newValue)
  └── didUpdateSlot(slot, oldValue, newValue)
      ├── didUpdateSlot[SlotName](oldValue, newValue)
      └── didMutate() [for storable nodes]
```

Additional update methods:
- `didUpdateNode()` — Manual update trigger
- `didUpdateNodeIfInitialized()` — Only fires if `hasDoneInit()` is true, preventing spurious notifications during setup
- `didChangeSubnodeList()` — Fired when the subnodes array changes

## Conditional Updates

A common pattern is to guard update logic so it only runs after initialization is complete:

```javascript
didUpdateSlotFoo (oldValue, newValue) {
    if (this.hasDoneInit()) {
        this.didUpdateNode();
    }
}
```
