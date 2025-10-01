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
     * @description Gets the Firebase Storage instance
     * @returns {Object} Firebase Storage instance
     * @throws {Error} If Firebase Storage is not available or fails to initialize
     * @category Helper
     */
    getFirebaseStorage () {
        // Check for cached storage instance (configured with emulator in firebase-shim.js)
        if (typeof globalThis !== "undefined" && globalThis._firebaseStorageInstance) {
            console.log("FirestoreImage.getFirebaseStorage: Using cached storage instance");
            return globalThis._firebaseStorageInstance;
        }

        // Check if Firebase is available globally
        if (typeof firebase !== "undefined" && firebase && firebase.storage && firebase.app) {
            try {
                // Get the Firebase app instance
                const app = firebase.app();

                // Get bucket from UoBuildEnv (stored outside firebase config to avoid init errors)
                let bucketName = null;
                if (typeof globalThis !== "undefined" && globalThis.UoBuildEnv) {
                    bucketName = globalThis.UoBuildEnv.storageBucket;
                }

                // Fallback to app options if available
                if (!bucketName && app.options.storageBucket) {
                    bucketName = app.options.storageBucket;
                }

                if (!bucketName) {
                    throw new Error("Firebase Storage bucket not configured in UoBuildEnv");
                }

                console.log(`FirestoreImage.getFirebaseStorage: Creating new storage instance for bucket: ${bucketName}`);

                // Use the app-specific storage instance with the bucket URL
                // This avoids the default bucket parsing that's causing the error
                return app.storage(`gs://${bucketName}`);
            } catch (error) {
                throw new Error(`Firebase Storage initialization failed: ${error.message}`);
            }
        }

        // Check if it's available on window
        if (typeof window !== "undefined" && window.firebase && window.firebase.storage && window.firebase.app) {
            try {
                const app = window.firebase.app();

                let bucketName = null;
                if (typeof globalThis !== "undefined" && globalThis.UoBuildEnv) {
                    bucketName = globalThis.UoBuildEnv.storageBucket;
                }

                if (!bucketName && app.options.storageBucket) {
                    bucketName = app.options.storageBucket;
                }

                if (!bucketName) {
                    throw new Error("Firebase Storage bucket not configured in UoBuildEnv");
                }

                console.log(`FirestoreImage.getFirebaseStorage: Creating new storage instance for bucket: ${bucketName}`);

                return app.storage(`gs://${bucketName}`);
            } catch (error) {
                throw new Error(`Firebase Storage initialization failed: ${error.message}`);
            }
        }

        throw new Error("Firebase Storage is not available - ensure Firebase libraries are loaded");
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
     * @description Uploads the image to Firebase Storage directly using Firebase SDK
     * @returns {Promise<void>}
     * @category Upload
     */
    async uploadToFirebase () {
        try {
            this.setError("");
            this.setUploadStatus("preparing upload...");

            console.log("FirestoreImage.uploadToFirebase: Starting upload process");

            if (!this.hasDataUrl()) {
                throw new Error("No image data to upload");
            }

            // Get the current user ID
            if (typeof firebase === "undefined" || !firebase.auth) {
                throw new Error("Firebase not initialized");
            }

            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error("No user logged in. Please log in first.");
            }

            console.log("FirestoreImage.uploadToFirebase: User ID:", user.uid);

            // Generate a unique filename based on the label
            const label = this.imageLabel() || "image";
            const sanitizedLabel = label.toLowerCase().replace(/[^a-z0-9]/g, "_");
            const timestamp = Date.now();
            const filename = `${sanitizedLabel}_${timestamp}.png`;

            // Create the full path for the file
            const fullPath = `files/${user.uid}/${filename}`;

            console.log("FirestoreImage.uploadToFirebase: Full path:", fullPath);

            // Get Firebase Storage instance
            const storage = this.getFirebaseStorage();
            console.log("FirestoreImage.uploadToFirebase: Got storage instance:", storage);

            // Debug: Log storage configuration
            const app = storage.app;
            if (app && app.options) {
                console.log("FirestoreImage.uploadToFirebase: Firebase app options:", {
                    projectId: app.options.projectId,
                    storageBucket: app.options.storageBucket,
                    authDomain: app.options.authDomain
                });
            }

            // Check if we're using the emulator
            const isEmulator = this.isUsingStorageEmulator();
            console.log("FirestoreImage.uploadToFirebase: Using emulator:", isEmulator);

            if (isEmulator) {
                console.log("FirestoreImage.uploadToFirebase: Emulator host:", window.location.hostname);
            }

            console.log("FirestoreImage.uploadToFirebase: Creating storage reference...");
            const storageRef = storage.ref(fullPath);
            console.log("FirestoreImage.uploadToFirebase: Storage ref created:", storageRef);

            // Convert data URL to blob
            console.log("FirestoreImage.uploadToFirebase: Converting data URL to blob...");
            const blob = await this.dataUrlToBlob(this.dataUrl());
            console.log("FirestoreImage.uploadToFirebase: Blob size:", blob.size, "bytes");
            console.log("FirestoreImage.uploadToFirebase: Blob type:", blob.type);

            this.setUploadStatus("uploading to Firebase...");

            // Upload the blob directly to Firebase Storage
            console.log("FirestoreImage.uploadToFirebase: Starting upload...");
            const uploadTask = storageRef.put(blob, {
                contentType: blob.type || "image/png",
                customMetadata: {
                    uploadedBy: user.uid,
                    uploadedAt: new Date().toISOString(),
                    label: this.imageLabel() || "",
                    originalFilename: filename,
                    mimeType: blob.type || "image/png"
                }
            });

            console.log("FirestoreImage.uploadToFirebase: Upload task created, monitoring progress...");
            console.log("FirestoreImage.uploadToFirebase: Upload task state:", uploadTask.snapshot.state);
            console.log("FirestoreImage.uploadToFirebase: Upload task ref:", uploadTask.snapshot.ref.toString());

            // Monitor upload progress
            uploadTask.on("state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log("FirestoreImage.uploadToFirebase: Upload progress: " + progress.toFixed(2) + "%",
                        "State:", snapshot.state,
                        "Bytes:", snapshot.bytesTransferred, "/", snapshot.totalBytes);
                    this.setUploadStatus(`uploading: ${progress.toFixed(0)}%`);
                },
                (error) => {
                    console.error("FirestoreImage.uploadToFirebase: Upload error:", error);
                    console.error("FirestoreImage.uploadToFirebase: Error code:", error.code);
                    console.error("FirestoreImage.uploadToFirebase: Error message:", error.message);
                    console.error("FirestoreImage.uploadToFirebase: Error stack:", error.stack);
                    throw error;
                },
                () => {
                    console.log("FirestoreImage.uploadToFirebase: Upload completed successfully (callback)");
                }
            );

            // Add timeout to detect if upload is hanging
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Upload timeout after 60 seconds")), 60000);
            });

            // Wait for upload to complete or timeout
            await Promise.race([uploadTask, timeoutPromise]);
            console.log("FirestoreImage.uploadToFirebase: Upload task promise resolved");

            // Get the download URL
            console.log("FirestoreImage.uploadToFirebase: Getting download URL...");
            const publicUrl = await storageRef.getDownloadURL();
            console.log("FirestoreImage.uploadToFirebase: Download URL:", publicUrl);

            // Store the results
            this.setPublicUrl(publicUrl);
            this.setStoragePath(fullPath);

            // Set metadata
            this.setUploadMetadata({
                filename: filename,
                contentType: blob.type || "image/png",
                mimeType: blob.type || "image/png",
                uploadedAt: new Date().toISOString()
            });

            this.setUploadStatus("uploaded successfully");
            console.log("FirestoreImage.uploadToFirebase: Upload successful!");

        } catch (error) {
            console.error("FirestoreImage.uploadToFirebase: Upload failed with error:", error);
            console.error("FirestoreImage.uploadToFirebase: Error code:", error.code);
            console.error("FirestoreImage.uploadToFirebase: Error message:", error.message);
            console.error("FirestoreImage.uploadToFirebase: Error stack:", error.stack);

            // Log Firebase config for debugging
            if (typeof firebase !== "undefined" && firebase.app) {
                try {
                    const app = firebase.app();
                    console.error("FirestoreImage.uploadToFirebase: Firebase config at time of error:", {
                        projectId: app.options.projectId,
                        storageBucket: app.options.storageBucket,
                        authDomain: app.options.authDomain
                    });
                } catch (configError) {
                    console.error("FirestoreImage.uploadToFirebase: Could not get Firebase config:", configError);
                }
            }

            this.setError(error.message);
            this.setUploadStatus("upload failed");
        }
    }

    /**
     * @description Check if we're using the Firebase Storage emulator
     * @returns {boolean} True if using emulator
     * @category Helper
     */
    isUsingStorageEmulator () {
        // Check if Firebase Storage is configured to use emulator
        if (typeof firebase !== "undefined" && firebase.storage) {
            const storage = firebase.storage();
            // The emulator uses localhost URLs
            const app = storage.app;
            if (app && app.options && app.options.storageBucket) {
                // If we're connected to localhost, we're using the emulator
                return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
            }
        }
        return false;
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
            const arr = dataUrl.split(",");
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

            // Get Firebase Storage instance
            const storage = this.getFirebaseStorage();

            // Get a reference to the file and delete it
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

            // Try download via public URL first if available
            if (this.publicUrl()) {
                const downloaded = await this.tryDownloadViaPublicUrl();
                if (downloaded) {
                    return;
                }
            }

            // Fallback to using Firebase Storage SDK via storage path
            await this.downloadViaStoragePath();

        } catch (error) {
            this.handleDownloadError(error);
        }
    }

    /**
     * @description Attempts to download via the public URL (tries direct fetch and SDK fallback)
     * @returns {Promise<boolean>} True if download succeeded, false otherwise
     * @category Download
     */
    async tryDownloadViaPublicUrl () {
        console.log("Attempting to download from public URL:", this.publicUrl());
        console.log("Storage path:", this.storagePath());

        // Try direct fetch first (works if URL has auth tokens)
        const directFetchSucceeded = await this.tryDirectFetch();
        if (directFetchSucceeded) {
            return true;
        }

        // Try SDK fallback if it's a Firebase Storage URL
        if (this.publicUrl().includes("firebasestorage.googleapis.com")) {
            const sdkFetchSucceeded = await this.tryFirebaseSDKDownload();
            if (sdkFetchSucceeded) {
                return true;
            }
        }

        // All methods failed
        throw new Error("Failed to download image from Firebase Storage");
    }

    /**
     * @description Attempts direct fetch from the public URL
     * @returns {Promise<boolean>} True if successful, false otherwise
     * @category Download
     */
    async tryDirectFetch () {
        try {
            const response = await fetch(this.publicUrl());
            if (response.ok) {
                const blob = await response.blob();
                const dataUrl = await this.blobToDataUrl(blob);
                this.setDataUrl(dataUrl);
                this.setUploadStatus("downloaded");
                return true;
            } else {
                console.log("Direct fetch failed with status:", response.status);
                return false;
            }
        } catch (fetchError) {
            console.log("Direct fetch failed:", fetchError.message);
            return false;
        }
    }

    /**
     * @description Attempts download via Firebase SDK (extracts path from URL and gets fresh download URL)
     * @returns {Promise<boolean>} True if successful, false otherwise
     * @category Download
     */
    async tryFirebaseSDKDownload () {
        console.log("Attempting Firebase SDK download as fallback");

        const storage = this.getFirebaseStorage();
        const pathFromUrl = this.extractPathFromPublicUrl();

        if (!pathFromUrl) {
            return false;
        }

        console.log("Extracted path from URL:", pathFromUrl);

        try {
            const fileRef = storage.ref(pathFromUrl);
            const downloadUrl = await fileRef.getDownloadURL();
            console.log("Got fresh download URL from Firebase SDK:", downloadUrl);

            const response = await fetch(downloadUrl);
            if (!response.ok) {
                throw new Error(`Failed to download via SDK: ${response.status}`);
            }

            const blob = await response.blob();
            const dataUrl = await this.blobToDataUrl(blob);
            this.setDataUrl(dataUrl);
            this.setUploadStatus("downloaded");
            return true;

        } catch (sdkError) {
            // Check if it's a file-not-found error
            if (sdkError.code === "storage/object-not-found") {
                console.log("File not found in Firebase Storage");
                this.setDataUrl(null);
                this.setUploadStatus("not found");
                return true; // Return true because we handled it (file doesn't exist)
            }
            // For other errors, log and return false
            console.error("Firebase SDK download failed:", sdkError);
            return false;
        }
    }

    /**
     * @description Downloads via Firebase Storage path (when no public URL available)
     * @returns {Promise<void>}
     * @category Download
     */
    async downloadViaStoragePath () {
        if (!this.storagePath()) {
            throw new Error("No Firebase storage path or public URL");
        }

        const storage = this.getFirebaseStorage();
        const fileRef = storage.ref(this.storagePath());
        const downloadUrl = await fileRef.getDownloadURL();

        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const dataUrl = await this.blobToDataUrl(blob);

        this.setDataUrl(dataUrl);
        this.setUploadStatus("downloaded");
    }

    /**
     * @description Extracts the storage path from a Firebase Storage public URL
     * @returns {string|null} The decoded storage path or null if extraction failed
     * @category Helper
     */
    extractPathFromPublicUrl () {
        try {
            const url = new URL(this.publicUrl());
            const pathMatch = url.pathname.match(/\/o\/([^?]+)/);
            if (pathMatch) {
                const encodedPath = pathMatch[1];
                return decodeURIComponent(encodedPath);
            }
        } catch (error) {
            console.error("Failed to extract path from URL:", error);
        }
        return null;
    }

    /**
     * @description Converts a Blob to a data URL
     * @param {Blob} blob - The blob to convert
     * @returns {Promise<string>} The data URL
     * @category Helper
     */
    async blobToDataUrl (blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * @description Handles download errors
     * @param {Error} error - The error that occurred
     * @category Download
     */
    handleDownloadError (error) {
        // Check if it's a file-not-found error
        if (error.code === "storage/object-not-found") {
            console.log("File not found in Firebase Storage");
            this.setDataUrl(null);
            this.setError("");
            this.setUploadStatus("not found");
            return;
        }
        // For other errors (network, API, etc), set error state and re-throw
        console.error("Firebase download failed:", error);
        this.setError(error.message);
        this.setUploadStatus("download failed");
        throw error;
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
