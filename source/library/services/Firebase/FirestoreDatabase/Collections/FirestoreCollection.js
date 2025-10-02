"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirestoreCollection
 * @extends FirestoreNode
 * @classdesc Represents a collection in Firestore Database
 *
 * This class represents a collection in Firestore. Its subnodes are
 * FirestoreDocument instances representing the documents in the collection.
 *
 * Example collection paths:
 * - "users"
 * - "posts"
 * - "users/{userId}/posts" (subcollection)
 */
(class FirestoreCollection extends FirestoreNode {

    initPrototypeSlots () {

        // Documents container (simple view of all documents)
        {
            const slot = this.newSlot("documents", null);
            slot.setFinalInitProto(FirestoreDocuments);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setSlotType("FirestoreDocuments");
        }

        // Query (for searches with limit, orderBy, filtering, pagination)
        {
            const slot = this.newSlot("query", null);
            slot.setFinalInitProto(FirestoreQuery);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setSlotType("FirestoreQuery");
        }

        // Whether contents have been loaded
        {
            const slot = this.newSlot("isLoaded", false);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(false);
        }

        // List documents action
        {
            const slot = this.newSlot("listDocumentsAction", null);
            slot.setInspectorPath("");
            slot.setLabel("List Documents");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncListDocuments");
        }

        // Add document action
        {
            const slot = this.newSlot("addDocumentAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Add Document");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("addDocument");
        }
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanAddSubnode(false);
        this.setNodeCanReorderSubnodes(false);
    }

    /**
     * @description Gets the title for display
     * @returns {string} The collection name
     * @category Display
     */
    title () {
        return this.name() || "Unnamed Collection";
    }

    /**
     * @description Gets the subtitle for display
     * @returns {string} Count of documents
     * @category Display
     */
    subtitle () {
        if (this.error()) {
            return `Error: ${this.error()}`;
        }

        const count = this.documents().documents().length;
        const status = this.isLoaded() ? "" : " (not loaded)";
        return `${count} document${count !== 1 ? "s" : ""}${status}`;
    }

    didUpdateSlotPath (oldPath, newPath) {
        //this.documents().setPath(newPath);
        this.query().setPath(newPath);
    }

    /**
     * @description Finds a document by ID (delegates to documents container)
     * @param {string} docId - The document ID to find
     * @returns {FirestoreDocument|null} The found document or null
     * @category Query
     */
    documentWithId (docId) {
        return this.documents().documentWithDocId(docId);
    }

    /**
     * @description Gets or creates a document by ID (delegates to documents container)
     * @param {string} docId - The document ID
     * @returns {FirestoreDocument} The found or created document
     * @category Helper
     */
    documentWithIdCreateIfAbsent (docId) {
        return this.documents().documentWithDocIdCreateIfAbsent(docId);
    }

    /**
     * @description Lists all documents in this collection from Firestore (delegates to documents container)
     * @returns {Promise<void>}
     * @category Firestore Operations
     */
    async asyncListDocuments () {
        try {
            this.setError(null);
            await this.documents().asyncRefresh();
            this.setIsLoaded(true);
        } catch (error) {
            const collectionPath = this.path();
            console.error(`Error listing documents for ${collectionPath}:`, error);
            this.setError(error.message || String(error));
            throw error;
        }
    }

    /**
     * @description Adds a new document with generated ID
     * @returns {FirestoreDocument} The new document
     * @category Actions
     */
    addDocument () {
        const docId = `doc_${Date.now()}`;
        const doc = this.documentWithIdCreateIfAbsent(docId);
        doc.setContent({ created: new Date().toISOString() });
        return doc;
    }

    /**
     * @description Gets action info for list documents action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    listDocumentsActionInfo () {
        const hasPath = this.path() !== null && this.path() !== "";
        return {
            isEnabled: hasPath,
            title: hasPath
                ? (this.isLoaded() ? "Refresh Documents" : "Load Documents")
                : "No collection path set"
        };
    }

    /**
     * @description Gets action info for add document action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    addDocumentActionInfo () {
        const hasPath = this.path() !== null && this.path() !== "";
        const subtitle = !hasPath ? "No collection path set" : "";
        return {
            isEnabled: hasPath,
            title: "Add New Document",
            subtitle: subtitle
        };
    }

}.initThisClass());
