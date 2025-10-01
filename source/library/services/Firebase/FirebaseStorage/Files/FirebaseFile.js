"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirebaseFile
 * @extends FirebaseNode
 * @classdesc Represents a file stored in Firebase Storage
 *
 * This class represents an individual file in Firebase Storage with its metadata.
 * It provides methods to download, delete, and update the file.
 */
(class FirebaseFile extends FirebaseNode {

    initPrototypeSlots () {

        {
            const slot = this.overrideSlot("name", null);
            slot.setIsSubnodeField(true);
        }

        // Time created
        {
            const slot = this.newSlot("timeCreated", null);
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // Last updated
        {
            const slot = this.newSlot("updated", null);
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // File size in bytes
        {
            const slot = this.newSlot("size", 0);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // Content type (MIME type)
        {
            const slot = this.newSlot("contentType", null);
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // Custom metadata
        {
            const slot = this.newSlot("customMetadata", null);
            slot.setSlotType("Object");
            slot.setShouldStoreSlot(true);
        }

        // Download URL (cached)
        {
            const slot = this.newSlot("downloadUrl", null);
            slot.setSlotType("String");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
        }

        // ArrayBuffer data (for upload or after download)
        {
            const slot = this.newSlot("dataArrayBuffer", null);
            slot.setSlotType("ArrayBuffer");
            slot.setShouldStoreSlot(false);
        }

        // Upload action
        {
            const slot = this.newSlot("uploadAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Upload");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncUpload");
        }

        // Download action
        {
            const slot = this.newSlot("downloadAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Download");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncDownload");
        }

        // Delete action
        {
            const slot = this.newSlot("deleteAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Delete");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncDelete");
        }

    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
    }

    /**
     * @description Sets file properties from Firebase Storage itemRef
     * @param {Object} itemRef - Firebase Storage reference
     * @returns {Promise<FirebaseFile>} This instance for chaining
     * @category Helper
     */
    async setItemRef (itemRef) {
        const metadata = await itemRef.getMetadata();
        this.setName(itemRef.name);
        this.setTimeCreated(metadata.timeCreated);
        this.setUpdated(metadata.updated);
        this.setSize(metadata.size);
        this.setContentType(metadata.contentType);
        this.setCustomMetadata(metadata.customMetadata || {});
        return this;
    }

    /**
     * @description Gets action info for upload action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    uploadActionInfo () {
        return {
            isEnabled: this.dataArrayBuffer() !== null,
            title: this.dataArrayBuffer() ? "Upload to Firebase" : "No data to upload"
        };
    }

    /**
     * @description Gets action info for download action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    downloadActionInfo () {
        return {
            isEnabled: true,
            title: this.isDownloaded() ? "Re-download from Firebase" : "Download from Firebase"
        };
    }

    /**
     * @description Gets action info for delete action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    deleteActionInfo () {
        return {
            isEnabled: this.parentNode() !== null,
            title: this.parentNode() ? "Delete from Firebase" : "Cannot delete (no parent)"
        };
    }

    /**
     * @description Gets the title for display
     * @returns {string} The file name
     * @category Display
     */
    title () {
        return this.name();
    }

    /**
     * @description Gets the subtitle for display
     * @returns {string} Formatted file size and type
     * @category Display
     */
    subtitle () {
        const size = this.humanReadableSize();
        const type = this.contentType() || "unknown type";
        return `${size} - ${type}`;
    }

    /**
     * @description Converts file size to human-readable format
     * @returns {string} Formatted size (e.g., "1.2 MB")
     * @category Helper
     */
    humanReadableSize () {
        const bytes = this.size();
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    /**
     * @description Checks if the file data has been downloaded
     * @returns {boolean} True if file data is available locally
     * @category Helper
     */
    isDownloaded () {
        return this.dataArrayBuffer() !== null;
    }

    /**
     * @description Checks if the file exists on Firebase Storage
     * Uses getDownloadURL() which may propagate faster than getMetadata()
     * @returns {Promise<boolean>} True if file exists on server
     * @category Helper
     */
    async asyncDoesExist () {
        // If file has no parent, it can't exist on Firebase
        if (!this.parentNode()) {
            return false;
        }

        try {
            const ref = this.storageRef();
            await ref.getDownloadURL();
            return true;
        } catch (error) {
            // Both "not found" and "unauthorized" mean the file doesn't exist for our purposes
            if (error.code === "storage/object-not-found" || error.code === "storage/unauthorized") {
                return false;
            }
            // Re-throw unexpected errors
            throw error;
        }
    }

    /**
     * @description Checks if local metadata matches the version on Firebase
     * @returns {Promise<boolean>} True if local version matches server version
     * @category Helper
     */
    async isSameAsServer () {
        try {
            const ref = this.storageRef();
            const serverMetadata = await ref.getMetadata();

            // Compare updated timestamp and size
            return this.updated() === serverMetadata.updated &&
                   this.size() === serverMetadata.size;
        } catch (error) {
            console.error("Error checking if file matches server:", error);
            return false;
        }
    }


    /**
     * @description Gets the download URL for this blob
     * @returns {Promise<string>} Download URL
     * @category Storage Operations
     */
    async getDownloadUrl () {
        if (this.downloadUrl()) {
            return this.downloadUrl();
        }

        try {
            const ref = this.storageRef();
            const url = await ref.getDownloadURL();
            this.setDownloadUrl(url);
            return url;
        } catch (error) {
            console.error("Error getting download URL:", error);
            throw error;
        }
    }

    setDataArrayBufferToString (string) {
        this.setContentType("text/plain");
        this.setDataArrayBuffer(string.asArrayBuffer());
        return this;
    }

    arrayBufferAsString () {
        return this.dataArrayBuffer().asString();
    }

    /**
     * @description Downloads the data from Firebase Storage as ArrayBuffer
     * @returns {Promise<ArrayBuffer>} The downloaded data as ArrayBuffer
     * @category Storage Operations
     */
    async asyncDownload () {
        try {
            this.setError(null);
            const ref = this.storageRef();

            // Get download URL and fetch the data
            const url = await ref.getDownloadURL();
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status} ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            this.setDataArrayBuffer(arrayBuffer);

            return arrayBuffer;
        } catch (error) {
            console.error("Error downloading file:", error);
            this.setError(error);
            throw error;
        }
    }

    /**
     * @description Uploads data to Firebase Storage (uses dataArrayBuffer from the object)
     * @returns {Promise<void>}
     * @category Storage Operations
     */
    async asyncUpload () {
        assert(this.parentNode(), "asyncUpload must be called on a node with a parent");
        try {
            this.setError(null);
            this.setDownloadUrl(null); // Clear cached URL before upload

            const arrayBuffer = this.dataArrayBuffer();
            if (!arrayBuffer) {
                throw new Error("No data set - use setDataArrayBuffer() before uploading");
            }

            const ref = this.storageRef();

            // Prepare upload metadata
            const uploadMetadata = {
                contentType: this.contentType() || "application/octet-stream",
                customMetadata: this.customMetadata() || {}
            };

            // Add current user info if available
            if (typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser) {
                const user = firebase.auth().currentUser;
                uploadMetadata.customMetadata.uploadedBy = user.uid;
                uploadMetadata.customMetadata.uploadedAt = new Date().toISOString();
            }

            // Set local metadata immediately (will be updated with server values after upload)
            this.setContentType(uploadMetadata.contentType);
            this.setCustomMetadata(uploadMetadata.customMetadata);
            this.setSize(arrayBuffer.byteLength);

            // Convert ArrayBuffer to Blob for Firebase upload (browser-only)
            const blob = arrayBuffer.toBlob(uploadMetadata.contentType);

            // Perform upload
            const uploadTask = ref.put(blob, uploadMetadata);

            // Monitor progress
            return new Promise((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`Upload progress for ${this.name()}: ${progress.toFixed(2)}%`);
                    },
                    (error) => {
                        console.error("Upload error:", error);
                        this.setError(error);
                        reject(error);
                    },
                    async () => {
                        // Upload completed successfully
                        console.log(`Upload completed for ${this.name()}`);

                        // do this to unsure the file is uploaded before we download the metadata or return from the upload method
                        const url = await ref.getDownloadURL();
                        this.setDownloadUrl(url);

                        // Download metadata from server - to ensure we are in sync
                        await this.asyncDownloadMetadata();
                        resolve();
                    }
                );
            });
        } catch (error) {
            console.error("Error uploading blob:", error);
            this.setError(error);
            throw error;
        }
    }

    /**
     * @description Sets the dataArrayBuffer from a data URL string
     * @param {string} dataUrl - The data URL to convert to ArrayBuffer
     * @returns {Promise<void>}
     * @category Helper
     */
    async asyncSetDataArrayBufferFromDataUrl (dataUrl) {
        try {
            this.setError(null);
            const arrayBuffer = await ArrayBuffer.asyncFromDataUrlString(dataUrl);
            this.setDataArrayBuffer(arrayBuffer);
        } catch (error) {
            console.error("Error setting dataArrayBuffer from data URL:", error);
            this.setError(error);
            throw error;
        }
    }

    /**
     * @description Deletes this blob from Firebase Storage
     * @returns {Promise<void>}
     * @category Storage Operations
     */
    async asyncDelete () {
        try {
            this.setError(null);

            // Delete from storage
            const ref = this.storageRef();
            await ref.delete();

            // Clear local data
            this.setDataArrayBuffer(null);
            this.setDownloadUrl(null);

            // Remove from parent after delete completes
            const parent = this.parentNode();
            if (parent && parent.removeSubnode) {
                parent.removeSubnode(this);
            }
        } catch (error) {
            console.error("Error deleting blob:", error);
            this.setError(error);
            throw error;
        }
    }

    /**
     * @description Downloads metadata from Firebase Storage and updates local properties
     * @returns {Promise<void>}
     * @category Storage Operations
     */
    async asyncDownloadMetadata () {
        try {
            this.setError(null);
            const ref = this.storageRef();
            const metadata = await ref.getMetadata();

            this.setTimeCreated(metadata.timeCreated);
            this.setUpdated(metadata.updated);
            this.setSize(metadata.size);
            this.setContentType(metadata.contentType);
            this.setCustomMetadata(metadata.customMetadata || {});
        } catch (error) {
            console.error("Error downloading metadata:", error);
            this.setError(error);
            throw error;
        }
    }

}.initThisClass());
