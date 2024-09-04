<draft>DRAFT</draft>

<top>

# <a href="../index.html">STRVCT</a> / Project Overview

<!--
# <div style="font-size: 0.5em; text-transform: none;"> / Project Overview </div>
-->

[TOC]

</top>

## Abstract

By exposing domain (business) objects directly to users and automatically generating user interfaces and handling storage, naked objects [1] aimed to simplify and accelerate software development. Despite these advantages, usability limitations have restricted it's adoption to internal tools and prototypes.

While functionally complete, these systems often lack the interface patterns <!--and visual appeal--> expected in end-user applications. This paper describes (at a high level) a new approach to help address these limitations and introduces an open-source JavaScript client-side framework called **[Strvct](https://github.com/stevedekorte/strvct.net)** that implements it.

<!--
## Introduction

This paper is intended to be a high level overview of the approach taken by the Strvct framework. For technical details, please refer to the [Developer Documentation](Developer.html), [Getting Started Guide](GettingStartedGuide.html), and [source code](https://github.com/stevedekorte/strvct.net/).
-->

## Domain Model

In our system, the domain model is a cyclic graph of domain objects.
Each domain object has:

- **Properties** (instance variables) and **actions** (methods)
- a `subnodes` property containing an ordered unique collection of child domain objects
- a `parentNode` property pointing to its parent domain object
- property `annotations` [2] which allow for the automatic handling of UI and storage mechanisms
- `title` and `subtitle` properties
- a unique ID

<!--
The parentNode property expresses ownership of child nodes and is used for the chaining of certain notifications.
-->

### Collection Managers

When a property of a domain object references a collection of domain objects which have their own **domain logic** associated with them (i.e. for adding, deleting, reording, sorting, searching, and moving items, validation, etc.), they should, following object oriented principles, have a **Collection Manager** domain object which contains that logic and whose subnodes are the collection being managed.

For example, a Server class might have a guestConnections property which references an instance of GuestConnections (a decendant of DomainObject) and whose subnodes are instances of GuestConnection. The use of this pattern is essential to properly expressing domain models within this framework.

## User Interface

At a glance, Strvct uses stacks of **Tile** views to present domain objects and their properties, and nested master-detail views to organize and navigate and them. Note: the wire-frame diagrams below abstractly illustrate the layout concepts and not their actual visual appearance in the application.

### Tiles

The core navigational elements, referred to as **Tiles**. Tile subclasses can be used to customize the appearance of domain objects and properties and domain objects can request specific tiles to be used to represent them or their properties.

#### Domain Object Tiles

**Summary Tiles** are used to represent domain objects and to navigate the domain model. They typically display a title, subtitle, and optional left and right sidebars.

<diagram>
Summary Tile
<object type="image/svg+xml" data="diagrams/svg/summary-tile.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
</diagram>

#### Property Tiles

**Property Tiles** present a property of a domain object and typically display a name and value, and optionally a note, and/or error (i.e. validation error).

<diagram>
Property Tile
<object type="image/svg+xml" data="diagrams/svg/property-tile.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
</diagram>

#### Dynamic Inspectors

Properties with complex structures, such as Dates, Times, valid value pickers, may dynamically create a transient domain model objects when accessed which can be navigated and interacted with as if they were part of the model.

<!--
### Summary Customization

A notable feature of the Tiles is their ability to generate summaries that reflect deeper levels of the hierarchy. This is controlled by annotations on the Tiles' slots, which dictate whether or not sub-item summaries should be included. This provides a powerful way to condense information, giving users a quick overview of nested structures without requiring deep navigation.
-->

### Tile Stacks

A **Tile Stack** is a scrollable stacks of **Tiles** which are used to present the subnodes of a domain object. They support flexible orientation, and gestures for adding, removing, and reordering tiles. Optional support for grid or outline layouts could be added, but are not currently supported.

<diagram>
Tile Stack
<object type="image/svg+xml" data="diagrams/svg/tiles.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
</diagram>

### Master-Detail Views

A **Master-Detail View** is used to present a domain object. Its master section contains a **Tile Stack** presenting the subnodes of the domain object and its detail section presents the domain object for the selected subnode tile, which itself may be a master-detail view. The master section supports optional header and footer views which can be used to flexibly implement features like search, message input, or group actions. The divider between the master and detail sections can also be dragged to resize the sections if the domain object allows it.

<diagram>
Master-Detail View
<object type="image/svg+xml" data="diagrams/svg/master-detail.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
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
Master-Detail Orientations
<object type="image/svg+xml" data="diagrams/svg/orientations.svg" style="  display: inline-block;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  top: 0;
  left: 0;">[SVG diagram]</object>
</diagram>

#### Nesting

Nesting of master-detail views with flexible orientations allows for navigation structures which fit many common application design patterns.

<diagram>
  <div style="display: inline-block; height: fit-content; width: 30%; max-width: 100%;">
  Vertical<br>
  <object type="image/svg+xml" data="diagrams/svg/vertical-hierarchical-miller-columns.svg">[SVG diagram]</object>
  </div>
  <div style="display: inline-block; height: fit-content; width: 30%; max-width: 100%;">
  Horizontal<br>
  <object type="image/svg+xml" data="diagrams/svg/horizontal-hierarchical-miller-columns.svg">[SVG diagram]</object>
  </div>
  <div style="display: inline-block; height: fit-content; width: 30%; max-width: 100%;">
  Hybrid<br>
  <object type="image/svg+xml" data="diagrams/svg/hybrid-hierarchical-miller-columns.svg">[SVG diagram]</object>
  </div>
</diagram>

#### Auto Collapsing and Expanding

Chains of Master-Detail views automatically collapse/expand their tile views until there is space for the remaining master-details views. This allows for responsive and efficient use of display space across a wide range of viewport sizes.

#### Navigation Path

The navigation system employs visual cues to guide users along the selected path. Tiles that form part of the chosen route are highlighted, making the path easy to follow. To further enhance navigation, the active/focused tile - which represents the most recently selected location - is distinguished with a unique highlight. This differentiation allows users to quickly identify their current position within the overall navigation sequence. These highlights and other visual attributes are customizable via themes.

### Synchronization

Views often have references to domain objects they are presenting but domain objects never have references to views. Instead they post notifications to communicate with listeners, such as views. Views automatically observe the domain objects they present.

#### Model to UI

Mutations on domain object properties annotated to be synchronized will automatically post change notifications when mutated. These notifications are coalesced and sent at the end of the event loop. Views in the UI may listen for these and update themselves accordingly.

#### UI to Model

Properties of views can be annotated to be synchronized. On mutations, they will queue the view to sync to the domain object at the end of the event loop.

#### Notification System

The notification system has mechanisms to monitor for potential infinite synchronization loops in order to halt them and present the developer with a report to identify their source. Observation objects use weak references for both the sender and observer in order to prevent them from preventing garbage collection. Observing objects automatically register their observations as needed, and unregister when they shut down.

## Storage

### Annotations

Domain objects have a property which determines whether the object persisted, as well as property annotations which determine which properties are persisted. Using this information, the system automatically manages persistence. <!-- Each domain object is stored as an individual JSON record. Storage is done of the client side using IndexedDB.-->

<!--
### Native Collections

Native JavaScript collections (of Array, ArrayBuffer, Map, Object, Set, and TypedArray) referenced by domain object persistent properties are also automatically persisted in their own records.

### Local Storage

Persistent domain objects are stored client side in IndexedDB in a single Object Store of records whose keys are the domain object unique ID and values are the domain objects JSON records. The only index is on the unique ID.
-->

### Transactions

Mutations on persistent properties will automatically queue the affected domain object for storage. Objects in this queue are bundled into a transaction committed at the end of the same event loop in which the mutation occurs.

### Garbage Collection

Automatic garbage collection of the stored object graph occurs on startup, or when requested. Only objects reachable from the root domain object remain after garbage collection.

### Native Collections

Native JavaScript collections (Array, ArrayBuffer, Map, Object, Set, and TypedArray) referenced by persistent properties of domain objects are also automatically persisted in their own records.

[1]: http://downloads.nakedobjects.net/resources/Pawson%20thesis.pdf "Pawson, R., & Matthews, R. (2000). Naked Objects (Technical Report)"
[2]: https://bluishcoder.co.nz/self/transporter.pdf "David Ungar. (OOPSLA 1995). Annotating Objects for Transport to Other Worlds. In Proceedings of the Tenth Annual Conference on Object-Oriented Programming Systems, Languages, and Applications (OOPSLA '95). Austin, TX, USA. ACM Press."
