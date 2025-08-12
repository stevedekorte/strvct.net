"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirebaseStorageImage
 * @extends SvStorableNode
 * @classdesc Represents an image stored in Firebase Storage
 * 
 * This class handles uploading images to Firebase Storage and
 * maintaining references to the uploaded images with their public URLs.
 * 
 * Replaces LeonardoRefImage for style transfer workflows, providing
 * publicly accessible URLs that work with external services like Midjourney.
 */
(class FirebaseStorageImage extends SvStorableNode {

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

    /**
     * @description Gets the Firebase Storage service
     * @returns {FirebaseStorageService} The service
     * @category Service
     */
    service () {
        return FirebaseStorageService.shared();
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
            const authToken = accountApi.authToken();
            const accountServerUrl = accountApi.baseUrl || accountApi.accountUrl();
            
            // Remove trailing slash if present
            const baseUrl = accountServerUrl.endsWith('/') ? accountServerUrl.slice(0, -1) : accountServerUrl;
            const uploadUrlEndpoint = baseUrl + "/firebase/upload-url";
            
            console.log("Firebase upload URL endpoint:", uploadUrlEndpoint);
            console.log("Account server base URL:", baseUrl);
            
            console.log("Auth token retrieved:", authToken ? `${authToken.substring(0, 20)}...` : "null");
            
            if (!authToken) {
                throw new Error("No auth token found. Please log in first.");
            }
            
            console.log("Making request to:", uploadUrlEndpoint);
            console.log("Request headers:", {
                'Authorization': `Bearer ${authToken.substring(0, 20)}...`,
                'Content-Type': 'application/json'
            });
            
            // Use XMLHttpRequest directly, following UoAccountServerApi pattern
            const uploadData = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", uploadUrlEndpoint, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
                
                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const responseData = JSON.parse(xhr.responseText);
                            resolve(responseData);
                        } catch (error) {
                            reject(new Error(`Invalid JSON response: ${error.message}`));
                        }
                    } else {
                        let errorMessage;
                        try {
                            const errorResponse = JSON.parse(xhr.responseText);
                            errorMessage = errorResponse.error?.message || errorResponse.error || xhr.responseText;
                        } catch (e) {
                            console.log("Error parsing JSON:", e);
                            errorMessage = xhr.responseText || xhr.statusText;
                        }
                        reject(new Error(`Failed to get upload URL: ${xhr.status} - ${errorMessage}`));
                    }
                };
                
                xhr.onerror = function () {
                    reject(new Error(`Network error: ${xhr.statusText || 'Connection failed'}`));
                };
                
                xhr.ontimeout = function () {
                    reject(new Error('Request timed out'));
                };
                
                xhr.timeout = 30000; // 30 second timeout
                
                const requestBody = JSON.stringify({
                    filename: filename,
                    contentType: 'image/png',
                    path: 'midjourney-style-transfer'
                });
                
                xhr.send(requestBody);
            });
            
            this.setUploadStatus("uploading to Firebase...");

            // Convert data URL to blob
            const blob = await this.dataUrlToBlob(this.dataUrl());

            // Upload directly to Firebase using the signed URL
            // Use plain XMLHttpRequest to avoid any header issues
            console.log("Uploading to signed URL:", uploadData.uploadUrl);
            console.log("Blob size:", blob.size, "bytes");
            
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadData.uploadUrl, true);
                // Don't set ANY headers - let the browser handle it
                
                xhr.onload = function () {
                    console.log("Upload response status:", xhr.status);
                    console.log("Upload response text:", xhr.responseText);
                    
                    if (xhr.status >= 200 && xhr.status < 300) {
                        console.log("Upload successful!");
                        resolve();
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
                    }
                };
                
                xhr.onerror = function () {
                    console.error("Upload network error");
                    reject(new Error('Upload failed: Network error or CORS issue'));
                };
                
                xhr.send(blob);
            });
            
            console.log("Upload completed successfully, public URL will be:", uploadData.publicUrl);

            // Store the results
            this.setPublicUrl(uploadData.publicUrl);
            this.setStoragePath(uploadData.fullPath);
            this.setUploadMetadata({
                filename: filename,
                contentType: uploadData.contentType,
                uploadedAt: new Date().toISOString(),
                expires: uploadData.expires
            });

            this.setUploadStatus("uploaded successfully");
            console.log("Image uploaded to Firebase via signed URL:", uploadData.publicUrl);

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
        // For PNG images, we could strip metadata by re-encoding through canvas
        // This ensures no EXIF or other metadata is preserved
        if (dataUrl.includes('image/png') || dataUrl.includes('image/jpeg')) {
            return this.stripMetadataViaCanvas(dataUrl);
        }
        
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
     * @description Strips metadata from an image by re-encoding through canvas
     * @param {string} dataUrl - The data URL
     * @returns {Promise<Blob>} The blob without metadata
     * @category Helper
     */
    async stripMetadataViaCanvas (dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Create canvas and draw the image
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Convert back to blob (this strips all metadata)
                canvas.toBlob((blob) => {
                    if (blob) {
                        console.log("Stripped metadata from image via canvas re-encoding");
                        resolve(blob);
                    } else {
                        reject(new Error("Failed to convert canvas to blob"));
                    }
                }, 'image/png', 1.0); // Use PNG for lossless quality
            };
            img.onerror = () => {
                reject(new Error("Failed to load image for metadata stripping"));
            };
            img.src = dataUrl;
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
     * @description Gets action info for upload action
     * @returns {Object} Action info
     * @category Actions
     */
    uploadActionInfo () {
        return {
            isEnabled: this.hasDataUrl() && !this.hasPublicUrl(),
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
            isEnabled: this.hasPublicUrl(),
            isVisible: this.hasPublicUrl()
        };
    }

    /**
     * @description Checks if the public URL is still accessible
     * @returns {Promise<boolean>} True if accessible
     * @category Validation
     */
    async isUrlAccessible () {
        if (!this.hasPublicUrl()) {
            return false;
        }

        try {
            const response = await fetch(this.publicUrl(), { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.error("URL accessibility check failed:", error);
            return false;
        }
    }

    /**
     * @description Re-uploads the image if the URL has expired
     * @returns {Promise<void>}
     * @category Upload
     */
    async reuploadIfNeeded () {
        const isAccessible = await this.isUrlAccessible();
        if (!isAccessible && this.hasDataUrl()) {
            console.log("Firebase URL not accessible, re-uploading...");
            // Clear old references
            this.setPublicUrl(null);
            this.setStoragePath(null);
            // Re-upload
            await this.uploadToFirebase();
        }
    }

    /**
     * @description Tests downloading the image from Firebase
     * @returns {Promise<void>}
     * @category Testing
     */
    async testDownload () {
        try {
            this.setError("");
            this.setUploadStatus("testing download...");

            if (!this.hasPublicUrl()) {
                throw new Error("No public URL available. Upload the image first.");
            }

            const url = this.publicUrl();
            console.log("Testing download from:", url);

            // Test 1: Simple fetch to check if URL is accessible
            console.log("Test 1: Checking URL accessibility...");
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');
            console.log("Content-Type:", contentType);
            console.log("Content-Length:", contentLength, "bytes");

            // Test 2: Try to load as blob
            console.log("Test 2: Loading as blob...");
            const blob = await response.blob();
            console.log("Blob size:", blob.size, "bytes");
            console.log("Blob type:", blob.type);

            // Test 3: Try to create an object URL and load in an image
            console.log("Test 3: Creating object URL and testing in Image element...");
            const objectUrl = URL.createObjectURL(blob);
            
            await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    console.log("Image loaded successfully!");
                    console.log("Image dimensions:", img.width, "x", img.height);
                    URL.revokeObjectURL(objectUrl);
                    resolve();
                };
                img.onerror = (e) => {
                    console.error("Image load failed:", e);
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error("Failed to load image in browser"));
                };
                img.src = objectUrl;
            });

            // Test 4: Check CORS headers
            console.log("Test 4: Checking CORS headers...");
            console.log("Access-Control-Allow-Origin:", response.headers.get('access-control-allow-origin') || "Not set");
            
            // Success
            this.setUploadStatus("download test successful!");
            console.log("✅ All download tests passed!");
            console.log("The image is publicly accessible and can be loaded.");
            
        } catch (error) {
            console.error("❌ Download test failed:", error);
            this.setError(`Download test failed: ${error.message}`);
            this.setUploadStatus("download test failed");
            
            // Additional debugging info
            console.log("Debug info:");
            console.log("- Public URL:", this.publicUrl());
            console.log("- Storage path:", this.storagePath());
            console.log("- Upload metadata:", JSON.stringify(this.uploadMetadata(), null, 2));
        }
    }

    /**
     * @description Gets action info for test download action
     * @returns {Object} Action info
     * @category Actions
     */
    testDownloadActionInfo () {
        return {
            isEnabled: this.hasPublicUrl(),
            isVisible: true
        };
    }

}.initThisClass());