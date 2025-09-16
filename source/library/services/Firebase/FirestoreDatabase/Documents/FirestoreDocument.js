"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirestoreDocument
 * @extends SvStorableNode
 * @classdesc Represents a document stored in Firebase Firebase
 * 
 * FirestoreDatabase records
 * 
 */
(class FirestoreDocument extends SvSummaryNode {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("storagePath", null);
            slot.setDescription("Firestore document path (collection/docId)");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
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

        // Error message
        {
            const slot = this.newSlot("error", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(false);
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
        this.setShouldStoreSubnodes(false);
        this.setNodeCanAddSubnode(false);
        this.setCanDelete(true);
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
     * @description Gets the title for this image
     * @returns {string} The title
     * @category UI
     */
    title () {
        return this.storagePath();
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
     * @description Uploads the image to Firebase Storage via AccountServer
     * @returns {Promise<void>}
     * @category Upload
     */
    async asyncUpload () {
        try {
            this.setError("");
            this.setUploadStatus("preparing upload...");

            // Ensure Firestore web client is available
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                throw new Error("Firebase Firestore web client not available");
            }

            // Connect to Firestore
            const db = firebase.firestore();

            // In local development, attempt to use the emulator if available
            try {
                const h = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
                const isLocal = ['localhost', '127.0.0.1', '::1'].includes(h) || h.endsWith('.local') || h.endsWith('.test');
                if (isLocal) {
                    // Guard to avoid reconfiguring emulator repeatedly
                    if (!window.__uo_firestore_emulator_configured__) {
                        if (typeof db.useEmulator === 'function') {
                            db.useEmulator('localhost', 8080);
                        } else if (typeof db.settings === 'function') {
                            db.settings({ host: 'localhost:8080', ssl: false });
                        }
                        window.__uo_firestore_emulator_configured__ = true;
                    }
                }
            } catch (e) {
                // Non-fatal; continue with default config
                console.warn("Firestore emulator configuration failed (non-fatal):", e);
            }

            // Parse content from JSON string or accept object directly
            const rawContent = this.content();
            let data;
            if (rawContent == null) {
                throw new Error("No content provided to upload");
            }
            if (typeof rawContent === 'string') {
                try {
                    data = JSON.parse(rawContent);
                } catch (e) {
                    throw new Error("Content is not valid JSON: " + e.message);
                }
            } else if (typeof rawContent === 'object') {
                data = rawContent;
            } else {
                throw new Error("Unsupported content type: " + (typeof rawContent));
            }

            // Determine target document path
            let path = this.storagePath();
            if (!path || typeof path !== 'string' || path.trim() === '') {
                // Provide a reasonable default path if none is provided
                path = `TestDocuments/${Date.now()}`;
                this.setStoragePath(path);
            }

            // Firestore requires an even number of segments for document paths
            const segments = path.split('/').filter(Boolean);
            if (segments.length % 2 !== 0) {
                // If a collection path was given, append a generated id
                path = path.endsWith('/') ? path + Date.now() : `${path}/${Date.now()}`;
                this.setStoragePath(path);
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

            if (typeof firebase === 'undefined' || !firebase.firestore) {
                throw new Error("Firebase Firestore web client not available");
            }

            const path = this.storagePath();
            if (!path) {
                throw new Error("No storagePath set for document");
            }

            const db = firebase.firestore();
            // Ensure emulator in dev before operation
            try {
                const h = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
                const isLocal = ['localhost', '127.0.0.1', '::1'].includes(h) || h.endsWith('.local') || h.endsWith('.test');
                if (isLocal && !window.__uo_firestore_emulator_configured__) {
                    if (typeof db.useEmulator === 'function') {
                        db.useEmulator('localhost', 8080);
                    } else if (typeof db.settings === 'function') {
                        db.settings({ host: 'localhost:8080', ssl: false });
                    }
                    window.__uo_firestore_emulator_configured__ = true;
                }
            } catch (e) {
                console.error("FirestoreDocument.asyncDelete: Error configuring emulator:", e);
            }
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

            if (typeof firebase === 'undefined' || !firebase.firestore) {
                throw new Error("Firebase Firestore web client not available");
            }

            const path = this.storagePath();
            if (!path) {
                throw new Error("No storagePath set for document");
            }

            const db = firebase.firestore();
            // Ensure emulator in dev before operation
            try {
                const h = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
                const isLocal = ['localhost', '127.0.0.1', '::1'].includes(h) || h.endsWith('.local') || h.endsWith('.test');
                if (isLocal && !window.__uo_firestore_emulator_configured__) {
                    if (typeof db.useEmulator === 'function') {
                        db.useEmulator('localhost', 8080);
                    } else if (typeof db.settings === 'function') {
                        db.settings({ host: 'localhost:8080', ssl: false });
                    }
                    window.__uo_firestore_emulator_configured__ = true;
                }
            } catch (e) {
                console.error("FirestoreDocument.asyncDownload: Error configuring emulator:", e);
            }
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
        const db = firebase.firestore();
        const docRef = db.doc(this.storagePath());
        
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
