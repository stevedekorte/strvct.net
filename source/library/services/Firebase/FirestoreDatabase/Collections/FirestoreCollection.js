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
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([FirestoreDocument]);
        this.setNodeCanAddSubnode(true);
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

        const count = this.documents().length;
        const status = this.isLoaded() ? "" : " (not loaded)";
        return `${count} document${count !== 1 ? "s" : ""}${status}`;
    }

    /**
     * @description Gets all documents in this collection
     * @returns {Array<FirestoreDocument>} Array of documents
     * @category Query
     */
    documents () {
        return this.subnodes().filter(node => node.svType() === "FirestoreDocument");
    }

    /**
     * @description Finds a document by ID
     * @param {string} docId - The document ID to find
     * @returns {FirestoreDocument|null} The found document or null
     * @category Query
     */
    documentWithId (docId) {
        return this.documents().find(doc => doc.docId() === docId);
    }

    /**
     * @description Gets or creates a document by ID
     * @param {string} docId - The document ID
     * @returns {FirestoreDocument} The found or created document
     * @category Helper
     */
    documentWithIdCreateIfAbsent (docId) {
        let doc = this.documentWithId(docId);
        if (!doc) {
            doc = FirestoreDocument.clone();
            doc.setDocId(docId);
            this.addSubnode(doc);
        }
        return doc;
    }

    /**
     * @description Lists all documents in this collection from Firestore
     * @returns {Promise<void>}
     * @category Firestore Operations
     */
    async asyncListDocuments () {
        try {
            this.setError(null);

            const collectionPath = this.path();
            if (!collectionPath) {
                throw new Error("No collection path - check name is set");
            }

            const db = this.getFirestoreDb();

            // Get all documents in the collection
            const snapshot = await db.collection(collectionPath).get();

            // Get server document IDs
            const serverDocIds = new Set();
            snapshot.forEach(doc => {
                serverDocIds.add(doc.id);
            });

            // Remove subnodes not found on server
            const existingDocs = this.documents().slice(); // Copy array
            for (const doc of existingDocs) {
                const docId = doc.docId();
                if (docId && !serverDocIds.has(docId)) {
                    this.removeSubnode(doc);
                }
            }

            // Add or update documents from server
            snapshot.forEach(docSnap => {
                const docId = docSnap.id;
                let doc = this.documentWithId(docId);

                if (!doc) {
                    // Create new document node
                    doc = FirestoreDocument.clone();
                    doc.setDocId(docId);
                    this.addSubnode(doc);
                }

                // Update document content
                const data = docSnap.data();
                doc.setContent(data);

                // Update timestamp
                if (docSnap.updateTime) {
                    doc.setUpdateTimeMillis(docSnap.updateTime.toMillis());
                }
            });

            this.setIsLoaded(true);
        } catch (error) {
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
        const hasName = this.name() !== null && this.name() !== "";
        return {
            isEnabled: hasName,
            title: hasName
                ? (this.isLoaded() ? "Refresh Documents" : "Load Documents")
                : "No collection name set"
        };
    }

    /**
     * @description Gets action info for add document action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    addDocumentActionInfo () {
        const hasName = this.name() !== null && this.name() !== "";
        return {
            isEnabled: hasName,
            title: hasName ? "Add New Document" : "No collection name set"
        };
    }

}.initThisClass());
