<head>
  <title>strvct paper</title>
</head>

<div style="color: yellow;
        margin: 1em auto;
        margin-bottom: 3em;
        width: 100%;
        max-width: 600px;
        text-align: center;
        border: 1px solid yellow;
        padding: 1em;
        border-radius: 1em;
        box-sizing: border-box;">incomplete draft</div>

# Strvct

[TOC]

## Abstract

By exposing domain objects directly to users and automatically generating user interfaces and handling storage, naked objects [1] aimed to simplify and accelerate software development. Despite these advantages, usability limitations have restricted the adoption of naked objects to internal tools and prototypes.

While functionally complete, these systems often lack the interface patterns and visual appeal expected in end-user applications. This paper describes a new approach to help address these limitations and introduces an open-source JavaScript client-side framework called [Strvct](https://github.com/stevedekorte/strvct.net) that implements it.

## Introduction

This paper is intended to be a high level overview of the Strvct framework. It is not intended to be a comprehensive technical reference. For more details, please refer to the [source code](https://github.com/stevedekorte/strvct.net/README_technical.md).

<!--
## Overview

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

At a glance, Strvct uses nested master detail views, where navigation nodes are domain objects and leaf nodes are domain object property values.

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

Tile Stacks views could also be implemented to grid or other layout patterns, but this is currently not supported.
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
  padding-bottom: 47.57%; overflow: visible;">
<object type="image/svg+xml" data="docs/orientations.svg" style="  display: inline-block;
  position: absolute;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  top: 0;
  left: 0;">[SVG diagram]</object>
</diagram>

#### Auto Collapsing and Expanding

Master-Detail views have the default behaviour of automatically collapsing and expandas needed during navigation in order to best fit on screen. For example, on very small screens, such as watches, it might collapse to only show the last Tile Stack, while larger screens as many of the right most Tile Stacks as possible.

### Nesting

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

- selected tiles on navigation path are highlighted
- active tile (most recently selected) tile is highlghted differently

### Composable UI Benefits

As the entire UI is composed of these Tile Stack views, features implemented for the Master-Detail views are immeditately available for the entire UI, such as:

- consistent:

  - navigation
  - visual structure
  - interactions
    - adding, removing, reordering
    - search

- every level has:
  - responsive design
  - arbitrary depth navigation
  - flexible layout

## Storage

All persistence is handled automatically in Strvct. To support this, domain objects must declare:

- if they are persistent
- which of their properties are persistent

How persistence works:

- each domain object has a unique persistence ID
- each domain object is stored as a single JSON record
- mutations on persistent properties cause the domain object to be queued for storage
- mutations are bundled into a transaction which is committed at the end of the event loop
- on-disk automatic garbage collection on the stored object graph is performed on startup or when requested
- Javascript collections (Arrays, Maps, ArrayBuffers) are stored as their own records and assigned unique persistence IDs
- only objects reachable from the root domain object are stored

<!--
- the database is a IndexedDB Object Store indexed by the Domain Object's unique ID
-->

In addition, garbage collection of persistent objects which become unreachable is performed automatically.

[1]: http://downloads.nakedobjects.net/resources/Pawson%20thesis.pdf "Pawson, R., & Matthews, R. (2000). Naked Objects (Technical Report)"
