"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirestoreDocument
 * @extends FirestoreNode
 * @classdesc Represents a Document stored in Firestore Database.
 *
 */
(class FirestoreDocument extends FirestoreNode {

    initPrototypeSlots () {

        // Subcollections container
        {
            const slot = this.newSlot("subcollections", null);
            slot.setFinalInitProto("FirestoreCollections");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

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
            slot.setActionMethodName("asyncUpload");
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
            slot.setActionMethodName("asyncDelete");
        }

        // Test download action
        {
            const slot = this.newSlot("downloadAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Test Download");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncDownload");
        }
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanAddSubnode(false);
        this.setNodeCanReorderSubnodes(false);
        this.setCanDelete(true);
    }

    /**
     * @description Gets the document ID (alias for name)
     * @returns {string} The document ID (last segment of path)
     * @category Firestore
     */
    docId () {
        return this.name();
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
        return this.docId() || "Unnamed Document";
    }

    /**
     * @description Gets the subtitle for this image
     * @returns {string} The subtitle
     * @category UI
     */
    subtitle () {
        const lines = ["Document"];

        if (this.error()) {
            lines.push("Error: " + this.error());
        }

        if (this.uploadStatus()) {
            lines.push("Upload Status: " + this.uploadStatus());
        }

        if (this.updateTimeMillis()) {
            lines.push("Update Time: " + this.updateTimeMillis());
        }

        return lines.join("\n");
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

            // Sync cloudPath after successful upload
            this.syncCloudPath();

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
     * @description Finds a subcollection by name (delegates to subcollections container)
     * @param {string} name - The subcollection name to find
     * @returns {FirestoreCollection|null} The found subcollection or null
     * @category Query
     */
    subcollectionNamed (name) {
        return this.subcollections().collectionNamed(name);
    }

    /**
     * @description Gets or creates a subcollection by name (delegates to subcollections container)
     * @param {string} name - The subcollection name
     * @returns {FirestoreCollection} The found or created subcollection
     * @category Helper
     */
    subcollectionNamedCreateIfAbsent (name) {
        return this.subcollections().collectionNamedCreateIfAbsent(name);
    }

    // --- Migration ---

    /**
     * @description Migrates this document from cloudPath to current path()
     * Uses two-phase approach: copy all first, then delete all
     * @returns {Promise<void>}
     * @category Migration
     */
    async asyncMigrate () {
        const oldPath = this.cloudPath();
        const newPath = this.path();

        if (!oldPath) {
            throw new Error("Document has no cloudPath - nothing to migrate");
        }

        if (oldPath === newPath) {
            throw new Error("Paths are the same - no migration needed");
        }

        try {
            this.setError("");
            this.setUploadStatus("migrating document...");

            // Phase 1: Copy this document and all subcollections to new paths
            this.setUploadStatus("copying to new path...");
            await this.asyncMigrateCopy();

            // Phase 2: Delete this document and all subcollections from old paths
            this.setUploadStatus("deleting old data...");
            await this.asyncMigrateDelete();

            // Update cloudPath
            this.syncCloudPath();

            this.setUploadStatus("migration completed successfully");
        } catch (error) {
            console.error("FirestoreDocument.asyncMigrate failed:", error);
            this.setError(error.message || String(error));
            this.setUploadStatus("migration failed");
            throw error;
        }
    }

    /**
     * @description Phase 1: Copy document data to new path, recursively copy subcollections
     * @returns {Promise<void>}
     * @category Migration
     */
    async asyncMigrateCopy () {
        const oldPath = this.cloudPath();
        const newPath = this.path();
        const db = this.getFirestoreDb();

        // Copy this document's data
        const oldDocSnap = await db.doc(oldPath).get();
        if (!oldDocSnap.exists) {
            throw new Error("Document does not exist at old path: " + oldPath);
        }
        await db.doc(newPath).set(oldDocSnap.data(), { merge: false });

        // Update subcollection basePaths and copy them in parallel
        const subcollections = this.subcollections().collections();
        for (const subcollection of subcollections) {
            subcollection.setBasePath(newPath);
        }

        const copyPromises = subcollections
            .filter(sc => sc.existsInCloud())
            .map(sc => sc.asyncMigrateCopy());

        await Promise.all(copyPromises);
    }

    /**
     * @description Phase 2: Delete document from old path, recursively delete subcollections
     * @returns {Promise<void>}
     * @category Migration
     */
    async asyncMigrateDelete () {
        const oldPath = this.cloudPath();
        const db = this.getFirestoreDb();

        // Delete subcollections from old paths in parallel
        const subcollections = this.subcollections().collections();
        const deletePromises = subcollections
            .filter(sc => sc.existsInCloud())
            .map(sc => sc.asyncMigrateDelete());

        await Promise.all(deletePromises);

        // Delete this document from old path
        await db.doc(oldPath).delete();

        // Update subcollection cloudPaths
        for (const subcollection of subcollections) {
            subcollection.syncCloudPath();
        }
    }

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
    downloadActionInfo () {
        return {
            isEnabled: true,
            isVisible: true
        };
    }

}.initThisClass());
