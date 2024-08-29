<head>
  <title>Strvct</title>
</head>

<div style="color: yellow; margin-bottom: 5em; width:100%; text-align: center; border: 1px solid yellow; padding: 1em; border-radius: 1em;">incomplete draft</div>

# Strvct

## Abstract

By exposing domain objects directly to users and automatically generating user interfaces and handling storage, naked objects [1] aimed to simplify and accelerate software development. Despite these advantages, usability limitations have restricted the adoption of naked objects to internal tools and prototypes.

While functionally complete, these systems often lack the interface patterns and visual appeal expected in end-user applications. This paper describes a new approach to help address these limitations and introduces an open-source JavaScript client-side framework called [Strvct](https://github.com/stevedekorte/strvct.net) that implements it.

## Overview

<!--

Strvct is a client-side JavaScript framework for creating single page web applications using a transparently persisted Naked Objects system in which only the domain model objects need to be defined and the user interfaces and storage are handled automatically.

<diagram>
<object type="image/svg+xml" data="docs/mvs.svg">[SVG diagram]</object>
</diagram>
-->

## Domain Model

In our system, the domain model is a cyclic graph of domain objects.
Each domain object has:

- properties (instance variables) and actions (methods)
- a **subnodes** property containing an ordered unique collection of child domain objects
- a **parentNode** property pointing to its parent domain object
- property annotations which allow for the automatic handling of UI and storage mechanisms.
- **title** and **subtitle** properties

### Doman Object Collections

Domain objects may reference collections of other domain objects. These collections are often managed by their own domain object. For example, a Server class might have a guestConnections property which references an instance of ServerConnections whose subnodes are of type GuestConnection. Such domain objects are aware of their valid types and can override default behaviours for adding, removing, and reordering items.

<!--
Explain what the domain model is and how it's objects are mapped to UI and storage.

- domain model is a cyclic graph of objects
- domain objects should be "behaviourally complete", not needed controllers to perform relevant actions.
- domain objects are mapped to UI views and storage records
- UI navigates the domain object graph
- UI can present multiple views of a domain object in the same screen
- use of Domain collection classes to represent collections of domain objects
- UI, a stack of tiles, where each tile is a node that can be navigated
- assumptions of storage, a graph of objects, stored in local storage
- mention using annotations for auto-generated UI and storage

[overview diagram of domain objects graph, UI, and storage]
-->

## User Interface

### Tiles

The core navigational elements, referred to as **Tiles**, are used to represent either:

- a domain object (via a Summary Tile)
- a property of a domain object (via a Property Tile)

#### Summary Tiles

Summary Tiles are used to represent domain objects and are used to navigate the domain model. They typically display:

- title
- subtitle (which many be a dynamic summary of descendants)
- optional left and right sidebars (for additional text or icons)

<diagram>
Summary Tile
<object type="image/svg+xml" data="docs/summary-tile.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
</diagram>

#### Property Tiles

Property tiles present a property of a domain object and typically display:

- property name
- inline value view (which may be editable)
- note
- error (e.g. validation or action error)

<diagram>
Property Tile
<object type="image/svg+xml" data="docs/property-tile.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
</diagram>

#### Dynamic Inspectors

Properties with complex structures, like sets of valid values or valid values organized in a tree structure may dynamically create a temporary model structure when accessed which can be navigated as if they were part of the model.

<!--
### Summary Customization

A notable feature of the Tiles is their ability to generate summaries that reflect deeper levels of the hierarchy. This is controlled by annotations on the Tiles' slots, which dictate whether or not sub-item summaries should be included. This provides a powerful way to condense information, giving users a quick overview of nested structures without requiring deep navigation.
-->

### Tiles Stack

Tiles are composed into scrollable stack views. Stack views support:

- flexible orientation (top-to-bottom or left-to-right)
- gestures for:
  - adding (tap-empty-area, pinch-apart tiles<!--, pull-down-from-top, pull-up-from-bottom-->)
  - removing (swipe-left)
  - reordering (tap-hold to drag-and-drop)
  - developer inspection (option-tap)

Note: the UI framework supports it's own gesture handling which unifies mouse and touch events.

<diagram>
Tiles Stack
<object type="image/svg+xml" data="docs/tiles.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
</diagram>

### Master-Detail Views

The user interface is composed of nested master-detail views, each of which presents a domain object. Each master view presents the subnodes of the domain object as a scrollable set of tile views. The detail view presents the domain object for the selected tile. Master views support optional header and footer views which can be used to flexibly implement features like search, message input, or group actions.

<diagram>
Master-Detail View
<object type="image/svg+xml" data="docs/master-detail.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
</diagram>

#### Flexible Orientation

Detail View can be oriented to be be right-of, or below the Master View (which contains theTiles Stack). Both can be requested by the related domain object or overridden by the user interface, offering adaptability based on the content, display size, and user preference.

<diagram style="  position: relative;
  width: 100%;
  padding-bottom: 47.57%;">
<object type="image/svg+xml" data="docs/orientations.svg" style="  display: inline-block;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;">[SVG diagram]</object>
</diagram>

#### Auto Collapsing and Expanding

Master-Detail views have the default behaviour of automatically collapsing and expandas needed during navigation in order to best fit on screen. For example, on very small screens, such as watches, it might collapse to only show the last Tile Stack, while larger screens as many of the right most Tile Stacks as possible.

### Nesting

<!--
can be used to navigate the domain model.
-->

By nesting these master-detail views with a combination of orientations, a flexible navigation structure is formed which maps well to many common application design patterns. This flexibility can be used to automatically adapt the layout based on the content, display size, and user preference.

<diagram>
  <div style="display: inline-block; height: fit-content; width: 30%; max-width: 100%;">
  Vertical<br>
  <object type="image/svg+xml" data="docs/vertical-hierarchical-miller-columns.svg">[SVG diagram]</object>
  </div>
  <div style="display: inline-block; height: fit-content; width: 30%; max-width: 100%;">
  Horizontal<br>
  <object type="image/svg+xml" data="docs/horizontal-hierarchical-miller-columns.svg">[SVG diagram]</object>
  </div>
  <div style="display: inline-block; height: fit-content; width: 30%; max-width: 100%;">
  Hybrid<br>
  <object type="image/svg+xml" data="docs/hybrid-hierarchical-miller-columns.svg">[SVG diagram]</object>
  </div>
</diagram>

### Navigation

- selected navigation path is highlighted based on themes
- active tile can be highlghted differently than selected path tiles

### Adding and Deleting

...

### Moving and Reordering via Drag-and-Drop

...

###

## Advantages of a Unifified UI

As the entire UI is composed of these Tile Stack views, features implemented for the Master-Detail views are immeditately available for the entire UI, such as:

- consistent navigation, visual structure, interactions

Every tile stack can support:

- moving and reordering (via drag and drop)
- search

other:

- Orientation (horizontal/vertical)
- arbitrary depth navigation
- responsive design

<!--
<div style="width: 100%; text-align: center;">
<object style="height: 15em; width: auto;" type="image/svg+xml" data="docs/naked-objects-diagram.svg">[SVG diagram]</object>
</div>
-->

<!--

## Introduction

Applications are typically composed of 3 layers: UI, Model, and Storage. Much of the code (and potential bugs) that make up the custom code in complex real world applications is the "glue" code that synchronizes these layers.

The basic idea of Strvct is to put enough meta-information in the model layer to allow for the UI and Storage layers (and the synchronization between all 3 layers) to be handled automatically. So you write the model and the rest is handled for you (though you can add custom views if needed). This involves choosing uniform but flexible building blocks for each of the layers.

## Building Blocks

### Model

- The model is composed of a graph of objects which inherit from BMNode (we'll call these "nodes").
- The UI is largely a mirror of this graph structure.
- The nodes are the unit of storage (one record per node).
- nodes have no references to views, but views can have references to nodes.
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

## Getting Started

### For New Repos:

To set up the STRVCT submodule, run the following command from within your project folder:

```
git submodule add https://github.com/stevedekorte/strvct.net.git strvct
```

If you plan to deploy your app on GitHub Pages, add a `.nojekyll` file to your root folder.

### Setup

The build system is currently configured for Visual Studio Code (VSCode). To open the project, open the root source folder in VSCode.

1. Start the local HTTPS web server by running:

   ```
   node local-web-server/main.js
   ```

   in the root source folder.

2. Use the "launch local HTTPS" run option in VSCode to launch the app. It will open Chrome, and you'll need to ignore the SSL warning the first time (as we're using a local server).

### Recommended VSCode Extensions

To facilitate debugging and coding, install these VSCode extensions:

- ESLint (from Microsoft)
- JavaScript Debugger Nightly (from Microsoft)
- JSON (by ZainChen)

### Setting Up ESLint

If you don't have ESLint installed:

```
npm init @eslint/config -g
```

This installs it globally. For more information, visit: https://eslint.org/docs/latest/user-guide/getting-started

To use ESLint with ECMAScript 6 (ES6), add a `.eslintrc` configuration file to your home directory:

```json
{
  "env": {
    "es6": true
  }
}
```

If issues persist:

1. Verify this VSCode setting: `eslint.enable: true`
2. Run: `eslint init`

## Project Framework Overview

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

[1]: http://downloads.nakedobjects.net/resources/Pawson%20thesis.pdf "Pawson, R., & Matthews, R. (2000). Naked Objects (Technical Report)"
