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
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
        this.setSubnodeClasses(["FirestoreCollection"]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(false);
        this.setTitle("root");
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
        return this.subnodes();
    }

    /**
     * @description Finds a collection by path
     * @param {string} path - The collection path to find
     * @returns {FirestoreCollection|null} The found collection or null
     * @category Query
     */
    collectionWithPath (path) {
        return this.collections().find(col => col.path() === path);
    }

    /**
     * @description Gets or creates a collection by path
     * @param {string} path - The collection path
     * @returns {FirestoreCollection} The found or created collection
     * @category Helper
     */
    collectionWithPathCreateIfAbsent (path) {
        let col = this.collectionWithPath(path);
        if (!col) {
            col = FirestoreCollection.clone();
            col.setPath(path);
            this.addSubnode(col);
        }
        return col;
    }


}.initThisClass());
