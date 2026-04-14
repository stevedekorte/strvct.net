# Example App

A complete contacts application in four classes, with zero view code.

## Overview

This walkthrough builds a working contacts app from scratch to show how the pieces of STRVCT fit together. The app lets you create contacts with name, email, phone, and notes fields — all editable, navigable, and persisted to IndexedDB automatically. The entire application is four small classes and a few configuration files.

## The Model

### Contact

A single contact with four fields. Each slot is annotated for storage and editing:

```javascript
(class Contact extends SvStorableNode {

    static jsonSchemaDescription () {
        return "A person's contact information";
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(true);
            slot.setLabel("Name");
        }
        {
            const slot = this.newSlot("email", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(true);
            slot.setLabel("Email");
        }
        {
            const slot = this.newSlot("phone", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(true);
            slot.setLabel("Phone");
        }
        {
            const slot = this.newSlot("notes", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setCanEditInspection(true);
            slot.setLabel("Notes");
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setNodeCanEditTitle(true);
        this.setTitle("New Contact");
        this.setNodeCanInspect(true);
    }

    // The tile in the contact list shows the name as title and email as subtitle
    title () {
        return this.name() || "New Contact";
    }

    subtitle () {
        return this.email();
    }

}.initThisClass());
```

That's the entire Contact class. The framework reads the slot annotations and generates:
- An editable tile in the contacts list (showing `title()` and `subtitle()`)
- An inspector view with labeled fields for each slot when you select it
- Automatic persistence to IndexedDB whenever any field changes
- Change notifications that keep the tile in sync with the field values

### Contacts

A collection that holds Contact items:

```javascript
(class Contacts extends SvJsonArrayNode {

    initPrototype () {
        this.setTitle("Contacts");
        this.setSubnodeClasses([Contact]);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
    }

}.initThisClass());
```

`setSubnodeClasses([Contact])` tells the framework what kind of objects this collection holds. `setNodeCanAddSubnode(true)` adds an "add" action to the UI. `setShouldStoreSubnodes(true)` persists the list and its contents. New contacts are created by tapping the add button — no handler code needed.

## The App

### ContactsModel

The root model node. This is the top of the object hierarchy that becomes the navigation tree:

```javascript
(class ContactsModel extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("contacts", null);
            slot.setFinalInitProto(Contacts);
            slot.setIsSubnode(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setTitle("Contacts App");
    }

}.initThisClass());
```

`setFinalInitProto(Contacts)` tells the framework to create a `Contacts` instance during initialization — but only if one wasn't already loaded from storage. This is the key mechanism that makes the three-phase lifecycle work: on first run, the `Contacts` node is created fresh; on subsequent loads, it's restored from IndexedDB with all its data intact. `setIsSubnode(true)` places it in the navigation hierarchy.

### ContactsApp

The application class — just declares which model and UI to use:

```javascript
(class ContactsApp extends SvApp {

    initPrototypeSlots () {
        {
            const slot = this.overrideSlot("model");
            slot.setSlotType("ContactsModel");
        }
    }

    initPrototype () {
        this.setName("Contacts");
    }

}.initThisClass());
```

That's the entire app class. `overrideSlot("model")` tells the base `SvApp` to use `ContactsModel` as the root. The framework handles everything else: opening the store, creating or loading the model, setting up the UI, and wiring synchronization.

## Project Files

### _imports.json

The import manifest tells the build system which files to include:

```json
[
    "Contact.js",
    "Contacts.js",
    "ContactsModel.js",
    "ContactsApp.js"
]
```

A root-level `_imports.json` would reference the framework and this app folder:

```json
[
    "strvct/_imports.json",
    "app/_imports.json"
]
```

### app.html

The HTML entry point loads the boot loader:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contacts</title>
</head>
<body>
    <script type="module" src="strvct/source/boot/SvBootLoader.js"></script>
    <script type="module">
        await SvBootLoader.asyncRun();
    </script>
</body>
</html>
```

### Build

Run the indexer to generate the content-addressable resource bundle:

```bash
node ./strvct/source/boot/index-builder/ImportsIndexer.js
```

This produces `_index.json` (metadata) and `_cam.json.zip` (compressed bundle). Serve the directory with any static file server and open `app.html`.

## What You Get

From these four classes, the framework generates:

- A navigable list of contacts with add and reorder support
- Editable inspector fields for each contact's properties
- Persistent storage — close the browser, reopen, data is still there
- Bidirectional sync — edit a field, the tile title updates; changes batch efficiently
- Keyboard navigation, breadcrumbs, and responsive column compaction
- Slide-to-delete on contacts

No view classes were written. No event handlers. No storage code. No routing. The domain model is the application.

## Adding Cloud Sync

Assuming you have a Firebase project with Storage enabled, making the contacts collection sync to the cloud is a two-line change. Replace the base class and add a folder name:

```javascript
(class Contacts extends SvSyncableArrayNode {

    initPrototype () {
        this.setTitle("Contacts");
        this.setSubnodeClasses([Contact]);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
    }

    cloudFolderName () {
        return "contacts";
    }

}.initThisClass());
```

`SvSyncableArrayNode` extends `SvJsonArrayNode` with cloud sync capabilities. The `cloudFolderName()` method tells the framework where to store this collection's data in Firebase Storage. Everything else — delta tracking, manifest management, retry with backoff, and session locking — is inherited automatically. The collection syncs when the app saves, and loads from the cloud on the next login.
