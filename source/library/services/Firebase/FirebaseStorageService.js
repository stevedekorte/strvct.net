"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirebaseStorageService
 * @extends AiService
 * @classdesc Service for Firebase Storage integration via AccountServer
 * 
 * This service coordinates with the AccountServer to get signed upload URLs,
 * allowing secure uploads to Firebase Storage without exposing credentials.
 * 
 * Security model:
 * - Client requests signed URL from AccountServer (authenticated)
 * - AccountServer generates time-limited upload URL using Firebase Admin SDK
 * - Client uploads directly to Firebase using signed URL
 * - No Firebase credentials exposed to client
 */
(class FirebaseStorageService extends AiService {
    
    /**
     * @static
     * @description Initializes the class and sets it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }
    
    static defaultServiceJsonFilePath () {
        return "app/info/services/FirebaseStorageService.json";
    }

    serviceInfo () {
        return {
        };
    }

    initPrototypeSlots () {
        // This service doesn't need credential slots since uploads go through AccountServer
        // The AccountServer handles Firebase credentials securely
        
        // Images collection for testing
        {
            const slot = this.newSlot("images", null);
            slot.setFinalInitProto(FirestoreImages);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("FirestoreImages");
        }
    }

    initPrototype () {
        this.setTitle("Firebase Storage");
        this.setSubtitle("Image hosting service");
        this.setShouldStoreSubnodes(false);
    }

    finalInit () {
        super.finalInit();
        this.setTitle("Firebase Storage");
    }

    /**
     * @description Checks if Firebase is configured (always true since AccountServer handles it)
     * @returns {boolean} True
     * @category Configuration
     */
    isConfigured () {
        // AccountServer handles Firebase configuration
        return true;
    }

    /**
     * @description No longer needed - AccountServer handles Firebase
     * @deprecated Use AccountServer endpoint instead
     * @returns {Promise<void>}
     * @category Initialization
     */
    async initializeFirebase () {
        if (this.firebaseApp()) {
            return; // Already initialized
        }

        if (!this.isConfigured()) {
            throw new Error("Firebase Storage is not configured");
        }

        // Dynamically load Firebase SDK if not already loaded
        if (typeof firebase === 'undefined') {
            await this.loadFirebaseSDK();
        }

        const firebaseConfig = {
            apiKey: this.apiKey(),
            authDomain: this.authDomain(),
            projectId: this.projectId(),
            storageBucket: this.storageBucket(),
            messagingSenderId: this.messagingSenderId(),
            appId: this.appId()
        };

        // Initialize Firebase app
        const app = firebase.initializeApp(firebaseConfig);
        this.setFirebaseApp(app);

        // Get storage instance
        const storage = firebase.storage();
        this.setFirebaseStorage(storage);

        console.log("Firebase Storage initialized successfully");
    }

    /**
     * @description Loads Firebase SDK from CDN
     * @returns {Promise<void>}
     * @category Initialization
     */
    async loadFirebaseSDK () {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (typeof firebase !== 'undefined' && firebase.storage) {
                resolve();
                return;
            }
            
            // Check if already loading
            if (window.firebaseSDKLoading) {
                window.firebaseSDKLoadingPromise.then(resolve).catch(reject);
                return;
            }

            window.firebaseSDKLoading = true;

            const scripts = [
                "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js",
                "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js"
            ];

            let loadedCount = 0;
            let hasError = false;
            
            const onScriptLoad = () => {
                loadedCount++;
                if (loadedCount === scripts.length && !hasError) {
                    window.firebaseSDKLoading = false;
                    console.log("Firebase SDK loaded successfully");
                    resolve();
                }
            };

            const onScriptError = (src) => {
                if (!hasError) {
                    hasError = true;
                    window.firebaseSDKLoading = false;
                    const error = new Error(`Failed to load Firebase SDK from ${src}. Check internet connection or try refreshing.`);
                    console.error(error);
                    reject(error);
                }
            };

            scripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = onScriptLoad;
                script.onerror = () => onScriptError(src);
                document.head.appendChild(script);
            });

            // Set up promise for other callers
            window.firebaseSDKLoadingPromise = new Promise((res, rej) => {
                const checkInterval = setInterval(() => {
                    if (!window.firebaseSDKLoading) {
                        clearInterval(checkInterval);
                        if (hasError) {
                            rej(new Error("Firebase SDK failed to load"));
                        } else {
                            res();
                        }
                    }
                }, 100);
                
                // Timeout after 30 seconds
                setTimeout(() => {
                    if (window.firebaseSDKLoading) {
                        clearInterval(checkInterval);
                        window.firebaseSDKLoading = false;
                        rej(new Error("Firebase SDK loading timed out after 30 seconds"));
                    }
                }, 30000);
            });
        });
    }

    /**
     * @description Uploads an image via AccountServer signed URL
     * @deprecated Use FirestoreImage.uploadToFirebase() instead
     * @param {string} dataUrl - The image data URL
     * @param {string} filename - Optional filename
     * @returns {Promise<Object>} Object with publicUrl and metadata
     * @category Upload
     */
    async uploadImage (dataUrl, filename = null) {
        await this.initializeFirebase();

        if (!dataUrl || !dataUrl.startsWith('data:')) {
            throw new Error("Invalid data URL");
        }

        // Generate filename if not provided
        if (!filename) {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 8);
            filename = `image_${timestamp}_${random}.png`;
        }

        // Construct the full path
        const fullPath = `${this.uploadPath()}/${filename}`;

        // Convert data URL to blob
        const blob = await this.dataUrlToBlob(dataUrl);

        // Get storage reference
        const storageRef = this.firebaseStorage().ref();
        const imageRef = storageRef.child(fullPath);

        // Upload the blob
        const snapshot = await imageRef.put(blob, {
            contentType: blob.type,
            customMetadata: {
                uploadedAt: new Date().toISOString(),
                source: 'undreamedof-ai'
            }
        });

        // Get the public download URL
        const publicUrl = await snapshot.ref.getDownloadURL();

        return {
            publicUrl: publicUrl,
            fullPath: fullPath,
            filename: filename,
            size: snapshot.totalBytes,
            contentType: snapshot.metadata.contentType,
            timeCreated: snapshot.metadata.timeCreated,
            metadata: snapshot.metadata
        };
    }

    /**
     * @description Converts a data URL to a Blob
     * @param {string} dataUrl - The data URL
     * @returns {Promise<Blob>} The blob
     * @category Helper
     */
    async dataUrlToBlob (dataUrl) {
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
     * @description Deletes an image from Firebase Storage
     * @param {string} fullPath - The full storage path
     * @returns {Promise<void>}
     * @category Delete
     */
    async deleteImage (fullPath) {
        await this.initializeFirebase();

        const storageRef = this.firebaseStorage().ref();
        const imageRef = storageRef.child(fullPath);

        await imageRef.delete();
    }

    /**
     * @description Gets metadata for an image
     * @param {string} fullPath - The full storage path
     * @returns {Promise<Object>} The metadata
     * @category Metadata
     */
    async getImageMetadata (fullPath) {
        await this.initializeFirebase();

        const storageRef = this.firebaseStorage().ref();
        const imageRef = storageRef.child(fullPath);

        const metadata = await imageRef.getMetadata();
        const publicUrl = await imageRef.getDownloadURL();

        return {
            publicUrl: publicUrl,
            fullPath: fullPath,
            size: metadata.size,
            contentType: metadata.contentType,
            timeCreated: metadata.timeCreated,
            updated: metadata.updated,
            customMetadata: metadata.customMetadata
        };
    }

}.initThisClass());