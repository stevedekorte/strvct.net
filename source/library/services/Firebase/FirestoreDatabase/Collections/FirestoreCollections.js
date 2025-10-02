"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirestoreCollections
 * @extends SvSummaryNode
 * @classdesc Collection of Firestore collections for testing and management
 *
 */
(class FirestoreCollections extends SvSummaryNode {

    initPrototypeSlots () {
        // Refresh action
        {
            const slot = this.newSlot("refreshAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Refresh All Collections");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncRefresh");
        }

        // Add collection action
        {
            const slot = this.newSlot("addTestCollection", null);
            slot.setInspectorPath("");
            slot.setLabel("Add Test Collection");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setActionMethodName("addTestCollection");
        }

        // Clear all action
        {
            const slot = this.newSlot("clearAllAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Clear All Collections");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setActionMethodName("clearAllCollections");
        }
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
        this.setSubnodeClasses([FirestoreCollection]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(false);
        this.setNodeCanEditTitle(false);
        this.setTitle("Collections");
        this.setNodeFillsRemainingWidth(false);
        this.setNoteIsSubnodeCount(true);
    }

    finalInit () {
        super.finalInit();
        this.setTitle("Firestore Collections");
    }

    /**
     * @description Gets the subtitle showing collection counts
     * @returns {string} The subtitle
     * @category UI
     */
    subtitle () {
        return "";
    }

    /**
     * @description Adds a test collection with sample name
     * @returns {FirestoreCollection} The new collection
     * @category Actions
     */
    addTestCollection () {
        const name = `TestCollection_${Date.now()}`;
        return this.collectionNamedCreateIfAbsent(name);
    }

    /**
     * @description Clears all collections from the container
     * @category Actions
     */
    clearAllCollections () {
        this.removeAllSubnodes();
    }

    /**
     * @description Refreshes all collections (lists documents for each collection)
     * Note: The Firestore client SDK cannot list collections, so this refreshes
     * the documents in each collection we already know about.
     * @returns {Promise<void>}
     * @category Firestore Operations
     */
    async asyncRefresh () {
        const collections = this.collections();
        await collections.promiseParallelForEach(async collection => {
            await collection.asyncListDocuments();
        });
    }

    /**
     * @description Gets all collections
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
        return this.subnodes().find(collection => collection.path() === path);
    }

    /**
     * @description Gets or creates a collection by name (builds full path from parent document)
     * @param {string} name - The collection name (last segment)
     * @returns {FirestoreCollection} The found or created collection
     * @category Helper
     */
    collectionNamedCreateIfAbsent (name) {
        // Build full path from parent document
        const parentDoc = this.ownerNode();
        let fullPath = name;

        if (parentDoc && parentDoc.isKindOf(FirestoreDocument)) {
            const docPath = parentDoc.path();
            if (docPath) {
                fullPath = `${docPath}/${name}`;
            }
        }

        let col = this.collectionWithPath(fullPath);
        if (!col) {
            col = FirestoreCollection.clone();
            col.setPath(fullPath);
            this.addSubnode(col);
        }
        return col;
    }

    /**
     * @description Gets action info for refresh action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    refreshActionInfo () {
        const hasCollections = this.collections().length > 0;
        return {
            isEnabled: hasCollections,
            title: hasCollections ? "Refresh All Collections" : "No collections to refresh"
        };
    }

}.initThisClass());
