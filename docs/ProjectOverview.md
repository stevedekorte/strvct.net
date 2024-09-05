<draft>DRAFT</draft>

<top>

# <a href="../index.html">STRVCT</a> / Project Overview

<!--
# <div style="font-size: 0.5em; text-transform: none;"> / Project Overview </div>
-->

[TOC]

</top>

## Abstract

Naked objects [1] aimed to simplify and accelerate software development by exposing domain (business) objects directly to users and automatically generating user interfaces and handling storage. Despite these advantages, usability limitations have restricted its adoption to internal tools and prototypes.

While functionally complete, these systems often lack the interface patterns expected in end-user applications. This paper describes a new approach to help address these limitations and introduces an open-source JavaScript client-side framework called [Strvct](https://github.com/stevedekorte/strvct.net) that implements it.

## Introduction

<div class="no-markdown">

<div class="epigraph">
<i>"Everything has its pattern," Freddy put in.<br>
"If you find it, the great can be contained within the small."</i><br>
- Clive Barker, <i>Weaveworld</i>

</div>
</div>

In a naked objects system, as user interface components are no longer bespoke to the application, the challenge is to find a small set of components which can efficiently express a large range of useful interface patterns. Strvct's perspective on this problem is that not only _possible_, but effectively _required_ for information-oriented user interfaces of complex domain models to follow user interface design guidelines such as:

- Consistency
- Accessibility
- Responsive layout
- Clear hierarchy and navigation
- User control and freedom

<!--
- Aesthetic and minimalist design

- Flexibility and efficiency of use
- Help users recognize, diagnose, and recover from errors
- Recognition rather than recall
- Visibility of system status
  -->

That is, each of these guidelines benefits from the use of a small set of of well chosen components. For example, a small set of components implies consistency, and this consistency supports clarity. User control and freedom is difficult to achieve when each action requires a separate implementation but is supported by default when the system is only composed of a few components with a common protocol e.g. reordering and drag-and-drop is supported everywhere one finds a list in Strvct. Accessibiliy is also easier when these few components support it e.g. all navigation supports keyboard control. Likewise, responsiveness is easier when the system is composed of nested visual components which can follow simple rules to automatically adapt to the viewport size.

These guidelines can be challenging to achieve when a system is saddled with a large number of disparate bespoke components commonly found in traditional systems, for a domain model of any complexity. Therefore, greatly reducing the number of visual components by finding a small set of well composable ones may be the only practical way to achieve these goals.

## Domain Model

In our system, the domain model is a cyclic graph of domain objects.
Each domain object has:

- **Properties** (instance variables) and **actions** (methods)
- a `subnodes` property containing an ordered unique collection of child domain objects
- a `parentNode` property pointing to its parent domain object
- property `annotations` [2] which allow for the automatic handling of UI and storage mechanisms
- `title` and `subtitle` properties
- a unique ID

Together, these describe a domain model which can be seen as an ownership tree of domain objects, which may also contain non-ownership links between them.

<!--
The parentNode property expresses ownership of child nodes and is used for the chaining of certain notifications.
-->

### Collection Managers

While this pattern isn't always used in traditional systems, it's important to note that the Collection Manager pattern is essential for properly expressing domain models within Strvct.

When a property of a domain object references a collection of domain objects with their own domain logic (e.g., for adding, deleting, reordering, searching, and moving items, validation, etc.), it should, following object-oriented principles, have a Collection Manager domain object. This object contains that logic and its subnodes constitute the collection being managed.

For example, a Server class might have a guestConnections property that references an instance of GuestConnections (a descendant of DomainObject) whose subnodes are instances of GuestConnection.

## User Interface

Strvct uses stacks of **Tile** views to present domain objects and their properties, and nested master-detail views to organize and navigate them. By selecting paths of these tiles, the user can explore the domain model.

<!--
Noteably, due to the uniformity of the system, advanced operations like re-ordering, and drag-and-drop work are supported throughout the system without any developer effort beyond setting an annotation in the relevent domain object that these operations are permitting and with which types.
-->

<i>Note: the following diagrams only illustrate the view layouts and do not reflect the actual appearance in the application.</i>

### Tiles

The core navigational elements, referred to as **Tiles**. Tile subclasses can be used to customize the appearance of domain objects and properties and domain objects can request specific tiles to be used to represent them or their properties.

#### Domain Object Tiles

**Summary Tiles** are the default tiles used to represent domain objects and to navigate the domain model. They typically display a title, subtitle, and optional left and right sidebars.

<diagram>
Summary Tile
<object type="image/svg+xml" data="diagrams/svg/summary-tile.svg">[SVG diagram]</object>
</diagram>

More specialized tiles can be also used to represent domain objects. For example, for a domain model representing a Markdown document, and composed of domain objects such as **Heading**, **Paragraph** objects, with corresponding **HeadingTile** and **ParagraphTile** objects to represent each element in the document.

#### Property Tiles

**Property Tiles** present a property of a domain object and typically display a name and value, and optionally a note, and/or error (i.e. validation error).

<diagram>
Property Tile
<object type="image/svg+xml" data="diagrams/svg/property-tile.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
</diagram>

Strvct includes a number of specialized property tiles for common property types, such as Strings, Numbers, Dates, Times, and Images.

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
<object type="image/svg+xml" data="diagrams/svg/tiles.svg">[SVG diagram]</object>
</diagram>

### Master-Detail Views

A **Master-Detail View** is used to present a domain object. Its master section contains a **Tile Stack** presenting the subnodes of the domain object and its detail section presents the domain object for the selected subnode tile, which itself may be a master-detail view. The master section supports optional header and footer views which can be used to flexibly implement features like search, message input, or group actions. The divider between the master and detail sections can also be dragged to resize the sections if the domain object allows it.

<diagram>
Master-Detail View
<object type="image/svg+xml" data="diagrams/svg/master-detail.svg">[SVG diagram]</object>
</diagram>

#### Flexible Orientation

Detail Views can be oriented to be be right-of, or below the Master View (which contains theTiles Stack). Both can be requested by the related domain object or overridden by the user interface, offering adaptability based on the content, display size, and user preference.

<diagram>
Master-Detail Orientations
<object type="image/svg+xml" data="diagrams/svg/orientations.svg">[SVG diagram]</object>
</diagram>

#### Nesting

Nesting of master-detail views with flexible orientations allows for navigation structures which fit many common application design patterns.

<diagram>
  <div style="display: inline-block; height: fit-content; width: 30%;">
  Vertical<br>
  <object type="image/svg+xml" data="diagrams/svg/vertical-hierarchical-miller-columns.svg">[SVG diagram]</object>
  </div>
  <div style="display: inline-block; height: fit-content; width: 30%;">
  Horizontal<br>
  <object type="image/svg+xml" data="diagrams/svg/horizontal-hierarchical-miller-columns.svg">[SVG diagram]</object>
  </div>
  <div style="display: inline-block; height: fit-content; width: 30%;">
  Hybrid<br>
  <object type="image/svg+xml" data="diagrams/svg/hybrid-hierarchical-miller-columns.svg">[SVG diagram]</object>
  </div>
</diagram>

#### Auto Collapsing and Expanding

Chains of Master-Detail views automatically collapse/expand their tile views until there is space for the remaining master-details views. This allows for responsive and efficient use of display space across a wide range of viewport sizes.

<diagram>
Expanded
<object type="image/svg+xml" data="diagrams/svg/expanded.svg">[SVG diagram]</object>
</diagram>

<diagram>
Collapsed<object type="image/svg+xml" data="diagrams/svg/collapsed.svg">[SVG diagram]</object>
</diagram>

#### Navigation Path

The navigation system employs visual cues to guide users along the selected path. Tiles that form part of the chosen route are highlighted, and the focused tile - which represents the most recently selected location - is distinguished with a unique highlight. This differentiation allows users to quickly identify their current position within the overall navigation sequence. These highlights and other visual attributes are customizable via themes.

<diagram>
Navigation Path
<object type="image/svg+xml" data="diagrams/svg/path.svg">[SVG diagram]</object>
</diagram>

#### Breadcrumbs

#### Menus

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
