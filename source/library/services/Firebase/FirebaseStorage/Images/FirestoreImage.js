"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirestoreImage
 * @extends SvStorableNode
 * @classdesc Represents an image stored in Firebase Storage
 * 
 * This class handles uploading images to Firebase Storage and
 * maintaining references to the uploaded images with their public URLs.
 */
(class FirestoreImage extends SvStorableNode {

    initPrototypeSlots () {
        // Image data URL (local)
        {
            const slot = this.newSlot("dataUrl", null);
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setFieldInspectorViewClassName("SvImageWellField");
        }

        // Firebase Storage public URL
        {
            const slot = this.newSlot("publicUrl", null);
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
        }

        // Firebase Storage path
        {
            const slot = this.newSlot("storagePath", null);
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
        }

        // Image label/description
        {
            const slot = this.newSlot("imageLabel", "");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
        }

        // Upload metadata
        {
            const slot = this.newSlot("uploadMetadata", null);
            slot.setSlotType("Object");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(false);
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

    /**
     * @description Gets the title for this image
     * @returns {string} The title
     * @category UI
     */
    title () {
        return this.imageLabel() || "Firebase Image";
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
        if (this.hasPublicUrl()) {
            return "Uploaded";
        }
        if (this.hasDataUrl()) {
            return "Ready to upload";
        }
        return "No image";
    }

    /**
     * @description Checks if image has a data URL
     * @returns {boolean} True if has data URL
     * @category Status
     */
    hasDataUrl () {
        return this.dataUrl() !== null && this.dataUrl() !== "";
    }

    /**
     * @description Checks if image has been uploaded
     * @returns {boolean} True if uploaded
     * @category Status
     */
    hasPublicUrl () {
        return this.publicUrl() !== null && this.publicUrl() !== "";
    }
    
    async asyncCompleteUploadIfNeeded () {
        if (this.hasPublicUrl()) {
            return;
        }
        await this.uploadToFirebase();
    }

    /**
     * @description Uploads the image to Firebase Storage via AccountServer
     * @returns {Promise<void>}
     * @category Upload
     */
    async uploadToFirebase () {
        try {
            this.setError("");
            this.setUploadStatus("requesting upload URL...");

            if (!this.hasDataUrl()) {
                throw new Error("No image data to upload");
            }

            // Generate a unique filename based on the label
            const label = this.imageLabel() || "image";
            const sanitizedLabel = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const timestamp = Date.now();
            const filename = `${sanitizedLabel}_${timestamp}.png`;

            // Get auth token and base URL from the account server API
            const accountApi = UoAccountServerApi.clone();
            const authToken = await accountApi.authToken();
            const accountServerUrl = accountApi.baseUrl || accountApi.accountUrl();
            
            // Remove trailing slash if present
            const baseUrl = accountServerUrl.endsWith('/') ? accountServerUrl.slice(0, -1) : accountServerUrl;
            const uploadUrlEndpoint = baseUrl + "/storage/upload-url";
            
            if (!authToken) {
                throw new Error("No auth token found. Please log in first.");
            }
            
            console.log("FirestoreImage.uploadToFirebase: Getting upload URL for:", filename);
            
            // Use SvXhrRequest for consistent error handling
            const request = SvXhrRequest.clone();
            request.setUrl(uploadUrlEndpoint);
            request.setMethod("POST");
            request.setTimeoutPeriodInMs(30000); // 30 second timeout
            request.setHeaders({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            });
            request.setBody(JSON.stringify({
                filename: filename,
                contentType: 'image/png',
                path: 'omnireference'
            }));
            
            await request.asyncSend();
            
            // Check if request had an error
            if (request.error() || request.hasErrorStatusCode()) {
                // SvXhrRequest now properly extracts nested error structures like error.message
                const errorMessage = request.error() ? request.error().message : request.causeOfError();
                throw new Error(`Failed to get upload URL: ${errorMessage}`);
            }
            
            // Success - parse the response
            const responseText = request.responseText();
            const uploadData = JSON.parse(responseText);
            
            this.setUploadStatus("uploading to Firebase...");

            // Check if we need to use direct upload (emulator fallback)
            if (uploadData.useDirectUpload) {
                console.log("FirestoreImage.uploadToFirebase: Using direct upload for emulator");
                
                // Use the direct upload endpoint
                const directRequest = SvXhrRequest.clone();
                const directUrl = baseUrl + "/storage/upload-direct";
                directRequest.setUrl(directUrl);
                directRequest.setMethod("POST");
                directRequest.setTimeoutPeriodInMs(30000); // 30 second timeout
                directRequest.setHeaders({
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                });
                directRequest.setBody(JSON.stringify({
                    fullPath: uploadData.fullPath,
                    contentType: uploadData.contentType,
                    fileData: this.dataUrl() // Send the data URL directly
                }));
                
                await directRequest.asyncSend();
                
                // Check if direct upload had an error
                if (directRequest.error() || directRequest.hasErrorStatusCode()) {
                    const errorMessage = directRequest.error() ? directRequest.error().message : directRequest.causeOfError();
                    throw new Error(`Direct upload failed: ${errorMessage}`);
                }
                
                // Parse the response
                const directResponse = JSON.parse(directRequest.responseText());
                this.setPublicUrl(directResponse.publicUrl);
                this.setStoragePath(directResponse.fullPath);
                
            } else {
                // Standard upload with signed URL
                // Convert data URL to blob
                const blob = await this.dataUrlToBlob(this.dataUrl());

                console.log("FirestoreImage.uploadToFirebase: Uploading image to Firebase Storage");
                
                // Use SvXhrRequest for the upload
                const uploadRequest = SvXhrRequest.clone();
                uploadRequest.setUrl(uploadData.uploadUrl);
                uploadRequest.setMethod("PUT");
                uploadRequest.setTimeoutPeriodInMs(30000); // 30 second timeout
                // Don't set Content-Type header - let browser handle it for signed URLs
                uploadRequest.setHeaders({});
                uploadRequest.setBody(blob);
                
                await uploadRequest.asyncSend();
                
                // Check if upload had an error
                if (uploadRequest.error() || uploadRequest.hasErrorStatusCode()) {
                    const errorMessage = uploadRequest.error() ? uploadRequest.error().message : uploadRequest.causeOfError();
                    throw new Error(`Upload failed: ${errorMessage}`);
                }

                // Store the results
                this.setPublicUrl(uploadData.publicUrl);
                this.setStoragePath(uploadData.fullPath);
            }
            
            // Set common metadata
            this.setUploadMetadata({
                filename: filename,
                contentType: uploadData.contentType || 'image/png',
                uploadedAt: new Date().toISOString(),
                expires: uploadData.expires
            });

            this.setUploadStatus("uploaded successfully");
            console.log("FirestoreImage.uploadToFirebase: Image uploaded successfully:", uploadData.publicUrl);

        } catch (error) {
            console.log("Firebase upload failed:", error);
            this.setError(error.message);
            this.setUploadStatus("upload failed");
        }
    }

    /**
     * @description Converts a data URL to a Blob, stripping metadata
     * @param {string} dataUrl - The data URL
     * @returns {Promise<Blob>} The blob without metadata
     * @category Helper
     */
    async dataUrlToBlob (dataUrl) {
        
        // For other types, use the original method
        return new Promise((resolve) => {
            const arr = dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            resolve(new Blob([u8arr], { type: mime }));
        });
    }
    

    /**
     * @description Deletes the image from Firebase Storage
     * @returns {Promise<void>}
     * @category Delete
     */
    async deleteFromFirebase () {
        try {
            this.setError("");
            this.setUploadStatus("deleting...");

            if (!this.storagePath()) {
                throw new Error("No Firebase storage path");
            }

            const service = this.service();
            await service.deleteImage(this.storagePath());

            // Clear the Firebase references
            this.setPublicUrl(null);
            this.setStoragePath(null);
            this.setUploadMetadata(null);
            this.setUploadStatus("deleted");

        } catch (error) {
            console.error("Firebase delete failed:", error);
            this.setError(error.message);
            this.setUploadStatus("delete failed");
        }
    }

    /**
     * @description Sets image from a file input
     * @param {File} file - The file to upload
     * @returns {Promise<void>}
     * @category Upload
     */
    async setFromFile (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.setDataUrl(e.target.result);
                resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * @description Sets the image from an SvImage instance
     * @param {SvImage} svImage - The SvImage to copy data from
     * @returns {Promise<void>}
     * @category Upload
     */
    async setSvImage (svImage) {
        if (!svImage || !svImage.getImageData) {
            throw new Error("Invalid SvImage provided");
        }

        const imageData = svImage.getImageData();
        if (!imageData) {
            throw new Error("SvImage has no image data");
        }

        // Set the data URL from the SvImage
        this.setDataUrl(imageData);
        
        // Optionally set a label based on the hash filename
        if (svImage.asyncGetHashFileName) {
            try {
                const hashFileName = await svImage.asyncGetHashFileName();
                this.setImageLabel(hashFileName);
            } catch (error) {
                console.warn("Could not generate hash filename:", error);
                // Continue without setting the label
            }
        }
    }


}.initThisClass());