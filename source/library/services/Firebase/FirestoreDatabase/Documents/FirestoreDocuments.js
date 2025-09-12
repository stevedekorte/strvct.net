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
        // Add image action
        {
            const slot = this.newSlot("addTestDocument", null);
            slot.setInspectorPath("");
            slot.setLabel("Add Test Document");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            //slot.setIsSubnodeField(true);
            slot.setActionMethodName("addTestDocument");
        }

        // Clear all action
        {
            const slot = this.newSlot("clearAllAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Clear All Documents");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            //slot.setIsSubnodeField(true);
            slot.setActionMethodName("clearAllDocuments");
        }

    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([FirestoreDocument]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
        this.setNodeCanEditTitle(false);
        this.setTitle("Firestore Documents");
        this.setSubtitle("Test image uploads");
        this.setNodeFillsRemainingWidth(false);
    }

    finalInit () {
        super.finalInit();
        this.setTitle("Firestore Documents");
    }

    /**
     * @description Gets the subtitle showing image counts
     * @returns {string} The subtitle
     * @category UI
     */
    subtitle () {
        return "document database";
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
     * @description Clears all images from the collection
     * @category Actions
     */
    async clearAllDocuments () {
        await this.documents().promiseParallelForEach(async document => {
            await document.asyncDelete();
        });
    }

    documents () {
        return this.subnodes();
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

}.initThisClass());
