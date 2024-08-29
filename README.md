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
        box-sizing: border-box;">early draft</div>

# Strvct

[TOC]

## Abstract

By exposing domain (business) objects indirectly to users and automatically generating user interfaces and handling storage, naked objects [1] aimed to simplify and accelerate software development. Despite these advantages, usability limitations have restricted the adoption of naked objects to internal tools and prototypes.

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

- **properties** (instance variables) and **actions** (methods)
- a **subnodes** property containing an ordered unique collection of child domain objects
- a **parentNode** property pointing to its parent domain object
- property **annotations** which allow for the automatic handling of UI and storage mechanisms.
- **title** and **subtitle** properties

### Doman Object Collections

Domain objects may reference collections of other domain objects. These collections are often managed by their own domain object. For example, a Server class might have a guestConnections property which references an instance of ServerConnections whose subnodes are of type GuestConnection. Such domain objects are aware of their valid types and can override default behaviours for adding, removing, and reordering items.

## User Interface

At a glance, Strvct uses nested master detail views, where navigation nodes are domain objects and leaf nodes are domain object property values.

### Tiles

The core navigational elements, referred to as **Tiles**, are views used to represent either:

- a domain object (via a Summary Tile)
- a property of a domain object (via a Property Tile)

#### Summary Tiles

**Summary Tiles** are used to represent domain objects and to navigate the domain model. They typically display a title, subtitle, and optional left and right sidebars.

<diagram>
Summary Tile
<object type="image/svg+xml" data="docs/summary-tile.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
</diagram>

#### Property Tiles

**Property Tiles** present a property of a domain object and typically display a name, value, note, and error (i.e. validation error).

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

### Tile Stacks

A **Tile Stack** is a scrollable stacks of **Tiles** which are used to present the subnodes of a domain object. They support flexible orientation, and gestures for adding, removing, and reordering tiles. Optional support for grid or outline layouts could be added, but are not currently supported.

<diagram>
Tile Stack
<object type="image/svg+xml" data="docs/tiles.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
</diagram>

### Master-Detail Views

A **Master-Detail View** is used to present a domain object. Its master section contains a **Tile Stack** presenting the subnodes of the domain object and its detail section presents the domain object for the selected subnode tile (which itself may be a master-detail view).

The master section supports optional header and footer views which can be used to flexibly implement features like search, message input, or group actions.

<diagram>
Master-Detail View
<object type="image/svg+xml" data="docs/master-detail.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
</diagram>

#### Flexible Orientation

Detail Views can be oriented to be be right-of, or below the Master View (which contains theTiles Stack). Both can be requested by the related domain object or overridden by the user interface, offering adaptability based on the content, display size, and user preference.

<diagram style="position: relative;
  width: 100%;
  overflow: hidden; 
  border: 0px solid white;
  margin: 0em auto;
  box-sizing: border-box;
   ">
Orientations
<object type="image/svg+xml" data="docs/orientations.svg" style="  display: inline-block;
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

### UI Advantages

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

### Requirements

Domain object classes must declare:

- If their instances are persistent
- Which of their properties are persistent

### Persistence Mechanism

- Each persistent domain object and referenced JavaScript collection (Arrays, ArrayBuffers, Maps, Sets, Dictionaries) is:

  - Assigned a unique persistence ID
  - Stored as a single JSON record

- Mutations on persistent properties (or collections) auto queue the object for storage

- new or updated object records are committed in a single transaction at the end of the event loop

- Automatic garbage collection of the stored object graph occurs, on startup or when requested
- Only objects reachable from the root domain object are stored. That is, an object is not queued for storage unless it is set in a persistent property or as a member of a persistent collection.

<!--
- the database is a IndexedDB Object Store indexed by the Domain Object's unique ID
-->

In addition, garbage collection of persistent objects which become unreachable is performed automatically.

[1]: http://downloads.nakedobjects.net/resources/Pawson%20thesis.pdf "Pawson, R., & Matthews, R. (2000). Naked Objects (Technical Report)"
