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
            const slot = this.overrideSlot("name", "");
            slot.setSyncsToView(true);
            slot.setAllowsNullValue(false);
            slot.setLabel("Name");
            slot.setIsSubnodeField(true);
        }

        // Time created
        {
            const slot = this.newSlot("timeCreated", null);
            slot.setInspectorPath("Info");
            slot.setLabel("Time Created");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setSummaryFormat("key: value");
        }

        // Last updated
        {
            const slot = this.newSlot("updated", null);
            slot.setInspectorPath("Info");
            slot.setLabel("Time Updated");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setSummaryFormat("key: value");
        }

        // File size in bytes
        {
            const slot = this.newSlot("size", 0);
            slot.setInspectorPath("Info");
            slot.setLabel("Size In Bytes");
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setSummaryFormat("key: value");
        }

        // Content type (MIME type)
        /*
        {
            const validValues = this.contentCategoryValidValues();
            const slot = this.newSlot("contentCategory", validValues.first());
            slot.setAllowsNullValue(true);
            slot.setLabel("Content Category");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
            slot.setValidValues(validValues);
        }
        */

        // contentType
        {
            const slot = this.newSlot("contentType", "text/plain");
            slot.setInspectorPath("Info");
            slot.setLabel("Content Type");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setSummaryFormat("key: value");
        }

        // Custom metadata
        {
            const slot = this.newSlot("customMetadata", null);
            slot.setInspectorPath("Info");
            slot.setLabel("Custom Metadata");
            slot.setSlotType("Object");
            slot.setShouldStoreSlot(true);
        }

        // Download URL (cached)
        {
            const slot = this.newSlot("downloadUrl", null);
            slot.setInspectorPath("Info");
            slot.setCanEditInspection(false);
            slot.setLabel("Download URL");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        // Blob data (for upload or after download)
        {
            const slot = this.newSlot("blob", null);
            slot.setLabel("Blob");
            slot.setSlotType("Blob");
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(false);
        }

        {
            const slot = this.newSlot("dataUrl", null);
            slot.setIsInJsonSchema(false);
            slot.setShouldJsonArchive(true);
            slot.setLabel("Image");
            slot.setShouldStoreSlot(true);
            slot.setDuplicateOp("duplicate");
            slot.setCanEditInspection(true);
            slot.setSyncsToView(true);
            slot.setSlotType("String");
            slot.setIsSubnodeField(true); // field inspector
            slot.setIsSubnode(false);
            slot.setFieldInspectorClassName("SvImageWellField"); // field inspector view class
            // IMPORTANT: This slot should ONLY store dataURLs (data:image/...)
            // Never store external URLs here - they cause CORS issues
            // If we need external URLs (we shouldn't), use a different slot name
            slot.setDescription("Image data URL (must be data:image/... format, not external URL)");
        }

        // Upload action
        {
            const slot = this.newSlot("asyncUploadAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Upload");
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncUpload");
        }

        // Download action
        {
            const slot = this.newSlot("asyncDownloadAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Download");
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncDownload");
        }

        // Delete action
        {
            const slot = this.newSlot("asyncDeleteAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Delete");
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncDelete");
        }

        // refresh method
        {
            const slot = this.newSlot("asyncRefreshAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Refresh");
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncRefresh");
        }

        // set name to data hash action
        {
            const slot = this.newSlot("asyncSetNameToDataHashAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Set Name to Data Hash");
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncSetNameToDataHash");
        }

        // open download url in separate tab action
        {
            const slot = this.newSlot("openDownloadUrlInSeparateTabAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Open Download URL in Separate Tab");
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("openDownloadUrlInSeparateTab");
        }
    }


    /**
     * @description Returns the valid items for the content category
     * @returns {Array} The valid items
     * @category Valid Items
     */
    contentCategoryValidValues () {
        // NOTE: these categories are primarily used to determine which UI components to show for the file
        // e.g. an ImageWell, VideoWell, AudioWell, StringField, TextAreaField, etc.
        return ["text", "image", "video", "audio", "other"];
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
    }

    async didUpdateSlotDataUrl (oldValue, newValue) {
        if (newValue && this.blob() === null) {
            this.updateBlobFromDataUrl(newValue);
        }

        if (newValue) {
            const dataUrlObj = SvDataUrl.clone().setDataUrlString(newValue);
            this.setContentType(dataUrlObj.mimeType());
        } else {
            this.setContentType(null);
        }
    }

    async updateBlobFromDataUrl () {
        const blob = await Blob.asyncFromDataUrlString(this.dataUrl());
        this.setBlob(blob);
    }

    async didUpdateSlotBlob (oldValue, newValue) {
        if (newValue && this.dataUrl() === null) {
            // download set the blob, so copy it into the dataUrl *if* the data url is an image type
            await this.updateDataUrlFromBlob();
            this.setSize(newValue.size);
        }
    }

    async updateDataUrlFromBlob () {
        const dataUrlString = await this.blob().asyncToDataUrl();
        const dataUrlObj = SvDataUrl.clone().setDataUrlString(dataUrlString);
        this.setContentType(dataUrlObj.mimeType());
        //this.setContentCategory(dataUrlObj.contentCategory());

        if (dataUrlObj.isImage()) {
            this.setDataUrl(dataUrlString);
        } else {
            this.setDataUrl(null);
        }

        this.setDataUrl(dataUrlString);
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

    hasName () {
        return this.name() !== "";
    }

    hasBlob () {
        return this.blob() !== null;
    }

    canUpload () {
        return this.hasName() && this.hasBlob() && this.canWrite();
    }

    uploadIssues () {
        const issues = [];
        if (!this.fullPath()) {
            issues.push("No full path");
            return issues;
        }
        if (!this.hasName()) {
            issues.push("No name");
        }
        if (!this.hasBlob()) {
            issues.push("No blob");
        }
        if (!this.canWrite()) {
            issues.push("No write permission");
        }
        return issues;
    }

    /**
     * @description Gets action info for upload action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    asyncUploadActionInfo () {
        const canUpload = this.canUpload();
        return {
            title: "Upload",
            isEnabled: canUpload,
            subtitle: canUpload ? null : this.uploadIssues().join("\n")
        };
    }

    downloadIssues () {
        const issues = [];
        if (!this.fullPath()) {
            issues.push("No full path");
            return issues;
        }
        if (!this.canRead()) {
            issues.push("No read permission");
        }
        return issues;
    }

    /**
     * @description Gets action info for download action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    asyncDownloadActionInfo () {
        const canRead = this.canRead();
        return {
            title: "Download",
            isEnabled: canRead,
            subtitle: canRead ? null : this.downloadIssues().join("\n")
        };
    }

    deleteIssues () {
        const canWrite = this.canWrite();
        const issues = [];
        if (!this.fullPath()) {
            issues.push("No full path");
            return issues;
        }
        if (!canWrite) {
            issues.push("No write permission");
        }
        return issues;
    }

    canDelete () {
        return this.canWrite();
    }

    /**
     * @description Gets action info for delete action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    asyncDeleteActionInfo () {
        const canDelete = this.canDelete();
        return {
            title: "Delete",
            isEnabled: canDelete,
            subtitle: canDelete ? null : this.deleteIssues().join("\n")
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
        const type = this.contentType();
        return [type, size].join("\n");
    }

    /**
     * @description Converts file size to human-readable format
     * @returns {string} Formatted size (e.g., "1.2 MB")
     * @category Helper
     */
    humanReadableSize () {
        return NumberFormatter.clone().setValue(this.size()).setSignificantDigits(2).formattedValue();
    }

    /**
     * @description Checks if the file data has been downloaded
     * @returns {boolean} True if file data is available locally
     * @category Helper
     */
    isDownloaded () {
        return this.blob() !== null;
    }

    async asyncDoesExist () {
        if (!this.hasName()) {
            return false;
        }
        if (!this.fullPath()) {
            return false;
        }
        const url = await this.asyncRefreshDownloadUrl();
        return url !== null;
    }

    /**
     * @description Checks if the file exists on Firebase Storage
     * Uses getDownloadURL() which may propagate faster than getMetadata()
     * @returns {Promise<boolean>} True if file exists on server
     * @category Helper
     */
    async asyncRefreshDownloadUrl () {
        if (!this.hasName() || !this.fullPath()) {
            return;
        }
        try {
            console.log("asyncDoesExist: checking", this.fullPath());
            const ref = this.storageRef();
            const url = await ref.getDownloadURL();
            this.setDownloadUrl(url);
            console.log("asyncDoesExist: got download URL, file exists");
            return url;
        } catch (error) {
            console.log("asyncDoesExist caught error:", error);
            console.log("asyncDoesExist error.code:", error.code);
            console.log("asyncDoesExist error.message:", error.message);

            // Both "not found" and "unauthorized" mean the file doesn't exist for our purposes
            const errorCode = error.code || "";
            if (errorCode.includes("object-not-found") || errorCode.includes("unauthorized")) {
                console.log("asyncDoesExist: file doesn't exist, returning false");
                return null;
            }

            // Re-throw unexpected errors
            console.error("asyncDoesExist: unexpected error, re-throwing:", error);
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

    setBlobToString (string) {
        const arrayBuffer = string.asArrayBuffer();
        const blob = new Blob([arrayBuffer], { type: "text/plain" });
        this.setBlob(blob);
        return this;
    }

    async blobAsString () {
        const blob = this.blob();
        if (!blob) {
            return null;
        }
        const arrayBuffer = await blob.asyncToArrayBuffer();
        return arrayBuffer.asString();
    }

    /**
     * @description Gets ArrayBuffer from the blob (for backward compatibility)
     * @returns {Promise<ArrayBuffer>} The ArrayBuffer from the blob
     * @category Helper
     */
    async arrayBuffer () {
        const blob = this.blob();
        if (!blob) {
            return null;
        }
        return await blob.asyncToArrayBuffer();
    }

    async asyncDownloadIfNeeded () {
        if (this.blob() !== null) {
            return;
        }
        await this.asyncDownload();
    }

    /**
     * @description Downloads the data from Firebase Storage as Blob
     * @returns {Promise<Blob>} The downloaded data as Blob
     * @category Storage Operations
     */
    async asyncDownload () {
        try {
            this.setError(null);
            const ref = this.storageRef();

            // Get download URL
            const url = await ref.getDownloadURL();

            // Use SvXhrRequest for proper response type handling
            const request = SvXhrRequest.clone();
            request.setUrl(url);
            request.setMethod("GET");
            request.setHeaders({});
            request.setResponseType("blob");
            await request.asyncSend();

            if (request.hasError()) {
                throw request.error();
            }

            // Get the blob from the response
            let blob = request.response();

            // Get content type from response headers or use existing/default
            const contentType = request.xhr().getResponseHeader("Content-Type") || this.contentType() || "application/octet-stream";

            // Ensure blob has correct type if needed
            if (!blob.type || blob.type === "") {
                blob = new Blob([blob], { type: contentType });
            }

            this.setBlob(blob);
            return blob;
        } catch (error) {
            console.error("Error downloading file:", error);
            this.setError(error);
            throw error;
        }
    }

    /**
     * @description Uploads data to Firebase Storage (uses blob from the object)
     * @returns {Promise<void>}
     * @category Storage Operations
     */
    async asyncUpload () {
        try {
            this.setError(null);
            this.setDownloadUrl(null); // Clear cached URL before upload

            const blob = this.blob();
            if (!blob) {
                throw new Error("No data set - use setBlob() before uploading");
            }

            const ref = this.storageRef();

            // Get content type from blob or use default
            const contentType = blob.type || this.contentType() || "application/octet-stream";

            // Prepare upload metadata
            const uploadMetadata = {
                contentType: contentType,
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
            this.setSize(blob.size);

            // Perform upload
            const uploadTask = ref.put(blob, uploadMetadata);

            // Monitor progress
            return new Promise((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(this.logPrefix(), `Upload progress for ${this.name()}: ${progress.toFixed(2)}%`);
                    },
                    (error) => {
                        console.error("Upload error:", error);
                        this.setError(error);
                        reject(error);
                    },
                    async () => {
                        // Upload completed successfully
                        console.log(this.logPrefix(), `Upload completed for ${this.name()} - now lets get download URL`);

                        // do this to unsure the file is uploaded before we download the metadata or return from the upload method
                        const url = await ref.getDownloadURL();
                        console.log(this.logPrefix(), `Upload completed for ${this.name()}, got download URL: ${url}`);
                        this.setDownloadUrl(url);

                        // Download metadata from server - to ensure we are in sync (only if still attached)
                        await this.asyncDownloadMetadata();

                        resolve();
                    }
                );
            });
        } catch (error) {
            console.error(this.logPrefix(), "Error uploading blob:", error);
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
            this.setBlob(null);
            this.setDownloadUrl(null);

            // request navigate to parent (need to do this before removing from parent)
            //if (this.parentNode()) {
            //  only want to do this if the delete occurred while viewing it...
            //  this.parentNode().postShouldFocusSubnode();
            //}

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
        const doesExist = await this.asyncDoesExist();
        if (!doesExist) {
            return;
        }

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

    asyncRefresh () {
        this.didUpdateNode();
        this.asyncDownloadMetadata();
        this.asyncRefreshDownloadUrl();
        this.didUpdateNode();
    }

    prepareForFirstAccess () {
        this.asyncRefresh();
        return this;
    }

    prepareToAccess () {
        super.prepareToAccess();
        //this.asyncRefresh();
        return this;
    }

    asyncSetNameToDataHashActionInfo () {
        return {
            title: "Set Name to Data Hash",
            isEnabled: this.hasBlob(),
            subtitle: this.hasBlob() ? null : "No data"
        };
    }

    async asyncSetNameToDataHash () {
        this.setName(await this.blob().asyncHexSha256());
        this.didUpdateNode();
    }

    // --- open download url in separate tab ---

    openDownloadUrlInSeparateTabActionInfo () {
        return {
            title: "Open Download URL",
            isEnabled: this.hasDownloadUrl(),
            subtitle: this.hasDownloadUrl() ? null : "No download URL"
        };
    }

    hasDownloadUrl () {
        return this.downloadUrl() !== null;
    }

    async openDownloadUrlInSeparateTab () {
        const url = await this.getDownloadUrl();
        if (url) {
            window.open(url, "_blank");
        }
    }

    // --- delete ---

    delete () { // called by slide delete gesture
        this.asyncDelete();
    }

    // --- public url ---

    publicUrlFromPath () {
        const bucket = SvApp.shared().cloudStorageService().bucketName();
        const encodedPath = encodeURIComponent(this.fullPath());
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`; // no trailing slash
    }

    async asyncPublicUrlExists () {
        const url = this.publicUrlFromPath();
        try {
            const response = await fetch(url, { method: "HEAD" });
            if (response.ok) {
                return true;
            } else if (response.status === 404) {
                return false;
            } else {
                return undefined;
            }
        } catch (error) {
            if (error) {
                // noop
            }
            return undefined;
        }
    }

}.initThisClass());
