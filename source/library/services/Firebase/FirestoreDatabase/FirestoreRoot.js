"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirestoreRoot
 * @extends SvSummaryNode
 * @classdesc Root node for Firestore Database hierarchy
 *
 * This is a UI organizational node that contains top-level collections.
 * It doesn't correspond to any Firestore API concept - it's just a container
 * for organizing the collection browser.
 */
(class FirestoreRoot extends SvSummaryNode {

    initPrototypeSlots () {

        // Add collection action
        {
            const slot = this.newSlot("addCollectionAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Add Collection");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("addCollection");
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([FirestoreCollection]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(false);
        this.setTitle("Firestore Root");
    }

    /**
     * @description Gets the subtitle for display
     * @returns {string} Count of collections
     * @category Display
     */
    subtitle () {
        const count = this.collections().length;
        return `${count} collection${count !== 1 ? "s" : ""}`;
    }

    /**
     * @description Gets all top-level collections
     * @returns {Array<FirestoreCollection>} Array of collections
     * @category Query
     */
    collections () {
        return this.subnodes().filter(node => node.svType() === "FirestoreCollection");
    }

    /**
     * @description Finds a collection by name
     * @param {string} name - The collection name to find
     * @returns {FirestoreCollection|null} The found collection or null
     * @category Query
     */
    collectionNamed (name) {
        return this.collections().find(col => col.name() === name);
    }

    /**
     * @description Gets or creates a collection by name
     * @param {string} name - The collection name
     * @returns {FirestoreCollection} The found or created collection
     * @category Helper
     */
    collectionNamedCreateIfAbsent (name) {
        let col = this.collectionNamed(name);
        if (!col) {
            col = FirestoreCollection.clone();
            col.setName(name);
            this.addSubnode(col);
        }
        return col;
    }

    /**
     * @description Adds a new collection with generated name
     * @returns {FirestoreCollection} The new collection
     * @category Actions
     */
    addCollection () {
        const name = `collection_${Date.now()}`;
        return this.collectionNamedCreateIfAbsent(name);
    }

    /**
     * @description Gets action info for add collection action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    addCollectionActionInfo () {
        return {
            isEnabled: true,
            title: "Add New Collection"
        };
    }

}.initThisClass());
