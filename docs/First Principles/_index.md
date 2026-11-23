---
maxColumns: 1
---
# First Principles

What would we build if we started from first principles?

## Abstract

Most of the code in a typical application does not say what the application does. It says the same few facts about the domain over and over, in the different forms that screens, databases, networks and AI agents each require. This essay asks what a development environment would look like if it were designed from first principles rather than from the tools we already have.

It argues that an ideal environment would:

1. **Ask only for the essentials.** The author states what defines the problem (the domain's objects, the rules that hold between them, how they may change, and who may do what) once, and nothing more.
2. **Supply the plumbing itself.** Storage, both local and in the cloud; keeping storage, domain logic and the interface in step as any of them changes; navigation, editing, accessibility and agent access. These are the same problems in nearly every application. They belong in shared, reusable abstractions, not in each application's code.
3. **Derive the rest from the domain while the application runs.** Screens, storage formats and schemas are computed from the model, not written beside it. Because nothing is written by hand, the same model can be shown in more than one way, and where it helps, the user can choose.
4. **Make customization cost what it changes.** The default costs nothing, a different arrangement costs a hint, and custom code is needed only for what is truly unusual.

It then takes up the most natural objection, that interfaces vary too much to abstract well, and ends with questions for reviewing a change against these principles.

---

## 1. The minimum specification

Every application has a core that cannot be simplified away, what Fred Brooks called *essential complexity*. It is whatever makes a medical records system different from an invoice ledger or a tabletop campaign manager, and there is a least amount of information needed to state it. It has three parts:

1. **Structure:** the kinds of objects, their values and relationships, and the rules that must always hold between them.
2. **Behavior:** the changes that are allowed, and the calculations and rules that govern them.
3. **Policy:** what may be edited, what is shown and how prominently, and who may see or do what.

In a conventional web application, stating those three things is a small part of the code. Most of the rest restates them in other forms: database schemas and migrations, data transfer types, API endpoints, client state stores, route tables, form components, validation rules, CSS selectors, accessibility attributes, and tool definitions for language models.

None of these adds meaning. Each is a translation of the domain into a form some screen, disk or network needs. And each translation written by hand has three costs:

* **More work per change.** Adding one concept to the domain means coordinated edits in several files, often in several languages.
* **Drift.** Two places that state the same fact can come to disagree.
* **Harder reading.** A reader, human or machine, has to piece the domain back together from code scattered across layers.

So the ideal environment closes the gap between an application's source and its essential specification. Each fact about the domain is stated once, in a form that runs, and the translations are derived from it.

---

## 2. Reusable abstractions for the plumbing

If the author supplies only the essentials, the environment has to supply everything else. Two questions follow: what should be shared, and how does an author change things when the default isn't right?

### 2.1 Plumbing doesn't depend on the domain

Local storage that survives a crash, cloud storage, keeping the two in sync across devices, keeping storage, domain logic and views in step whenever any of them changes, undo, localization and accessibility are all hard problems. That is exactly why each application should not solve them again. A log of changed records works the same whether the records are contacts or character sheets.

In an ideal environment, a property of a domain object states only policy: its type, whether it is saved, whether it can be edited, whether views follow it. Shared machinery tracks what changed, saves it, updates the views in batches and commits atomically. The domain says *what* is saved and observed; the environment decides *when* and *how*.

Interfaces work the same way. Moving through a graph of objects, selecting, inspecting, editing a field and fitting a small screen are the same operations whether the objects are invoices or spells. One abstraction that handles them, driven by the shape of the model, covers most of what most applications show.

### 2.2 Customization should cost what it changes

The earliest "naked objects" systems, which generated interfaces directly from domain objects, got a reputation for rigidity because of a cliff. If you accepted plain, database-style forms, you wrote no interface code. The moment you needed anything richer, you wrote all of it.

The cost of customization should instead grow with how far an interface departs from the default, the way a compressed delta grows with how much changed:

* **The default costs nothing.** Browsing from a list to its details, summary tiles, editing in place, validation messages, keyboard navigation, accessibility roles, and inspecting any object live all come without declaring a view.
* **A different arrangement costs a hint.** When part of the model reads better as one continuous document than as nested columns, or a side panel should stay docked beside navigation, the model says so with a hint, or hands its presentation to another object. No templates, no event handlers.
* **Something truly unusual costs a custom view.** When an object needs its own drawing or interaction, a custom view is attached to that kind of object, and it still takes part in the navigation, theming, change tracking and persistence around it.

### 2.3 One model, many projections

When every view is built by hand, a second way of showing the same data means building it again, so most applications offer one. When views are derived, a projection is written once and every application gets it.

So the same model can appear in more than one form. A collection can be a column of tiles, a table, a grid of cards, or one continuous document. The same application can run on a desktop, on a phone, in a terminal, or with no interface at all for an agent or a test. And where it helps, the choice can be the user's: a table to compare items, a grid to browse them, a document to read them through.

This does not undo the case for uniformity made below. Each projection is uniform in itself and works the same way for every kind of object, so what a user learns in one place still holds everywhere. What multiplies is the set of consistent views, not the number of one-off screens.

---

## 3. Uniformity is a feature

The natural objection to all this is that interfaces vary too much to abstract well: every application seems to need screens of its own. This section argues that much of that variety is not needed, and that less of it is better for users.

It is tempting to judge an environment that generates interfaces by how closely it can copy familiar, hand-built ones. That test assumes the hand-built ones are good for their users. Often they are not. Many familiar patterns come from how their builders think, what their organizations reward, or a domain model that was never properly divided up.

### 3.1 Builders know too much

The people who build an application carry its whole structure in their heads. Each area feels different to them, so they give each its own layout, its own dialogs, its own workflow.

Users are in the opposite position. They don't know the structure, and they can't afford to learn a new visual language on every screen. For them, uniformity is not a compromise made to save engineering time; it makes the application easier to use. When finding, selecting, inspecting and acting on things work the same way everywhere (say, tiles inside columns, opening to their details, collapsing predictably on a phone), moving around becomes habit. Learn one part of the application and you can find your way around the rest.

### 3.2 The first minute and the hundredth hour

Software culture tends to reward visible complexity. Custom chrome, transitions and elaborate multi-pane layouts look impressive in a demo or a design review; they are built for the first minute. A restrained, uniform interface draws almost no attention to itself. Its value shows in the hundredth hour of use, when the interface has faded from view and the user is thinking only about the task.

Treating every screen as a chance for a new design has a price. Each one handles focus, the keyboard and small screens in its own way, and each one is another thing for the user to learn. An environment that discourages this protects its users from it.

### 3.3 Don't build in the patterns you'd avoid

If an environment is judged by whether it can rebuild stacked modal dialogs, wizard carousels, improvised filter drawers and crowded dashboards, its vocabulary of annotations will grow to support all of them, though they are rarely the best answer. Annotations that choreograph layout in detail turn model classes back into view templates. The environment gets more complex, and the applications get no easier to use.

### 3.4 A uniform view tests the model

In conventional development, custom layout is often used to hide a model that is poorly divided. When one class has gathered forty loosely related properties, the interface hides the crowding behind tabs, accordions and rules about which fields appear when.

A uniform view can't hide it. It works like a wind tunnel for the domain model: if an object looks cluttered or confusing when shown the standard way, suspect how the domain is divided before suspecting the view. Splitting an overloaded object into a few coherent parts often fixes the screen, and it also gives storage a better granularity, makes each part easier to test, and makes the model easier for people and agents to understand.

### 3.5 When custom views are earned

Set aside habit, decoration and poorly divided models, and few problems still need custom interfaces. The clearest case is data with **real geometry**: spatial, graphical or temporal relationships that people take in by looking rather than by reading. A map, a 3D scene, a timeline, a page layout.

Away from real geometry, a uniform view is usually not just cheaper than a custom one. It is clearer.

---

## 4. Why this matters more with AI

Keeping the specification minimal matters more when language models help write, review and run the software.

While the application runs, an agent can work on the model with a small, fixed vocabulary: fetch a schema, apply a patch. Adding classes adds no new tools. This alone does not keep an agent's work cheap as the model grows; a larger schema still takes more reading.

The bigger effect is during development:

* **A feature fits in view.** When a feature lives in one class instead of five layers kept in step, everything that matters to it fits in what a model can attend to at once.
* **There are no seams to drift across.** Language models are good at local changes and poor at keeping unstated agreements between distant files. Remove the duplicate statements and you remove the places where those agreements break.

Language models also bring habits learned from conventional code. Asked to fix a local problem, an AI assistant will tend to reach for the usual fix: a one-off adapter, a global setting, a CSS override, a second copy of a schema. Each fix passes the test in front of it and wears the design down a little. Keeping a codebase minimal therefore means writing its principles down where people and agents will read them, and reviewing changes against them.

---

## 5. Questions for review

The principles become practical as checks that can be made against any plan or change.

### 5.1 Invariants

* **A new property is one edit.** Adding an ordinary property to an existing class (saved, editable, accessible, synced, visible to agents) should touch exactly one place: its declaration. A change that requires a second edit for every new property has leaked a translation.
* **New classes need no new agent tools.** Growing the domain model must not mean registering tools per class.
* **The model runs without an interface.** Domain objects and their persistence must run on a bare server runtime or in a test, with no reference to views or browser globals.
* **Every custom view has a reason.** A new custom view should point to real geometry, or to interaction the uniform interface cannot express, that dividing the model differently would not solve.

### 5.2 Before building a feature

Before building something non-trivial, whether a person or an AI agent proposed it, ask:

1. **Does it add work per class, or a second source of truth?** A design that needs boilerplate in every class, or a second place where a schema, a limit or a list must be kept in step by hand, is a step backward and should be redesigned.
2. **Is a request for interface hiding a problem in the model?** Before adding a layout option or a custom view, see whether splitting an overloaded object into parts solves it with nothing new at all.
3. **Does a new shared mechanism pay for itself?** A new primitive or annotation is worth adding when it removes repeated work across different applications, not when it encodes one application's policy.

---

## 6. What it costs

Removing the restatements does not make the domain any easier, and it is not free. Three tensions call for judgment.

**Hints can turn into view code.** If annotations multiply to control the details of layout, domain classes stop reading as descriptions of the domain and become configuration tables. The interface code has only moved onto the model. Hints should stay few, broad, and about meaning rather than appearance.

**Departing from convention makes it unfamiliar.** An environment that derives what other tools have people write by hand works differently from what newcomers know, and their experience transfers only partly. Its documentation, for people and for machines, has to make up the difference, so it has to be complete and current.

**Principles don't replace taste.** Whether a workflow calls for dividing the model differently, a presentation hint, or a custom view is still a judgment about people and systems. What first principles offer is a shared direction: as features accumulate, and as AI writes more of the code, the application moves toward its essential specification and not away from it.
