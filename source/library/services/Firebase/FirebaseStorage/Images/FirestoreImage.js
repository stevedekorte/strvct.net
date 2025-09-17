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

        // Download from Firebase action
        {
            const slot = this.newSlot("downloadFromFirebaseAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Download from Firebase");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("downloadFromFirebase");
        }

        // Clear local data action
        {
            const slot = this.newSlot("clearLocalDataAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Clear Local Data");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("clearLocalData");
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
        return this.dataUrl() !== null && this.dataUrl().length > 0;
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
                // Fix the bucket URL if it has the wrong domain
                let publicUrl = directResponse.publicUrl;
                if (publicUrl && publicUrl.includes('.firebasestorage.app')) {
                    publicUrl = publicUrl.replace('.firebasestorage.app', '.appspot.com');
                    console.log("Fixed bucket URL from .firebasestorage.app to .appspot.com");
                }
                
                // For omnireference images, we need real public URLs (not emulator)
                // so external services like Midjourney can access them
                // Don't convert to emulator URLs even in local development
                console.log("Using real Firebase Storage URL for public accessibility");
                
                this.setPublicUrl(publicUrl);
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
                // Fix the bucket URL if it has the wrong domain
                let publicUrl = uploadData.publicUrl;
                if (publicUrl && publicUrl.includes('.firebasestorage.app')) {
                    publicUrl = publicUrl.replace('.firebasestorage.app', '.appspot.com');
                    console.log("Fixed bucket URL from .firebasestorage.app to .appspot.com");
                }
                this.setPublicUrl(publicUrl);
                // Only set storage path if it's actually a path, not just the bucket
                if (uploadData.fullPath && uploadData.fullPath.includes('/')) {
                    this.setStoragePath(uploadData.fullPath);
                } else {
                    console.warn("Invalid storage path received:", uploadData.fullPath);
                    // Try to extract path from public URL
                    if (uploadData.publicUrl) {
                        const url = new URL(uploadData.publicUrl);
                        const pathMatch = url.pathname.match(/\/o\/([^?]+)/);
                        if (pathMatch) {
                            const decodedPath = decodeURIComponent(pathMatch[1]);
                            this.setStoragePath(decodedPath);
                            console.log("Extracted storage path from URL:", decodedPath);
                        }
                    }
                }
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

            // Ensure Firebase Storage is available
            if (typeof firebase === 'undefined' || !firebase.storage) {
                throw new Error("Firebase Storage not available");
            }

            // Get a reference to the file and delete it
            const storage = firebase.storage();
            const fileRef = storage.ref(this.storagePath());
            await fileRef.delete();

            // Clear the Firebase references locally after successful deletion
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
     * @description Downloads the image from Firebase Storage and stores it as a data URL
     * @returns {Promise<void>}
     * @category Download
     */
    async downloadFromFirebase () {
        try {
            this.setError("");
            this.setUploadStatus("downloading...");

            // First try to use the public URL if we have one
            if (this.publicUrl()) {
                console.log("Attempting to download from public URL:", this.publicUrl());
                console.log("Storage path:", this.storagePath());
                
                // For Firebase Storage URLs, try direct fetch first (they usually have auth tokens in the URL)
                try {
                    const response = await fetch(this.publicUrl());
                    if (response.ok) {
                        const blob = await response.blob();
                        
                        // Convert blob to data URL
                        const reader = new FileReader();
                        const dataUrl = await new Promise((resolve, reject) => {
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                        
                        this.setDataUrl(dataUrl);
                        this.setUploadStatus("downloaded");
                        return;
                    } else {
                        console.log("Direct fetch failed with status:", response.status);
                    }
                } catch (fetchError) {
                    console.log("Direct fetch failed:", fetchError.message);
                }
                
                // If direct fetch failed and it's a Firebase Storage URL, try SDK
                if (this.publicUrl().includes('firebasestorage.googleapis.com') && 
                    typeof firebase !== 'undefined' && firebase.storage) {
                    console.log("Attempting Firebase SDK download as fallback");
                    
                    // Extract the actual file path from the URL
                    const url = new URL(this.publicUrl());
                    const pathMatch = url.pathname.match(/\/o\/([^?]+)/);
                    if (pathMatch) {
                        const encodedPath = pathMatch[1];
                        const decodedPath = decodeURIComponent(encodedPath);
                        console.log("Extracted path from URL:", decodedPath);
                        
                        try {
                            const storage = firebase.storage();
                            const fileRef = storage.ref(decodedPath);
                            const downloadUrl = await fileRef.getDownloadURL();
                            console.log("Got fresh download URL from Firebase SDK:", downloadUrl);
                            
                            const response = await fetch(downloadUrl);
                            if (!response.ok) {
                                throw new Error(`Failed to download via SDK: ${response.status}`);
                            }
                            const blob = await response.blob();
                            
                            // Convert blob to data URL
                            const reader = new FileReader();
                            const dataUrl = await new Promise((resolve, reject) => {
                                reader.onloadend = () => resolve(reader.result);
                                reader.onerror = reject;
                                reader.readAsDataURL(blob);
                            });
                            
                            this.setDataUrl(dataUrl);
                            this.setUploadStatus("downloaded");
                            return;
                        } catch (sdkError) {
                            console.error("Firebase SDK download failed:", sdkError);
                            throw sdkError;
                        }
                    }
                }
                
                // If we got here, nothing worked
                throw new Error("Failed to download image from Firebase Storage");
            }

            // Fallback to using Firebase Storage SDK if no public URL
            if (!this.storagePath()) {
                throw new Error("No Firebase storage path or public URL");
            }

            // Ensure Firebase Storage is available
            if (typeof firebase === 'undefined' || !firebase.storage) {
                throw new Error("Firebase Storage not available");
            }

            // Get a reference to the file and download it
            const storage = firebase.storage();
            const fileRef = storage.ref(this.storagePath());
            
            // Get the download URL
            const downloadUrl = await fileRef.getDownloadURL();
            
            // Fetch the image and convert to data URL
            const response = await fetch(downloadUrl);
            const blob = await response.blob();
            
            // Convert blob to data URL
            const reader = new FileReader();
            const dataUrl = await new Promise((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            
            this.setDataUrl(dataUrl);
            this.setUploadStatus("downloaded");

        } catch (error) {
            console.error("Firebase download failed:", error);
            this.setError(error.message);
            this.setUploadStatus("download failed");
        }
    }

    /**
     * @description Clears the local data URL while keeping Firebase references
     * @category Data Management
     */
    clearLocalData () {
        this.setDataUrl(null);
        this.setUploadStatus("local data cleared");
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

    /**
     * @description Gets action info for download from Firebase action
     * @returns {Object} Action info
     * @category Actions
     */
    downloadFromFirebaseActionInfo () {
        return {
            isEnabled: this.hasStoragePath() && !this.hasDataUrl(),
            isVisible: true
        };
    }

    /**
     * @description Gets action info for clear local data action
     * @returns {Object} Action info
     * @category Actions
     */
    clearLocalDataActionInfo () {
        return {
            isEnabled: this.hasDataUrl(),
            isVisible: true
        };
    }

    /**
     * @description Helper to check if we have a storage path
     * @returns {boolean}
     * @category Helpers
     */
    hasStoragePath () {
        return this.storagePath() !== null && this.storagePath().length > 0;
    }


}.initThisClass());