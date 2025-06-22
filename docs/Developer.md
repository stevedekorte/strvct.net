<draft>DRAFT</draft>

# <a href="../index.html">Strvct</a> / Developer Docs

[TOC]

## Introduction

This document is intended to be read after reading the [Project Overview](ProjectOverview.md), which outlines the goals and structure of the Strvct framework. Here we'll go into the technical details of our specific implementation and how the various parts work together.

Much of the documentation for the classess and how they work together is in the form of inline comments in the source code, but this document attempts to give a high-level overview of how the various parts fit together and introduce the important classes and their key implementation details.

(add discussion of the additional frameworks that are included with Strvct, such as the AI framework, the gesture framework, the resource management framework, etc.)

<!--
Applications are typically composed of **UI**, **Model**, and **Storage** layers. Much of the code and potential bugs that make up the custom code in complex real world applications is the "glue" code that synchronizes these layers.

The basic idea of Strvct is to put enough meta-information in the model layer (through meta properties and the use of property annotations) to allow for the UI and Storage layers (and the synchronization between the layers) to be handled automatically. So you write the model and the rest is handled for you (though you can add custom views if needed). This involves choosing uniform but flexible building blocks for each of the layers.
-->

## Coding Conventions

Object (non-method) properties:

- always begin with an underscore. e.g. `_propertyName`
- should _almost never_ be accessed directly by internal object code (i.e. they are always accessed through accessor methods)
- are _never_ accessed directly by external objects (i.e. they are always accessed through accessor methods)
- getter and setter methods are named: `propertyName()` and `setPropertyName(value)`
- instance properties should be declared in initPrototypeSlots() with `this.newSlot()`
- class properties should be declared in initClass() with `this.newClassSlot()`

### Slots

### Categories

Categories are classes which server as a way to add methods to a class from an external files, or group related methods together into an external file.

Categories naming convention: Class + "\_" + category name. e.g. `SvNode_Subnodes`

### Protocols

Protocols are a way to define a set of methods that a class must implement. They are used to create a common interface for a set of classes, and to allow for runtime checks to ensure that a class implements the required methods. Protocols are declared by creating a subclass of `Protocol` and adding (empty, but documented) instance methods for each of the required methods.

Protocols naming convention: protocol name + `Protocol` e.g. `SvNodeProtocol`

## Build System

- Quick overview of how the build system works
- Motivation
  -- conventional imports are too slow
- Pros
  -- compression
  -- caching
  -- only loading changed files
  -- auto packaging of selected resources or resource types or sizes
  -- debbugging

## Resource Loading / Caching

## Key Model Classes

- `SvNode`
- `SvSummaryNode`

Fields:

- `SvStringField`
- `SvNumberField`
- `SvImageWellField`

Synchronization:

- `SyncScheduler`
- `SvNotificationCenter`
- `Broadcaster`

Storage:

- `SvPersistentObjectPool`

## Key View Classes

## Storage System

## Building Blocks

### Model

- The model is composed of a graph of objects which inherit from SvNode (we'll call these "nodes").
- The UI is largely a mirror of this graph structure.
- The nodes are the unit of storage (one record per node).
- views can have refs to nodes, but nodes have no refs to views
- nodes post notifications of their changes which the other layers can observe.
  -- the storage layer automatically observes objects read from storage

### UI

- The UI is (primarily) composed of `NodeView` (and subclasses) instances.
- Each `NodeView` points to a `SvNode` and watches for notifications from it.
- Multiple `NodeViews` may (and often do) point to the same `SvNode` instance.
- Slots on Views can be marked such that changes to them will schedule the view to sync it's state with the node.

### Storage

The app has a `PersistentObjectPool` which automatically:

- Monitors model (`SvNode` instance) mutations and stores changes.
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
Examples: `SvStringField`, `SvNumberField`, `SvImageWellField`

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

- SvNotificationCenter
- SyncScheduler
- Broadcaster

<!--
## Component Frameworks

This project required the development of several custom frameworks:

- Meta object framework (slots)
- Extensive OO extensions to common classes
- Desktop-like web OO UI framework
- Architecture and protocol for model-to-view naked object UI, standard field components
- Miller column-inspired stacking UI framework
- Notifications system
- Auto-syncing system/protocol between model and views
- Integrated theming system
- Client-side object persistence / object pool framework
- Gesture recognition framework
- Package builder & boot and client-side caching system
- Auto resource management, loading, and caching system
- Common protocol for resources (fonts, sounds, images, icons, JSON data files)
- Transparent mutation observers for common classes

-->
