<head>
  <title>Strvct Documentation</title>
</head>

<div style="color: yellow; margin-bottom: 5em; width:100%; text-align: center; border: 1px solid yellow; padding: 1em; border-radius: 1em;">incomplete draft</div>

# Strvct

## Introduction

Applications are typically composed of 3 layers: UI, Model, and Storage. Much of the code (and potential bugs) that make up the custom code in complex real world applications is the "glue" code that synchronizes these layers.

The basic idea of Strvct is to put enough meta-information in the model layer to allow for the UI and Storage layers (and the synchronization between all 3 layers) to be handled automatically. So you write the model and the rest is handled for you (though you can add custom views if needed). This involves choosing uniform but flexible building blocks for each of the layers.

## Building Blocks

### Model

- The model is composed of a graph of objects which inherit from BMNode (we'll call these "nodes").
- The UI is largely a mirror of this graph structure.
- The nodes are the unit of storage (one record per node).
- views can have refs to nodes, but nodes have no refs to views
- nodes post notifications of their changes which the other layers can observe.
  -- the storage layer automatically observes objects read from storage

### UI

- The UI is (primarily) composed of `NodeView` (and subclasses) instances.
- Each `NodeView` points to a `BMNode` and watches for notifications from it.
- Multiple `NodeViews` may (and often do) point to the same `BMNode` instance.
- Slots on Views can be marked such that changes to them will schedule the view to sync it's state with the node.

### Storage

The app has a `PersistentObjectPool` which automatically:

- Monitors model (`BMNode` instance) mutations and stores changes.
- Bundles changes within an event loop into transactions which are stored atomically.
- Handles automatic garbage collection on the stored object graph.

## Uniform UI Structure

### StackViews and Tile Views

Strvct has a unified UI model based on `StackViews`.

- A `StackView` contains a `navView` and `otherView` which can be oriented left/right or top/bottom.
- `navView` typically contains a column (or row, if orientation is horizontal) of Tile views.
- When the user clicks on a Tile in a `navView`, it typically causes a new stack view to be created and placed inside the `StackView's` `otherView` (and its `navView` to be populated with the subnodes of the node the Tile represented).

### Fields

Fields are a type of node that can sync to a slot value via their `target` and `valueMethod` slots.
Examples: `BMStringField`, `BMNumberField`, `BMImageWellField`

### Node Subnodes

- Every node has a `subnodes` slot which is an array of nodes.
- Each node has a `parent` slot which points to its parent node.
- There are two ways subnodes typically get used:

#### Fields

- Stored fields (not a slot value, just free-floating)
- Unstored fields (set up on init, and have `target` & `valueMethod` to auto-sync with owner slot)

#### Non-Fields

- Stored (not a slot value, just free-floating)
- Unstored (may be added on init value of slot if `slot.setIsSubnode(true)`)

## Uniform Persistence Structure

- The storage system is a key/value store where the keys are unique object IDs and the values are object records.
- Object records are JSON dicts containing a type and payload.
- On load, the record type is used to find a class reference, and then the class is asked to unserialize itself from the payload.
- The payload has a format that uses a standard way of referencing pointers to other object records, and during deserialization, the new instance can request the objects for these object IDs.
- Object records have a standard way of representing pointers to other objects (via their IDs), and using these, the store can do automatic on-disk garbage collection.

## Synchronization

BMNotificationCenter
SyncScheduler
