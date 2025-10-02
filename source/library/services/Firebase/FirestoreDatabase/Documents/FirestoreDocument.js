"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirestoreDocument
 * @extends FirestoreNode
 * @classdesc Represents a document stored in Firebase Firebase
 *
 * FirestoreDatabase records
 *
 */
(class FirestoreDocument extends FirestoreNode {

    initPrototypeSlots () {

        // Content
        {
            const slot = this.newSlot("content", null);
            slot.setSlotType("Object");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(false);
        }

        {
            const slot = this.newSlot("contentString", null); // pass through to content value
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
        }

        {
            const slot = this.newSlot("updateTimeMillis", 0);
            slot.setDescription("Timestamp of last update in milliseconds since epoch");
            slot.setSlotType("Number");
            slot.setAllowsNullValue(false);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
        }

        // Upload status
        {
            const slot = this.newSlot("uploadStatus", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // Upload action
        {
            const slot = this.newSlot("uploadAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Upload to Firebase");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("uploadToFirebase");
        }

        // Delete action
        {
            const slot = this.newSlot("deleteAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Delete from Firebase");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("deleteFromFirebase");
        }

        // Test download action
        {
            const slot = this.newSlot("testDownloadAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Test Download");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("testDownload");
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([FirestoreCollection]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(false);
        this.setCanDelete(true);
    }

    /**
     * @description Gets the document ID (alias for name)
     * @returns {string} The document ID
     * @category Firestore
     */
    docId () {
        return this.name();
    }

    /**
     * @description Sets the document ID (alias for setName)
     * @param {string} id - The document ID
     * @returns {FirestoreDocument} This document for chaining
     * @category Firestore
     */
    setDocId (id) {
        return this.setName(id);
    }

    contentString () {
        return JSON.stringify(this.content(), null, 2);
    }

    setContentString (value) {
        try {
            if (value == null) {
                return this;
            }
            const jsonContent = JSON.parse(value);
            this.setContent(jsonContent);
        } catch (e) {
            console.error("FirestoreDocument.setContentString: Error parsing JSON:", e);
        }
        return this;
    }

    /**
     * @description Gets the title for this document
     * @returns {string} The title
     * @category UI
     */
    title () {
        return this.name() || "Unnamed Document";
    }

    /**
     * @description Gets the subtitle for this image
     * @returns {string} The subtitle
     * @category UI
     */
    subtitle () {
        if (this.error()) {
            return "Error: " + this.error();
        }
        if (this.uploadStatus()) {
            return this.uploadStatus();
        }
        return "No image";
    }

    /**
     * @description Uploads the document content to Firestore
     * @returns {Promise<void>}
     * @category Upload
     */
    async asyncUpload () {
        try {
            this.setError("");
            this.setUploadStatus("preparing upload...");

            const db = this.getFirestoreDb();

            // Parse content from JSON string or accept object directly
            const rawContent = this.content();
            let data;
            if (rawContent == null) {
                throw new Error("No content provided to upload");
            }
            if (typeof rawContent === "string") {
                try {
                    data = JSON.parse(rawContent);
                } catch (e) {
                    throw new Error("Content is not valid JSON: " + e.message);
                }
            } else if (typeof rawContent === "object") {
                data = rawContent;
            } else {
                throw new Error("Unsupported content type: " + (typeof rawContent));
            }

            // Determine target document path from hierarchy
            const path = this.path();
            if (!path || typeof path !== "string" || path.trim() === "") {
                throw new Error("No document path - check docId and parent collection are set");
            }

            // Firestore requires an even number of segments for document paths
            const segments = path.split("/").filter(Boolean);
            if (segments.length % 2 !== 0) {
                throw new Error("Invalid document path (must be collection/docId): " + path);
            }

            this.setUploadStatus("uploading to Firestore...");

            // Write the document (replace document with provided data)
            await db.doc(path).set(data, { merge: false });

            this.setUploadStatus("uploaded successfully");
        } catch (error) {
            console.error("FirestoreDocument.asyncUpload failed:", error);
            this.setError(error.message || String(error));
            this.setUploadStatus("upload failed");
        }
    }

    /**
     * @description Deletes the image from Firebase Storage
     * @returns {Promise<void>}
     * @category Delete
     */
    async asyncDelete () {
        try {
            this.setError("");
            this.setUploadStatus("preparing delete...");

            const path = this.path();
            if (!path) {
                throw new Error("No document path - check docId and parent collection are set");
            }

            const db = this.getFirestoreDb();
            await db.doc(path).delete();

            this.setUploadStatus("deleted successfully");
        } catch (error) {
            console.error("FirestoreDocument.asyncDelete failed:", error);
            this.setError(error.message || String(error));
            this.setUploadStatus("delete failed");
        }
    }

    /**
     * @description Tests downloading the image from Firebase
     * @returns {Promise<void>}
     * @category Testing
     */
    async asyncDownload () {
        try {
            this.setError("");
            this.setUploadStatus("downloading from Firestore...");

            const path = this.path();
            if (!path) {
                throw new Error("No document path - check docId and parent collection are set");
            }

            const db = this.getFirestoreDb();
            const snap = await db.doc(path).get();
            if (!snap.exists) {
                throw new Error("Document does not exist at path: " + path);
            }

            const data = snap.data();
            // Store as JSON string for consistency with input expectations
            try {
                this.setContent(JSON.stringify(data, null, 2));
            } catch (e) {
                console.error("FirestoreDocument.asyncDownload: Error stringifying data:", e);
                // Fallback to raw object if stringification fails
                this.setContent(data);
            }

            // Update the updateTimeMillis from the document snapshot
            if (snap.updateTime) {
                this.setUpdateTimeMillis(snap.updateTime.toMillis());
            }

            this.setUploadStatus("downloaded successfully");
        } catch (error) {
            console.error("FirestoreDocument.asyncDownload failed:", error);
            this.setError(error.message || String(error));
            this.setUploadStatus("download failed");
        }
    }

    async asyncCloudUpdateTimeMillis () {
        const db = this.getFirestoreDb();
        const docRef = db.doc(this.path());

        // Use select() with empty array to fetch ONLY metadata, not document content
        const docSnapshot = await docRef.select().get();

        if (!docSnapshot.exists) {
            return 0;
        }

        const cloudUpdateTime = docSnapshot.updateTime ? docSnapshot.updateTime.toMillis() : 0;
        return cloudUpdateTime;
    }

    async asyncIsNewerThanCloud () {
        const cloudUpdateTime = await this.asyncCloudUpdateTimeMillis();
        const localUpdateTime = this.updateTimeMillis();
        return localUpdateTime > cloudUpdateTime;
    }

    /**
     * @description Gets all subcollections in this document
     * @returns {Array<FirestoreCollection>} Array of subcollections
     * @category Query
     */
    subcollections () {
        return this.subnodes().filter(node => node.svType() === "FirestoreCollection");
    }

    /**
     * @description Finds a subcollection by name
     * @param {string} name - The subcollection name to find
     * @returns {FirestoreCollection|null} The found subcollection or null
     * @category Query
     */
    subcollectionNamed (name) {
        return this.subcollections().find(col => col.name() === name);
    }

    /**
     * @description Gets or creates a subcollection by name
     * @param {string} name - The subcollection name
     * @returns {FirestoreCollection} The found or created subcollection
     * @category Helper
     */
    subcollectionNamedCreateIfAbsent (name) {
        let col = this.subcollectionNamed(name);
        if (!col) {
            col = FirestoreCollection.clone();
            col.setName(name);
            this.addSubnode(col);
        }
        return col;
    }

    // --- action wrappers ---

    // Action wrappers (match inspector action names)
    async uploadToFirebase () { return this.asyncUpload(); }
    async deleteFromFirebase () { return this.asyncDelete(); }
    async testDownload () { return this.asyncDownload(); }

    /**
     * @description Gets action info for upload action
     * @returns {Object} Action info
     * @category Actions
     */
    uploadActionInfo () {
        return {
            isEnabled: true,
            isVisible: true
        };
    }

    /**
     * @description Gets action info for delete action
     * @returns {Object} Action info
     * @category Actions
     */
    deleteActionInfo () {
        return {
            isEnabled: true,
            isVisible: true
        };
    }

    /**
     * @description Gets action info for test download action
     * @returns {Object} Action info
     * @category Actions
     */
    testDownloadActionInfo () {
        return {
            isEnabled: true,
            isVisible: true
        };
    }

}.initThisClass());
