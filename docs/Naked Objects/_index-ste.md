# Naked Objects (Simplified Technical English)

How to Close the Usability Gap in Naked Objects

## About This Version

This document says the same things as "Closing the Usability Gap in Naked Objects". It uses ASD-STE100 Simplified Technical English. The technical content does not change. The words, the sentences, and the paragraphs follow the STE writing rules. Appendix A lists the technical names, the technical verbs, and the other language decisions for this document.

The standard-English text is in `_index.md`, which is the text that the docs site shows. A PDF of the standard version is also available: [PDF](compiled/Closing_the_Usability_Gap_in_Naked_Objects.pdf).

## Abstract

The naked objects pattern makes a promise: a program can make its user interface directly from its domain model. Developers then write no custom interface code, and the interface always agrees with the business logic. After twenty-five years, few programs use the pattern. The cause is not the automatic method. The cause is the interfaces that the method made: generic forms, tables, and menus. These interfaces do not give the clear use of space and the easy movement that users expect.

This gap was not necessary. The design space for structured information is more narrow than the software industry thinks. A few primitives cover it: tiles, tile stacks, and master-detail views. The most important primitive is a master-detail view that the framework makes by default.

That primitive is a set of Miller columns. The columns nest to any depth, and each level selects its own orientation. The chain of columns collapses automatically on a narrow viewport. The framework composes the columns from model annotations, and no developer builds them for one screen. Research in human-computer interaction explains why a small and strict UI grammar makes sameness a benefit. That research covers mental models, information foraging, and Gestalt perception.

This paper describes Strvct, an open-source JavaScript framework that uses this idea. Strvct keeps the path from the model to the view in one place. Therefore it gives capabilities that usual component frameworks must pay for one screen at a time. These capabilities are automatic responsive design, headless tests, and automatic persistence and cloud sync from annotations.

Strvct also lets an AI agent operate the domain model directly. The annotations that make the UI also give the agent its tool surface. The size of that tool surface does not increase with the size of the model. The surface also cannot get out of agreement with the model. AI agents now change application state together with users. Therefore this is the lever of cost that can most probably move naked objects past its stall of twenty-five years.

undreamedof.ai is a production application on Strvct. It has about 90 domain classes, and the framework makes about 90% of the views. Only two views need custom code. Both of them are graphical parts: a 3D dice roller and a battle map.

## 1. Introduction

Most application frameworks make the user interface a separate problem from the domain model. A developer designs, writes, and keeps each screen alone. Each new model class, and each change to the schema, goes into view code, form layouts, navigation code, and responsive design code. This duplication is structural and not accidental. Its cost increases with the number of domain objects.

Naked objects [1] gives a different path: show the domain objects directly to the user, and let the program make the interface automatically. Developers write only the domain model, and the interface comes from it. The interface always shows the true state and the true shape of the model. There is no second copy of the model that can become wrong.

Pawson and Matthews described the pattern in 2002 [1]. Several frameworks use it, and the best known is Apache Isis, now Apache Causeway [2], for Java. These frameworks prove the main idea: a program can make a complete and correct interface from a domain model. But only internal tools, administration interfaces, and trial programs use them.

The cause is what the user sees, and not a technical limit. The interfaces are correct and complete, but they feel wrong. They give a generic form for each object, a table for each collection, and a menu for navigation. They do not have the clear use of space, the depth of navigation, and the responsive behavior that users expect. They look like database administration tools, and not like the applications that people use each day. This usability gap holds naked objects back, and no limit of the basic pattern holds it back.

Component frameworks such as React, Vue, and Svelte attack the same cost from the other side. They do not remove view code; they make view code cheaper to write. Component libraries do more of the same. But the view tree is still there. A developer must write the view tree, and must keep it in agreement with the model.

To add one property, a developer must touch a form, a check, a serializer, and a translation file. Naked objects, when done well, removes the view tree as something that a developer writes. The framework makes the view from the model. No component library closes this gap.

This paper shows how to close the usability gap. We show that the design space for structured information is narrow. We name a small set of primitives that covers the space. We then describe Strvct, a framework that shows the approach in a production application.

These are the contributions:

1. **The recursive master-detail view with flexible orientation, which the framework makes by default.** This is the primitive that closes the usability gap. Miller columns moved users through hierarchies from the time of NeXTSTEP. Our contribution makes the columns recursive, so they nest to any depth. It makes them flexible in orientation, so each level selects a vertical or a horizontal layout. It makes them collapse automatically, so the chain folds to a breadcrumb bar on a narrow viewport. It also makes them the default, because the framework composes them from model annotations and no developer builds them for one screen. This mechanism gives the clear use of space and the depth of navigation that users expect.

2. **The narrow design space claim.** Informational UIs use the same small set of space conventions. Therefore one uniform use of these conventions is a benefit and not a limit. A small and fixed grammar of primitives is then enough to cover the space. That grammar has tiles, tile stacks, and the recursive master-detail view above.

3. **An annotation system that needs no coordination.** Independent framework layers for UI, persistence, sync, AI, and internationalization read metadata from the same slot declarations. The layers do not coordinate with each other.

4. **A domain model that an AI agent can operate directly.** The case study shows this result of the annotation system. One pair of tools covers every editable class. Therefore the size of the agent tool surface stays constant. It does not increase with the size of the model.

5. **A framework and a production application.** Strvct works, and undreamedof.ai uses it. The framework makes about 90% of the views across about 90 domain classes.

## 2. The Usability Gap

Earlier naked objects frameworks show each object as a form of property fields. They show each collection as a table or a list. The user navigates with menus, links, or search. This is enough for function, but it makes four specific problems.

**No clear use of space.** Users expect the position of a thing to carry meaning: hierarchy from top to bottom, and depth of navigation from left to right. Containment shows ownership. Generic forms and tables make these relationships flat. The user must then navigate menus, because the structure is not visible.

**No adaptation to the viewport.** Modern applications put much work into responsive design. They collapse the navigation, they stack the layout, and they hide secondary content. A form-based interface ignores the viewport, or it adds special responsive behavior for one screen. That special behavior does not work for the other parts of the model.

**Different depths of navigation.** When a user goes deeper into an object hierarchy, a form-based interface replaces the current view or opens a new window. The first action loses the context. The second action breaks the context into parts. Neither action tells the user where they are in the larger structure.

**Nothing connects the screens.** Without one model of space, users cannot build a mental map. Each navigation action feels like a new and separate screen. It does not feel like a movement inside one space.

These problems are not part of naked objects. They come from one UI strategy: generic forms and tables. Earlier frameworks selected that strategy because it was simple, and because it was enough for internal tools. The question is if a different strategy can keep the automatic method and also meet the expectations of modern custom applications.

## 3. A Narrow Design Space

Our central claim is this: most differences between informational interfaces are accidental and not necessary. The layout structure is the same in most applications when users browse, navigate, and edit data. Most of the difference between one application and another is visual style, and not the logic of space.

Look at the informational interfaces where people spend most of their time. The same conventions come again and again: hierarchy from top to bottom, and depth of navigation from left to right. Containment shows ownership, and a list shows a collection. Look at four examples:

- **Email** (Gmail, Outlook): a vertical list of messages on the left, and the message content on the right. When the user selects a message, the detail pane shows its contents. Folders or labels add a second level of hierarchy. The metaphor is master-detail with optional groups.

- **Facebook**: a vertical feed of posts. The user can expand each post into comments and replies. A sidebar list moves the user between sections such as the feed, the groups, and the marketplace. A profile page is a vertical stack of content in categories. The metaphor is a list of lists with drill-down.

- **Twitter/X**: a vertical timeline of posts. When the user selects one post, the view shows a thread, which is a vertical stack of replies. A sidebar moves the user between timelines such as home, explore, and notifications. The metaphor is master-detail, and both the master and the detail are vertical lists.

- **Amazon**: a vertical list of search results. A click on a result opens a product detail page, which is a vertical stack of sections such as images, description, reviews, and related items. A sidebar with a hierarchy gives access to the categories. The metaphor is master-detail with vertical stacks inside it.

Four different companies built four different applications for four different purposes. But all four use the same logic of space.

Decades of research in human-computer interaction and in cognitive science give the reasons.

**Mental models and metaphors of space.** Users build internal mental models of systems, and these models are mostly about space (Norman, 1988; Gentner & Stevens, 1983). Users think about digital information with the same primitives that they use for physical places: location, containment, nearness, and hierarchy. Tiles, stacks, and master-detail views map directly onto these primitives.

**Information foraging and how users scan.** Research with eye trackers shows that Western readers behave in a way that we can predict. They read text-heavy pages in an F-pattern, and they read mixed layouts in a Z-pattern (Nielsen, 2006; Pernice, 2017). An interface that agrees with these patterns makes the mental effort less. An interface that fights them makes the mental effort more. Our primitives agree with the natural order of the scan.

**Sameness and the Gestalt principles.** Jakob Nielsen puts "Consistency and Standards" in the top usability heuristics (Nielsen, 1994). The Gestalt laws of perception are nearness, likeness, closure, and common fate (Wertheimer, 1923; Koffka, 1935). These laws explain why stacked tiles and recursive nests feel correct immediately. We put these laws into the architecture. Sameness then becomes a property of the structure, and not a hope.

The design space is narrow because people think about information in only a few ways. They organize it and navigate it with a small set of methods. What feels like creative freedom in usual UI design is often accidental complexity on top of these limits.

Developers of custom UIs already use the same patterns, but they do it without knowledge of it and not in the same way. The differences between custom interfaces are mostly on the surface. They use a different style, a different space between the parts, and different component libraries. Below the surface, the logic of space is the same.

This supports two claims. We must keep them apart, because they are not equally strong.

- **The coverage claim**: most informational interfaces divide into tiles, stacks, and master-detail views. Therefore a framework with only those primitives can express them. This claim is a count of domain classes, and the case study (§8) measures it directly.
- **The preference claim**: one uniform use of the conventions is better than a set of custom screens. Users get the same navigation everywhere, and the framework cannot make the free layouts that break the sameness. This claim is the headline, and it is the weaker claim. It is a judgment of value and not a count, and we do not measure it here.

The two claims must not take the place of each other. We can show that custom screens use only a small percentage of the UI code. This does not show that the automatic method loses only a small percentage of the UI value. We cannot show the second thing.

### Scope and Difficult Cases

The narrow design space covers a large and important class of applications, but not all of them. These difficult cases are outside it:

- **Data visualizations and dashboards.** Charts, graphs, heatmaps, and interactive analysis tools need special render code and direct-manipulation gestures. A framework cannot make them from the structure of a domain model.
- **Creative canvases and editors of space.** Examples are design tools such as Figma and Miro, diagram tools, CAD, and map editors. In these tools, objects have free positions in 2D or 3D.
- **Real-time media and games.** Examples are video editors, 3D renderers, audio workstations, and games. Our own case study has two of these: the dice roller and the battle map need custom views.
- **Very unusual workflows.** Examples are navigation that is not a hierarchy, complex state machines with many temporary modes, and interaction metaphors for one domain only. A timeline video editor and a node-based program are two examples.

In our case study (§8), less than 10% of the domain classes need custom view code. This is 2 classes of about 90. The framework makes the other views, and they feel natural to users. We think that many applications for enterprise work, productivity, and data management give a similar result. But we do not claim that this is true for all applications.

**Part of the narrowness comes from our own definition.** We put dashboards, canvases, games, and timeline editors outside the space. Then we called the rest narrow. Therefore part of the narrowness comes from the definition and not from a discovery, and an honest reading must say so. Our defense is not that the choice is free of bias. Our defense is that the class inside the space is large and central to the economy.

That class holds the navigation and edit shells of email, social, commerce, productivity, line-of-business, and administration software. Users spend most of their time on these surfaces. A claim that is true by definition about a small class has little value. The same claim about most everyday informational software has much value.

**The part that does not fit: product or edge?** Every real application has some surface that does not fit the grammar. This part always exists, and we do not question that. The useful test asks if this part is the product or only the edge. The navigation shell has lists, drill-downs, inspectors, and settings. It is master-detail almost everywhere, and users rarely value a product for it. Often the difference between two products is the one surface that does not fit: the feed-rank view, the editor canvas, the map, or the chart.

Consumer products often put much of their value in a few such surfaces. These surfaces can be a small part of the total number of screens. This puts an exact limit on the narrow-space claim. The claim covers the shell, which is most of the screens. The claim says nothing about how much of the value of a product is in the part that does not fit.

**The mouse comparison, and its honest limit.** The computer mouse won because it did the tasks with most of the value: selection, direct manipulation, and navigation. It was never universal, and it left a permanent part to other devices: text entry and keyboard shortcuts. The sentence "You cannot do everything with a mouse" was true, and it never counted against the mouse. The part that the mouse could not do was not the point of the tasks that people used it for.

Interfaces that a framework makes are in the same position. People used "not universal" incorrectly to mean "not valuable". But the comparison also shows the boundary honestly. The sentence "You cannot do everything with X" is decisive when the part that X cannot do is the whole point.

Such an interface is the wrong tool for a competitive-programming editor or a node-based shader graph. In those two tools, the custom surface is the product. The question is never if a part that does not fit exists. The question is if that part is the product or the edge.

**A deliberate limit.** The framework refuses free layouts. In exchange, it gets structural results that a more general system loses. These results are sameness, responsive behavior, easy work with AI agents, and almost no maintenance of the view layer. Applications that are mostly inside the narrow space get much lower maintenance cost and more sameness. Traditional component frameworks are better for applications that are mostly difficult cases.

Future work can look at hybrid methods. For example, the framework could hold selected custom view components inside a tile-and-stack hierarchy that it makes automatically. Future work can also add more primitives with discipline. We keep the core grammar minimal on purpose.

## 4. Approach: A Small Set of UI Primitives

We define a small set of UI primitives that hold the space conventions above. Each primitive does one part of the presentation. Together, the primitives cover the navigation and layout patterns of typical informational applications.

The principle is simplicity and power through one concept in the place of many. Each primitive removes differences that usual frameworks keep separate:

| Concept | Takes the place of |
| --- | --- |
| Annotated slots | Properties, form fields, storage records, schemas, translation keys, and ARIA attributes |
| Tiles | Summary views, property editors, list items, and navigation elements |
| Master-detail views | Menus, inspectors, drill-downs, settings panels, breadcrumb bars, and responsive layouts |
| Domain nodes | Objects, the navigation hierarchy, the persistence graph, and the surface that an AI agent operates |

The sections below describe each primitive.

### 4.1 Tiles

The basic unit of presentation is the **tile**. A tile is a view of one domain object, or of one property of a domain object.

**Summary tiles** show domain objects with a title, a subtitle, and optional sidebars. They are the primary navigation element. When the user selects a summary tile, the adjacent detail area shows the contents of the object.

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em 0 0.5em; margin: 0; text-align: center;">
    Summary Tile
  </div>
  <object type="image/svg+xml" data="diagrams/svg/summary-tile.svg" style="display: block; margin: 0 auto; max-width: 400px; width: 80%;">[SVG diagram]</object>
</div>

**Property tiles** show one property as a key-value pair, with an optional note and an optional error message. Special property tiles handle the common types: strings, numbers, dates, images, and booleans. Each type gets the correct edit behavior.

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em 0 0.5em; margin: 0; text-align: center;">
    Property Tile
  </div>
  <object type="image/svg+xml" data="diagrams/svg/property-tile.svg" style="display: block; margin: 0 auto; max-width: 400px; width: 80%;">[SVG diagram]</object>
</div>

Tiles accept direct-manipulation gestures. The user slides a tile to delete it, and presses a tile for a long time to change its order. The user can also drag and drop tiles between tile stacks, between browser windows, and to or from the desktop and other applications. Each domain object declares which MIME types it accepts. Therefore the framework can import and export data safely by type through the standard drag gestures.

A developer can make a subclass of a tile for one domain. But the default tiles are enough for most cases, and a custom tile must be the exception.

### 4.2 Tile Stacks

A **tile stack** is a scrollable sequence of tiles in order. It shows the subnodes of a domain object. A tile stack can be vertical or horizontal. It accepts gestures to add items, to remove items, and to change their order.

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em 0 0.5em; margin: 0; text-align: center;">
    Tile Stack
  </div>
  <object type="image/svg+xml" data="diagrams/svg/tiles.svg" style="display: block; margin: 0 auto; max-width: 200px; width: 60%;">[SVG diagram]</object>
</div>

### 4.3 Master-Detail Views

A **master-detail view** has two parts. The first part is a tile stack, which is the master. The second part is a detail area, which shows the item that the user selected. The detail area can hold another master-detail view. Therefore the user can navigate to any depth through recursive composition.

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em 0 0.5em; margin: 0; text-align: center;">
    Master-Detail View
  </div>
  <object type="image/svg+xml" data="diagrams/svg/master-detail.svg" style="display: block; margin: 0 auto; max-width: 400px; width: 80%;">[SVG diagram]</object>
</div>

Three features make this composition practical.

**Flexible orientation.** The detail area can be at the right of the master, or below it. The domain object specifies the orientation, and the interface can override it. Therefore the same primitive expresses horizontal navigation, like a file manager, and vertical drill-down, like a settings panel.

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em 0 0.5em; margin: 0; text-align: center;">
    Master-Detail Orientations
  </div>
  <object type="image/svg+xml" data="diagrams/svg/orientations.svg" style="display: block; margin: 0 auto; max-width: 500px; width: 90%;">[SVG diagram]</object>
</div>

**Automatic collapse.** Sometimes the viewport is too narrow for the full chain of master-detail views. Then the framework collapses the earlier columns automatically. A breadcrumb bar shows the navigation path and lets the user go back. The same structure works on a wide desktop monitor and on a narrow mobile screen. No object needs responsive design of its own.

<div style="max-width: 600px; margin: 0 auto;">
  <div style="padding: 0.2em 0 0.5em; margin: 0; text-align: center;">
    Expanded
  </div>
  <object type="image/svg+xml" data="diagrams/svg/expanded.svg" style="display: block; width: 100%; height: auto;">[SVG diagram]</object>
</div>
<br>

<div style="max-width: 600px; margin: 0 auto;">
  <div style="padding: 0.2em 0 0.5em; margin: 0; text-align: center;">
    Collapsed
  </div>
  <object type="image/svg+xml" data="diagrams/svg/collapsed.svg" style="display: block; width: 100%; height: auto;">[SVG diagram]</object>
</div>
<br>

**Header and footer areas.** The master part can have an optional header view and an optional footer view. These areas hold search, message input, or group actions. Therefore common interactions fit inside the same set of primitives.

### 4.4 Composition

A nest of master-detail views with different orientations makes the navigation structures of many common applications. Examples are Miller column file browsers, settings hierarchies, email clients, chat applications, and inspector panels. These are not special cases with separate code. They are natural compositions of the same three primitives.

<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 2%; width: 100%;">
  <div style="min-width: 150px; width: 30%; text-align: center;">
    <div style="padding: 0.2em 0 0.5em; margin: 0;">Vertical</div>
    <object type="image/svg+xml" data="diagrams/svg/vertical-hierarchical-miller-columns.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
  </div>
  <div style="min-width: 150px; width: 30%; text-align: center;">
    <div style="padding: 0.2em 0 0.5em; margin: 0;">Horizontal</div>
    <object type="image/svg+xml" data="diagrams/svg/horizontal-hierarchical-miller-columns.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
  </div>
  <div style="min-width: 150px; width: 30%; text-align: center;">
    <div style="padding: 0.2em 0 0.5em; margin: 0;">Hybrid</div>
    <object type="image/svg+xml" data="diagrams/svg/hybrid-hierarchical-miller-columns.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
  </div>
</div>

Composition is the key idea. The framework does not hold a fixed set of application templates. It gives building blocks, and these blocks compose into the correct layout for each part of the domain model.

Evidence for this claim came years before this paper. The recursive master-detail view with automatic collapse is now the dominant navigation pattern on phones, watches, and other small screens. Settings applications, mail clients, and file browsers show one column at a time. They push a column when the user drills in, and they pop a column when the user goes back. This is exactly the narrow-viewport collapse of §4.3, and platform designers came to it independently.

Small viewports do more than make the narrow grammar possible. They make it necessary. A watch face has no space for a custom layout per screen. Therefore designers use the master-detail collapse, and their preference on a desktop does not matter. The pattern is common on the most limited devices. Therefore the design space is narrow where the test is hardest.

Users browsed files with the Miller Column pattern [3] from the time of NeXTSTEP. We did not discover it. Our contribution makes it recursive, so columns nest vertically or horizontally. Our contribution lets each level select its own orientation. Our contribution also makes it the default, and the framework composes it from model annotations. No developer builds it for one screen.

### 4.5 Examples

We divide four widely-used applications into their views:

<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 2%; width: 100%;">
  <div style="min-width: 300px; width: 48%; text-align: center;">
    <div style="padding: 0.2em 0 0.5em; margin: 0;">Email</div>
    <object type="image/svg+xml" data="diagrams/svg/gmail-composition.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
  </div>
  <div style="min-width: 300px; width: 48%; text-align: center;">
    <div style="padding: 0.2em 0 0.5em; margin: 0;">Twitter/X</div>
    <object type="image/svg+xml" data="diagrams/svg/twitter-composition.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
  </div>
  <div style="min-width: 300px; width: 48%; text-align: center;">
    <div style="padding: 0.2em 0 0.5em; margin: 0;">Facebook</div>
    <object type="image/svg+xml" data="diagrams/svg/facebook-composition.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
  </div>
  <div style="min-width: 300px; width: 48%; text-align: center;">
    <div style="padding: 0.2em 0 0.5em; margin: 0;">Amazon</div>
    <object type="image/svg+xml" data="diagrams/svg/amazon-composition.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
  </div>
</div>

These diagrams are simplifications and not exact copies. They show the structural form, and not each navigation element. The four applications serve very different domains: communication, social media, short messages, and online shopping. But all four divide into the same small set of primitives: horizontal menus, vertical lists, and custom content views inside master-detail relationships.

Each application is, at its center, a hierarchy of menus between browsable lists of content nodes, with an inspector pane for the selected item. Each one also has a responsive strategy. The strategy decides what to show, what to hide, and what to collapse for the viewport. The structural difference between the four is very small. Users see the difference in the visual style and in the content view for one domain.

## 5. From Model to Interface

The promise "write the model, get the UI" becomes concrete with a minimal domain class in Strvct:

```javascript
(class Character extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
        }
        {
            const slot = this.newSlot("level", 1);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }
        {
            const slot = this.newSlot("inventory", null);
            slot.setFinalInitProto(Inventory);
            slot.setIsSubnodeField(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
    }

    subtitle () {
        return "Level " + this.level();
    }

}.initThisClass());
```

This definition has no UI code, no form layouts, no navigation code, and no serialization code. But it makes:

- A **summary tile** that shows the name of the character as a title, and "Level 1" as a subtitle
- **Property tiles** for `name`, which is an editable string field, and for `level`, which is an editable number field, both with the correct input type
- A **navigable field** for `inventory`. When the user selects it, a new master-detail view shows the contents of the inventory
- **Automatic persistence** to IndexedDB. The framework finds the objects that changed, and commits them in transactions
- **Synchronization in two directions**. A change in a field updates the model, and a change in the model from code updates the view
- **Automatic translation** of field labels and values when internationalization is active

The slot annotations are `setShouldStoreSlot`, `setSyncsToView`, `setCanEditInspection`, and `setIsSubnodeField`. They are the bridge between the domain model and the automatic behavior of the framework. Each annotation controls one part of the lifecycle of the object. Together, they give the UI layer, the storage layer, and the synchronization layer enough information to operate. These layers need no more code.

The screenshot below shows Strvct in undreamedof.ai, an AI-powered virtual tabletop for tabletop roleplaying games. The framework makes the character sheets, the campaign hierarchies, the session management, and the settings panels from domain model annotations. No screen in the image needed custom layout code.

<a href="figures/GriffinScreenshot.png" target="_blank"><img src="figures/GriffinScreenshot.png" alt="Screenshot of undreamedof.ai, a Strvct-based application" style="width: 100%; height: auto;"></a>

## 6. Architecture

Strvct is a client-side JavaScript framework. An application runs as a single-page application in the browser. It makes much use of client-side persistent storage for two purposes. The first purpose is a cache of code and resources through a content-addressable build system. The second purpose is an IndexedDB object database of the application state.

Strvct does not compile or pre-render user interfaces. There is no build step that makes a view tree, no template system, and no static component hierarchy. The framework makes a view only when the user navigates to a node in the object graph. At each navigation step, the framework reads the class and the slot annotations of the target node. It then finds or makes the correct view, and binds the view to the node for live synchronization in two directions.

A view stays alive while its node is visible, and the notification system keeps it in agreement with the model. The result is more like a live object browser than a usual render pipeline. The current navigation path through the object graph decides which UI exists at each moment. The UI answers a change in the model immediately.

### 6.1 Domain Model

The domain model is a graph of objects, and all of the objects inherit from one base class. Each object has properties as *slots* with annotations, actions as methods, a `subnodes` array of child objects, a `parentNode` reference, and a unique persistent identifier.

The model is fully independent of the UI layer. Model objects hold no references to views, and they communicate outward only when they post notifications. Therefore the same model code runs headlessly in Node.js for tests, or for work on a server.

### 6.2 The Annotation Bridge

The slot system makes the automatic UI and the automatic storage possible. Properties are not raw instance variables. Each property carries metadata annotations, and each framework layer reads them independently:

- **Type**: selects the property tile, and lets the framework check types while the program runs. Every setter that the framework makes checks its argument against the declared type. The framework then finds a type error at the assignment, and not at compile time.
- **Persistence**: puts the slot into the storage record.
- **View synchronization**: starts a view update when the value changes.
- **Subnode relationship**: controls if the value appears in the navigable hierarchy of the object.
- **Editability**: controls if the user can change the property through the UI.
- **Inspectability**: shows the slot in the generic inspector for debug work. This is independent of the normal navigable hierarchy.
- **Automatic initialization**: names a class to instance if the framework loaded no value from storage.
- **Translation context**: gives context about the meaning for AI-powered translation.

No annotation knows about the other annotations. The UI layer reads the type and the editability. The storage layer reads the persistence. The synchronization layer reads the sync flags. A developer can add a new layer for internationalization, cloud sync, or schemas. The new layer needs no change to the current annotations, and no change to the domain model.

### 6.3 Storage

The annotations drive the persistence. The persistence layer watches slot mutations. At the end of each event loop, it collects the objects that changed into atomic transactions, and commits them to IndexedDB. At load time, it makes live object instances from the stored records, and makes the relationships again.

A separate content-addressable blob store holds large binary data. It uses SHA-256 hashes as keys, so it keeps only one copy of the same content. Objects store hash references, and not blob data.

Automatic garbage collection walks the stored object graph from the root, and removes the objects that it cannot reach.

### 6.4 Synchronization

The model and the view communicate through a notification system that defers work and removes duplicates. When a model property changes, the framework posts a notification. The views that observe the model then schedule a sync pass. The framework puts multiple changes in one event loop together. Synchronization in two directions stops automatically when the values become equal, so there is no infinite loop. Observations use weak references, so garbage collection of one party removes the subscription automatically.

## 7. Results of the Structure

The framework controls the full pipeline from the model annotation to the view on the screen. Therefore the architecture gives capabilities that cost effort per component in other frameworks. These capabilities are not a surprise. They come from one structural fact. The framework has complete knowledge of the domain model, and it controls the single point where model data goes to the UI.

We mark the status of each capability, and we group the subsections by status:

- The case study **shows** the capabilities of §7.1 to §7.7.
- The design **gives** the capabilities of §7.8 and §7.9, but no external party validated them.
- We **propose** the directions of §7.10 and §7.11, but we did not build them.

#### Shown in the case study

### 7.1 A Domain Model that an AI Agent Can Operate

The annotations that make the UI also let an AI agent operate the domain model. The agent operates the model inside the run time. It does not only read a copy through an assistant that someone attached to the side. The framework makes a schema for any object from its slot metadata. Edits come as JSON patches, and the framework applies them to the live object graph. The patches go through the same setters, the same type checks, the same notifications, and the same sync passes as a human edit.

There is no separate surface for the AI agent that can get out of agreement with the model. This is the same idea as "remove the translation layer", but a second time. Naked objects removed the layer between the model and the view. The same annotation bridge removes the layer between the model and the agent.

One pair of tools covers the full domain: *schema-fetch* and *apply-patch*. The number of editable classes does not matter. When the framework rejects a patch, the rejection carries the schema of the slot with the error. The agent then corrects itself, and it does not fetch the context again.

Compare this with the common pattern for AI tool use: function calls, the Model Context Protocol, and OpenAPI specifications. There, each editable surface needs a tool, a schema, and an error path that a developer writes by hand. The size of that surface increases with the size of the model. Here the size stays constant. A new domain class is ready for the agent at the moment that a developer declares it.

### 7.2 Headless Execution and Tests

Model classes hold no references to views or to browser globals. Therefore the same domain code runs without change under Node.js. A test makes an instance of the model, drives it through action methods, and asserts against slot values. The test needs no DOM. The notification system, the persistence, and the patch checks all operate without a screen. Behavior that usually needs browser automation against a real DOM becomes a direct assertion on the model.

The separation of the model and the view makes the automatic UI possible. The same separation lets the model run headlessly. One architectural choice serves both ends.

### 7.3 Automatic Persistence and Cloud Sync

The framework owns the complete object graph, and the annotations tell it the structure. Therefore the persistence divides into two strategies automatically. The first strategy is a synchronous object pool for the model graph, which keeps the UI immediately responsive. The second strategy is an asynchronous content-addressable blob store for large binary resources, so they never block the screen.

The same structural knowledge makes automatic cloud synchronization possible. The framework knows what changed, which blobs have references, and how to make the state agree. The developer annotates what to store, and the framework decides how and when to store it.

### 7.4 Content-Addressable Resource Load

The build system makes a content-addressable bundle, and the key is the content hash. The browser never downloads a resource again if the resource did not change between releases. The store also keeps only one copy of the same content at different paths. Bundlers that use paths cannot cache at this level of detail. End-to-end control of the resource pipeline is the same structural fact that gives the other results in this section.

### 7.5 Automatic Responsive Design

The layout comes from model annotations, and not from CSS for one screen. Therefore the interface adapts to the size of the viewport, and no view needs a breakpoint. The chain of recursive master-detail views collapses when the viewport becomes narrow, and a breadcrumb bar keeps the navigation path. The same composition scales from a desktop screen to a mobile screen, with no code per screen. The framework pays for the responsive behavior one time at the level of the primitive, and not one time per screen.

### 7.6 Inspector and Developer Mode in the Framework

Every node carries enough slot metadata to drive its own UI. Therefore the same metadata drives a generic inspector. The inspector is a view that shows the slots of a node directly as editable fields. The user opens it on any tile with one modifier-click, which is an option-click.

An annotation controls which slots appear. The inspector reads a flag for inspectability per slot. It reads that flag exactly as the persistence layer reads the storage flag, and as the UI layer reads the editability flag. Therefore the framework can hide a slot from the normal navigable hierarchy, and debug work can still reach it.

A developer-mode switch shows the subnodes that the framework hides from end users. The same navigation pipeline then becomes a debug surface. In a usual framework, debug tools mean a custom inspector per type and a second description of the model shape. That cost increases with the size of the model. Here the model-to-view pipeline already covers every object, so the inspector is free. The inspector is one more independent reader of the annotation bridge (§6.2).

### 7.7 Drag-and-Drop between Windows and between Applications

The framework makes every tile from the same view classes. Therefore drag-and-drop works in the same way in all of the application, in two modes that share one gesture:

- A **copy** drag serializes the source node to JSON, with the pool of its sub-objects inside the JSON. It then delivers the JSON through the declared MIME types. This mode works between browser windows, to and from the desktop, and to and from other applications that exchange those types.
- A **reference** drag transfers the persistent UUID of a node. The user can then move or link an object inside the application, and the framework does not copy the contents.

Both modes are safe by type. The target checks the data against the same slot metadata that drives the form checks and the AI patches. In a usual framework, drag and drop between applications needs a handler per class and a serialization format per screen. The target must also do a special check. That cost increases with the number of objects that a user can drag. Here it is free at the level of the primitive.

A reference drag between windows needs a second client to resolve the UUID against shared state. This is a natural extension, but we did not build it.

#### Capabilities of the architecture that no external party validated

### 7.8 Accessibility

The framework makes every interactive surface from the same few primitives. Therefore it pays for accessibility one time at the level of the primitive. Focus order, keyboard movement, drill-in, and back-out belong to tiles and tile stacks. The slot metadata that drives the type checks can also make ARIA roles and constraints. The node hierarchy gives landmarks and the breadcrumb structure.

In a usual framework, accessibility is a duty per component. That cost increases with the number of screens, and developers often forget it. Here it cannot fail for one screen only, and one correction corrects all screens. We did not check the result against the full WCAG list, and no user of a screen reader tested it. We report this as a property of the architecture, and not as a measured result.

### 7.9 Automatic Internationalization

All UI text comes from slot annotations, and it goes through one render pipeline. Therefore the framework puts the translation in at the boundary between the model and the view. No component needs a translation call, and no tool must extract the strings. A new class is translatable by default.

One central pipeline also makes AI-powered translation possible. The framework walks the class prototypes and lists the strings that need a translation. A context annotation per slot travels with each string, so the translator uses the correct words for the domain. A new language becomes a change to the configuration, and not a translation project.

As with accessibility, we did not validate a full deployment in many languages, and we did not validate right-to-left layouts in production. The surface in the architecture exists.

#### Proposed directions that we did not build

### 7.10 Extensibility with AI

An agent that operates the model moves inside a fixed space of types. The same architecture suggests a capability that makes that space larger, but we did not build it. Every layer reads the slot annotations, and not code per type. Therefore an agent could declare a new model class while the program runs.

That class would become a full citizen immediately. It would be navigable, editable, storable, synced, and translatable, and an agent could operate it. It would need no build step. This changes "write the model, get the application" into "the application writes its own model while it runs".

This also makes a problem that we did not solve. If the agent can make types, the agent can also make the type contract. A safe form needs a declared floor of types and rules that cannot change. The AI agent can build on this floor while the program runs, but it cannot change the floor. The annotation bridge is the natural seam for the floor. §7.11 describes the security side.

### 7.11 Security

The framework makes the views from framework code that we trust. If we build the AI extensibility of §7.10, this also gives a security advantage. View code is the surface that is hardest to confine in a browser. It touches the DOM, and it carries the authority of the origin. Model objects do not touch the DOM.

An untrusted extension would then give data and metadata only, and never code that touches the DOM. "Extend the UI" becomes "extend the model", and a runtime can confine that like anything else. The layer that naked objects removed was a maintenance cost, and it was also an attack surface.

To make this safe, we need two primitives that we did not build:

- **Isolation**: code that an agent makes while the program runs must operate in a web worker, with no access to the rest of the program.
- **Authority**: an object gets only the references that the runtime grants to it. The floor of §7.10 is then the set of references that the runtime does not grant.

Two limits remain. The protection reaches only as far as the framework makes the views, and a true custom view opens the hole again. The render path also becomes one concentrated root of trust, and it must encode all model data on output. Capability discipline is also hard to add to a program later. We give this as a clear path, and not as a solved problem.

## 8. Case Study: undreamedof.ai

We used Strvct to build undreamedof.ai, an AI-powered virtual tabletop for Dungeons & Dragons and other tabletop roleplaying games. This table shows the parts of the application:

| Subsystem | Domain classes | Custom views |
| --- | ---: | ---: |
| Character system | ~30 | 0 |
| Campaign system | ~20 | 1 (map) |
| Session system | ~25 | 1 (3D dice) |
| AI integration | ~15 | 0 |
| **Total** | **~90** | **2** |

Less than 10% of the classes need custom view code. The other parts use only tiles and master-detail views that the framework makes. These parts are the character sheets, the campaign hierarchies, the settings panels, and the administration interfaces.

The domain is not simple. Character sheets nest deeply: first the character, then the ability scores, then the individual scores, then the modifiers. Campaigns hold recursive trees of locations. The session system keeps real-time state across several connected clients. The default primitives make navigable and usable interfaces in all of these places.

**Scenario: an AI agent makes a character.** A user asks an AI assistant to fill a character sheet. The assistant calls the same patch tools that the application uses internally. The same setters check the data. The UI updates through the same notification system as a direct edit.

A new character property needs one slot declaration. The UI, the AI tool surface, the persistence layer, and the translation list all use it with no more code. In a component framework, the same change would touch the model, a form component, an AI tool specification, and a serializer.

The two custom views are a 3D dice roller and a battle map. They are in the category that §3 puts outside the narrow design space. They are graphical parts for one domain, and the framework cannot make them from model annotations. Their existence does not weaken the approach. It confirms that the boundary between made views and custom views is where we predicted.

**The count is a stage in a pipeline, and not a fixed floor.** The number changed while we did this work, and that fact is useful. The chat interface started as a custom view. We then made it general in the framework, as reusable message-list tiles and input tiles. Therefore the case study went from three custom views to two. This shows a workflow that repeats: write a custom view, find the general pattern inside it, then move that pattern into the framework.

Chat was always the case at the boundary. A message list with a header and a footer input is a master-detail view with a footer, in the style of one domain. Therefore its absorption into the framework is not a surprise.

We must say the implication plainly. "Two of about 90" does not measure a necessary floor. It counts what nobody made general yet, so it depends in part on the effort and the skill of the developer. This makes the warning about a single developer below more important.

It also makes the narrow-space claim easy to fulfil, in a mild way. Developers find patterns and move them into the framework, so the number of custom views falls toward a graphical floor of WebGL and canvas. This happens almost without regard to the true boundary between necessary and accidental custom views.

The honest open question needs measurements, and one application cannot give them. Is there a hard floor well above zero, which is a class of surfaces that are not graphical but still resist a general form? Or does the number continue to fall toward the graphical minimum when developers apply more effort? The dice roller and the battle map are almost certainly below such a floor. We do not know if any surface that is not graphical is above it.

This is a proof that the approach is possible, and not a generalization: one application, and one primary developer. It supports the claim that the approach works. It does not support a claim that the approach is the best one.

## 9. Related Work

**Naked objects frameworks.** Apache Isis, now Apache Causeway [2], is the most developed naked objects framework. It makes the UI automatically for Java domain models, and it gives both a web UI, which is the Wicket viewer, and a REST API. JMatter [4] built naked objects for Java Swing. Both use a form-and-table UI strategy, and both target enterprise and administration work. Strvct is different in its UI strategy, because it uses space primitives that compose, and not forms and tables. It is also different in its target, because it aims at applications for end users, and not at internal tools.

**Model-based and automatic UI.** A long line of model-based user-interface development, or MBUID, makes interfaces from abstract specifications. IFML [5], which is the Interaction Flow Modeling Language, and UsiXML [6] are two examples. They make a concrete interface from an explicit UI model. These methods usually need a separate UI model on top of the domain model. Naked objects removes that specification, because it uses the annotated domain model as the only source.

The adaptive line of work is closer to our claim, and SUPPLE [7], by Gajos and Weld, is the best example. SUPPLE treats the automatic interface as a search with limits over the device, the task, and the user. It shows that an automatic method can make interfaces that are usable, and not only complete. SUPPLE is the sharpest earlier test of the narrow-design-space claim.

SUPPLE reaches usability with a search over a flexible space. We claim that a small and fixed grammar of space primitives already covers the informational design space. Then the automatic method is a problem of composition, and not a problem of search. The two readings of the same evidence agree: a program can make good interfaces. Our specific contribution is the claim that the vocabulary that covers the space is small, and that sameness over it is a benefit.

**Concept design and clear software.** Jackson describes *concept design* [8] in *The Essence of Software*. Meng and Jackson describe a related pattern in *What You See Is What It Does* [9]. Both works follow a program that is next to ours. That program puts the structure first and clarity first. Software then has a small set of independent and reusable concepts, and a reader can look at their behavior directly. We agree with the idea that clarity and sameness come from a limit on the structure, and not from decoration on top of it. These works are the nearest neighbors in the same conference.

The difference is the place of the limit. Concept design limits the *behavioral* division of a system into concepts. The narrow-design-space claim limits the *presentational* vocabulary, and the framework makes the interface from it. In principle, the two compose: behavior with a concept structure, shown through one uniform presentation that a framework makes.

**Miller Columns.** NeXTSTEP introduced the column navigation pattern, and macOS Finder made it popular [3]. It gives continuity in space when a user browses hierarchical data. Later, small-screen platforms made it dominant. They show one column at a time, and they push and pop columns when the user drills in and goes back. This is independent evidence that the grammar is narrow where the limits are hardest (§4.4).

Strvct extends the pattern in three ways. Columns nest vertically or horizontally. Each level selects its own orientation. The layout also comes from model annotations, and not from application code.

**Component frameworks.** The dominant approach to modern UI development is React, Vue, and Svelte. It attacks the same cost problem as the low-code approach, but at a different layer. It does not remove view code; it makes view code cheaper to write. Component libraries such as shadcn, MUI, and Ant Design cut the effort per screen more, because they give reusable building blocks. But the view tree is still there. A developer must write it, and must keep it in agreement with the model. To add one property, a developer must still edit a form component, a check, a serializer, and possibly a translation file.

Naked objects, when done well, removes the view tree as something that a developer writes. The framework makes the view from the model. No component library closes this gap.

**Low-code and no-code platforms.** Modern low-code platforms such as Retool, Appsmith, and OutSystems make UI development cheaper with visual builders and ready-made components. They attack the same problem as naked objects, but from the other side. They do not remove the custom UI; they make it faster to produce. The result is still a set of screens that a developer designed one at a time. A developer must keep these screens correct while the data model changes. Naked objects removes this maintenance cost.

**AI that writes UI code.** Large language models can now write UI code from a description in natural language. This makes the *creation* of a custom interface automatic, but not its *maintenance*. Each new screen is still a separate part of the program, and a developer must update it when the model changes. Naked objects is a very different approach. It does not make the production of custom UIs automatic. It removes the need for them.

## 10. Discussion

### The Crossover Point

A custom interface can look better early in the life of an application. The screens are few, and each screen gets individual design attention. But the domain model grows, and then the cost to keep the custom screens grows with it. Differences between screens also collect. At some point, which we call the crossover point, an interface that the framework makes gives a better experience than a set of custom screens. The user can then depend on the same navigation in all of the application.

The approach with primitives that compose moves this crossover point earlier, because it makes a better interface. The undreamedof.ai case study suggests that the point can come sooner than people expect. At about 90 domain classes, the framework made about 90% of the views. In the judgment of the primary developer, they gave more of the same navigation than custom screens would give. That is a coverage result. This case study does not measure if end users *prefer* the uniform interface, which is the separate preference claim of §3.

### Use versus Coverage

A coverage result and a use result are not the same thing. This difference controls how a reader must take the central claim of this paper. §3 and §8 argue about *coverage*: the patterns fit most informational UIs. But coverage was never the reason for the stall of twenty-five years. Earlier frameworks already made complete and correct interfaces. The limit that binds is the **cost to change**.

The mouse comparison of §3 is strong about coverage, but wrong about use. The cost to learn the mouse was almost zero. But a move to a framework that makes the UI from the model has a large cost. The developer loses the React ecosystem, the shared set of component libraries, and fine control per screen.

"Most UIs fit the patterns" can be fully true, and the framework can still not get the use that the mouse got. The quantity in the balance is not coverage. It is the cost to leave.

**The lever of cost.** One force changes the balance of *use*, and not the balance of *coverage*. That force is the move to development with an agent. An LLM now changes application state together with the user. Then the custom-UI path gets a new duty that continues. It must show, document, and keep a tool surface for every type that a program can change. That cost increases with the model, and it becomes wrong as the model changes.

An architecture that makes the UI from the model pays that cost one time and structurally, because the tool surface *is* the model (§7.1). This changes the offer to the developer. The old offer was easy to resist: the same UI everywhere, and less maintenance of the view layer. The new offer is different: an agent can operate the application by nature, and it stays that way for free.

React with a custom UI cannot match that offer, and a move to the same architecture is the only way to match it. We give this as the strongest lever. It is the first argument that attacks the limit that truly held the pattern back.

### Strengths

The approach is strongest where the model is the part of the program with high value and frequent change. There, the needs of the users change often. The main bottleneck is the cost to keep the UI, the storage, and the synchronization in agreement with a model that moves. A change to the model goes automatically to the UI, the persistence, the cloud sync, the AI integration, and the internationalization. Therefore the cycle from "the need changed" to "the software works" is only as long as the change to a class definition.

A developer can add a property, restructure a hierarchy, or introduce a new entity. None of these changes touch the view code, the form layouts, the serialization code, or the API schemas.

This suits applications that explore a problem, or that change quickly: tools for analysis, research, or operations. It suits any domain where the data model grows and changes through the life of the application. Headless execution helps here. The same model that drives the UI can run in tests, in simulations, or in batch work under Node.js, with no browser. Therefore a developer can check a model change quickly, before users see it.

### Limitations

*Scope.* The approach suits informational and navigational interfaces, where users browse, edit, and manage structured data. Interfaces that are graphical by nature need special render code, and they are outside the automatic pipeline. Examples are data visualizations, design canvases, game renderers, and timeline editors. Strvct accepts custom view classes for these cases. But each custom view is a return to the costs that the approach must remove.

*Locale.* The space conventions that we use follow Western reading order. The flexbox render layer can do right-to-left layouts, but we did not validate them from end to end.

*Speed with large collections.* The framework makes views only when it needs them, so the first UI is cheap. But we did not test very large collections, which are more than 10,000 tiles in one stack. The notification and sync model is for graph-shaped UIs with a small fan-out. It is not for stream-shaped UIs with a high volume of updates.

*Tools and ecosystem.* The framework does not use the standard JavaScript module ecosystem. It uses a custom content-addressable resource loader instead. This gives the hash-based cache and the central model-to-view pipeline. But it also cuts the framework off from the shared set of React and Vue tools. The framework loses IDE support for components, type checks on component properties, hot reload, and the component libraries. Debug work on code that the framework evaluates while the program runs needs a sourceURL discipline, and not standard source maps. The compromise is deliberate, but it is real.

*Evidence from one application.* The case study is one application by one primary developer. We do not know if the approach scales to development by many teams. We also do not know if it scales to plugins from other parties, or to large code bases that already exist.

*Compute on a server, and concurrency.* Strvct runs fully on the client, with IndexedDB persistence and optional cloud sync. This gives excellent offline operation and fast local interactions. But it limits use cases that need very large data sets, heavy computation on a server, or strict control of concurrency between many users.

*External validation.* The architecture supports accessibility, internationalization, and use on a mobile screen. But no external party audited these areas. No large user study measured them, and no deployment outside the primary application used them.

### Future Directions

*Hybrid composition of views.* Custom view components could take part in the tile-and-stack hierarchy that the framework makes. This would close the gap for the difficult cases of §3. A chart, a canvas, or a 3D viewport could sit at a known node in the navigation tree. The interface around it would keep its structural guarantees.

*Variants that execute on a server.* A coordinator on a server, together with the headless mode of Strvct, could support workloads that exceed the limits of a pure client. Examples are large data sets, heavy computation, and strict control of concurrency between many users. The same model and the same annotations would stay the source of truth.

*Studies with measurements.* Controlled comparisons against component frameworks would replace the proof of §8 with numbers. Such studies would measure how users form a mental model, how long a task takes, and what the maintenance costs while the model changes.

*More primitives, with discipline.* The current set does not cover some patterns, such as timelines, graphs, and free positions in 2D. New primitives could cover them, and the narrow-design-space property must remain. Each new primitive must express a space pattern that generalizes, and not one layout for one case.

## 11. Conclusion

The naked objects pattern made a strong promise for twenty-five years: write the domain model, and the rest follows. The limited use of the pattern is not a failure of this promise. It is a failure of the UI strategies that earlier frameworks selected. Generic forms and tables were enough for internal tools. They never met the expectations of modern consumer software.

A framework can close the gap, because the design space is narrow. A small set of primitives that compose covers the navigation and edit patterns of most informational applications. That set is tiles, tile stacks, and master-detail views in a recursive nest. The same annotation system drives the UI, the persistence, the synchronization, the AI tool surface, and the translation, and the layers do not coordinate. Strvct shows this in a production application of about 90 domain classes. The framework makes about 90% of the views, and custom views appear only where the narrow-space claim predicts.

We close with a prediction. The pressure that can finally move naked objects past its stall of twenty-five years is about cost, and not about looks. It applies to the limit that truly held the use of the pattern back, which is the cost to change, and not to coverage.

AI agents now change application state together with users. Then two costs increase. The first cost keeps a custom UI in agreement with a model that an LLM can rewrite at any moment. The second cost keeps a separate agent tool surface for every type that a program can change.

These two costs will exceed the cost to make both the UI and the tool surface from the model. The applications that survive this change will be the ones whose UI comes from their model. In the other applications, the UI is code beside the model.

## References

[1] Pawson, R., & Matthews, R. (2002). *Naked Objects.* Wiley. See also Pawson, R. (2004). *Naked Objects.* PhD Thesis, Trinity College, Dublin.

[2] Apache Software Foundation. *Apache Causeway* (formerly Apache Isis). https://causeway.apache.org/

[3] Miller Columns. *Wikipedia.* https://en.wikipedia.org/wiki/Miller_columns (navigation pattern introduced in NeXTSTEP, c. 1989, and popularized by macOS Finder).

[4] Arteaga, J. M. *JMatter: A Naked Objects Framework for Java Swing.* http://jmatter.org/

[5] Brambilla, M., & Fraternali, P. (2014). Interaction Flow Modeling Language. In *Proceedings of the 23rd International Conference on World Wide Web (WWW '14 Companion).* ACM.

[6] Limbourg, Q., Vanderdonckt, J., Michotte, B., Bouillon, L., & López-Jaquero, V. (2005). UsiXML: A Language Supporting Multi-path Development of User Interfaces. In *Engineering Human Computer Interaction and Interactive Systems (EHCI-DSVIS 2004),* LNCS 3425, Springer.

[7] Gajos, K., & Weld, D. S. (2004). SUPPLE: Automatically Generating User Interfaces. In *Proceedings of the 9th International Conference on Intelligent User Interfaces (IUI '04).* ACM. See also Gajos, K. Z., Weld, D. S., & Wobbrock, J. O. (2010). Automatically generating personalized user interfaces with Supple. *Artificial Intelligence,* 174(12–13), 910–950.

[8] Jackson, D. (2021). *The Essence of Software: Why Concepts Matter for Great Design.* Princeton University Press.

[9] Meng, E., & Jackson, D. (2025). What You See Is What It Does: A Structural Pattern for Legible Software. In *Proceedings of Onward! 2025 (SPLASH).* ACM.

### Works cited by author and year

Gentner, D., & Stevens, A. L. (Eds.). (1983). *Mental Models.* Lawrence Erlbaum Associates.

Koffka, K. (1935). *Principles of Gestalt Psychology.* Harcourt, Brace & World.

Nielsen, J. (1994). Enhancing the Explanatory Power of Usability Heuristics. In *Proceedings of CHI '94.* ACM. See also Nielsen, J. "10 Usability Heuristics for User Interface Design," Nielsen Norman Group.

Nielsen, J. (2006). F-Shaped Pattern for Reading Web Content (original eyetracking research). Nielsen Norman Group. https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content-discovered/

Norman, D. A. (1988). *The Design of Everyday Things.* Basic Books.

Pernice, K. (2017). F-Shaped Pattern of Reading on the Web: Misunderstood, But Still Relevant (Even on Mobile). Nielsen Norman Group. https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/

Wertheimer, M. (1923). Untersuchungen zur Lehre von der Gestalt II. *Psychologische Forschung,* 4, 301–350. (Translated as "Laws of Organization in Perceptual Forms.")

### Software and platforms cited

React. Meta Open Source. https://react.dev/ — Vue.js. https://vuejs.org/ — Svelte. https://svelte.dev/

shadcn/ui. https://ui.shadcn.com/ — MUI (Material UI). https://mui.com/ — Ant Design. https://ant.design/

Retool. https://retool.com/ — Appsmith. https://www.appsmith.com/ — OutSystems. https://www.outsystems.com/

## Appendix A. Language Decisions for This Version

ASD-STE100 lets a writer use technical names and technical verbs that the Dictionary does not have, if the project declares them (Rules 1.5 and 1.6). This appendix declares them, and it also records the other decisions for this version.

### A.1 Technical names

annotation, ARIA attribute, assistant, atomic transaction, battle map, blob, boolean, breadcrumb bar, breakpoint, cache, canvas, class, client, cognitive science, competitive programming, component, component framework, concurrency, content-addressable store, crossover point, dashboard, DOM, domain model, drag-and-drop, event loop, flexbox, framework, garbage collection, Gestalt, gesture, graph, hash, heatmap, hierarchy, identifier, IndexedDB, information foraging, inspector, instance, JSON, JSON patch, LLM, master-detail view, mental model, metadata, metaphor, MIME type, Miller column, modifier, modifier-click, node, notification, object graph, orientation, persistence, pipeline, primitive, prototype, reading order, render code, render pipeline, responsive design, schema, setter, single-page application, slot, sourceURL, subnode, summary tile, tabletop roleplaying game, tile, tile stack, usability heuristic, UUID, view, view tree, viewport, virtual tabletop, web worker, WebGL, Writing Rules.

### A.2 Technical verbs

to commit (a transaction), to compose, to deserialize, to instance (to make an instance of a class), to nest, to serialize, to sync.

### A.3 Vocabulary decisions

- **make** is the only verb for automatic creation. The Dictionary does not have "generate", "produce", or "derive", so this document does not use them.
- **custom** takes the place of "bespoke" and "hand-crafted".
- **the same**, **sameness**, and **uniform** take the place of "consistent" and "consistency".
- **need** takes the place of "require". **give** takes the place of "provide". **keep** takes the place of "maintain". **change** takes the place of "modify". **remove** takes the place of "eliminate". **show** takes the place of "present", "display", "expose", and "demonstrate". **check** takes the place of "validate" and "verify". **find** takes the place of "identify" and "locate". **let** takes the place of "enable" and "permit". **about** takes the place of "approximately".
- **free layout** takes the place of "arbitrary layout".
- **space** and **use of space** take the place of "spatial" and "spatial organization".
- **while the program runs** takes the place of "at runtime" when "run time" is not the noun.

### A.4 Structure decisions

- One sentence has 25 words or less.
- One paragraph has 6 sentences or less. Therefore some paragraphs of the standard version are two or three paragraphs here.
- The verbs are in the active voice and in a simple tense.
- The document does not use the -ing form, except in a declared technical name.
- Complex information is in a vertical list.
- The document does not use "e.g.", "i.e.", or "etc.". It uses "for example" and "such as".
- Titles of works, quotations, product names, and the code example keep their original words.
