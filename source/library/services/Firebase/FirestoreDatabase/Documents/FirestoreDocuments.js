"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirestoreDocuments
 * @extends SvJsonArrayNode
 * @classdesc Collection of Firestore documents for testing and management
 *
 */
(class FirestoreDocuments extends SvSummaryNode {

    initPrototypeSlots () {
        // Refresh action
        {
            const slot = this.newSlot("refreshAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Refresh from Firestore");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(false);
            slot.setCanInspect(true);
            slot.setActionMethodName("asyncRefresh");
        }

        // Add test document action
        {
            const slot = this.newSlot("addTestDocument", null);
            slot.setInspectorPath("");
            slot.setLabel("Add Test Document");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setActionMethodName("addTestDocument");
            slot.setCanInspect(true);
        }

        // Clear all action
        {
            const slot = this.newSlot("clearAllAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Clear All Documents");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setActionMethodName("clearAllDocuments");
            slot.setCanInspect(true);
        }
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
        this.setSubnodeClasses([FirestoreDocument]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(false);
        this.setNodeCanEditTitle(false);
        this.setTitle("Documents");
        this.setNodeFillsRemainingWidth(false);
        this.setNoteIsSubnodeCount(true);
    }

    finalInit () {
        super.finalInit();
        this.setTitle("Documents");
    }

    /**
     * @description Adds a test image with sample data
     * @returns {FirestoreImage} The new image
     * @category Actions
     */
    addTestDocument () {
        this.asyncAtPutDocument(`TestDocuments/${Date.now()}`, "{\"test\": \"test\"}");
    }


    /**
     * @description Clears all documents from the collection
     * @category Actions
     */
    async clearAllDocuments () {
        await this.documents().promiseParallelForEach(async document => {
            await document.asyncDelete();
        });
    }

    /**
     * @description Refreshes documents from Firestore (fetches from parent collection)
     * @returns {Promise<void>}
     * @category Firestore Operations
     */
    async asyncRefresh () {
        const parent = this.ownerNode();
        if (!parent || !parent.path) {
            throw new Error("FirestoreDocuments must have a FirestoreCollection parent to refresh");
        }

        const collectionPath = parent.path();
        if (!collectionPath) {
            throw new Error("No collection path - check parent collection name is set");
        }

        const db = parent.getFirestoreDb();

        // Get all documents in the collection
        const snapshot = await db.collection(collectionPath).get();

        // Get server document IDs
        const serverDocIds = new Set();
        snapshot.forEach(doc => {
            serverDocIds.add(doc.id);
        });

        // Remove documents not found on server
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
            let doc = this.documentWithDocId(docId);

            if (!doc) {
                // Create new document node
                doc = this.documentWithDocIdCreateIfAbsent(docId);
            }

            // Update document content
            const data = docSnap.data();
            doc.setContent(data);

            // Update timestamp
            if (docSnap.updateTime) {
                doc.setUpdateTimeMillis(docSnap.updateTime.toMillis());
            }
        });
    }

    documents () {
        return this.subnodes();
    }

    /**
     * @description Finds a document by doc ID
     * @param {string} docId - The document ID to find
     * @returns {FirestoreDocument|null} The found document or null
     * @category Query
     */
    documentWithDocId (docId) {
        return this.subnodes().find(document => document.docId() === docId);
    }

    /**
     * @description Gets or creates a document by doc ID
     * @param {string} docId - The document ID
     * @returns {FirestoreDocument} The found or created document
     * @category Helper
     */
    documentWithDocIdCreateIfAbsent (docId) {
        let doc = this.documentWithDocId(docId);
        if (!doc) {
            doc = FirestoreDocument.clone();

            // Build path from parent (could be collection or query)
            const parent = this.ownerNode();

            // If parent is a query, get the collection from the query's parent
            let collection = parent;
            if (parent && parent.isKindOf(FirestoreQuery)) {
                collection = parent.ownerNode();
            }

            if (collection && collection.isKindOf(FirestoreCollection)) {
                const collectionPath = collection.path();
                doc.setPath(`${collectionPath}/${docId}`);
            }

            this.addSubnode(doc);
        }
        return doc;
    }

    documentWithStoragePath (storagePath) {
        return this.subnodes().find(document => document.storagePath() === storagePath);
    }

    async asyncAtPutDocument (storagePath, jsonContent) {
        const doc  = this.documentWithStoragePath(storagePath);
        if (doc) {
            doc.setContent(jsonContent);
            await doc.asyncUpload();
            return doc;
        } else {
            const newDoc = FirestoreDocument.clone();
            newDoc.setStoragePath(storagePath);
            newDoc.setContent(jsonContent);
            this.addSubnode(newDoc);
            await newDoc.asyncUpload();
            return newDoc;
        }
    }

    async asyncAtGetDocument (storagePath) {
        const doc = this.documentWithStoragePath(storagePath);
        if (doc) {
            return doc.asJson();
        } else {
            return null;
        }
    }

    /**
     * @description Gets action info for refresh action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    refreshActionInfo () {
        const parent = this.parentNode();
        const hasParent = parent && parent.isKindOf(FirestoreCollection);
        const hasName = hasParent && parent.name();
        return {
            isEnabled: hasParent && hasName,
            title: hasName ? "Refresh from Firestore" : "No parent collection"
        };
    }

}.initThisClass());
