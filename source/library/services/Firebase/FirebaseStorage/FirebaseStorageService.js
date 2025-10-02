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

(class FirebaseStorageService extends SvSummaryNode {

    /**
     * @static
     * @description Initializes the class and sets it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {

        {
            const slot = this.newSlot("rootFolder", null);
            slot.setFinalInitProto(FirebaseRootFolder);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setSlotType("FirebaseRootFolder");
        }

        {
            const slot = this.newSlot("bucketName", null);
            slot.setSlotType("String");
            slot.setShouldStoreSlot(false);
        }

        {
            const slot = this.newSlot("permissions", null);
            slot.setFinalInitProto(FirebaseStoragePermissions);
            slot.setSlotType("FirebaseStoragePermissions");
            slot.setShouldStoreSlot(false);
        }

    }

    initPrototype () {
        this.setTitle("Firebase Storage");
        this.setSubtitle("file hosting");
        this.setShouldStoreSubnodes(false);
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
        this.watchForNote("onUpdateAccountLogin");
    }

    userId () {
        if (firebase.auth().currentUser) {
            const userId = firebase.auth().currentUser.uid;
            return userId;
        }
        return null;
    }

    userFolder () {
        const userId = this.userId();
        if (userId) {
            return this.rootFolder().folderForUser(userId);
        }
        return null;
    }

    async onUpdateAccountLogin () {
        if (this.userId() && this._isSetup === undefined) {
            this._isSetup = true;
            const userFolder = this.userFolder();
            await userFolder.asyncReadSubnodes();
            //await this.asyncTest();
        } else {
            //this.rootFolder().removeSubnode(this.rootFolder().subfolderNamed("files"));
        }
    }

    /**
     * @description Lists all files in a user's files folder
     * @param {string} userId - The user ID to list files for
     * @param {string} [subfolder] - Optional subfolder path under the user's folder (e.g., "images", "documents/pdfs")
     * @returns {Promise<Array>} Array of file metadata objects with { name, fullPath, timeCreated, updated, size, contentType }
     * @category Storage Operations
     */
    async listUserBlobs (userId, subfolder = "") {
        try {
            const storage = this.getFirebaseStorage();
            const path = subfolder ? `users/${userId}/${subfolder}` : `users/${userId}`;
            const userFolderRef = storage.ref(path);

            // List all items in the user's folder
            const result = await userFolderRef.listAll();

            // Get metadata for each file
            const filesMetadata = await Promise.all(
                result.items.map(async (itemRef) => {
                    const metadata = await itemRef.getMetadata();
                    return {
                        name: itemRef.name,
                        fullPath: itemRef.fullPath,
                        bucket: itemRef.bucket,
                        timeCreated: metadata.timeCreated,
                        updated: metadata.updated,
                        size: metadata.size,
                        contentType: metadata.contentType,
                        customMetadata: metadata.customMetadata || {}
                    };
                })
            );

            return filesMetadata;
        } catch (error) {
            console.error(`Error listing blobs for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * @description Lists all subfolders (prefixes) in a user's files folder
     * @param {string} userId - The user ID to list folders for
     * @param {string} [subfolder] - Optional subfolder path to list within (e.g., "images", "documents")
     * @returns {Promise<Array>} Array of folder names (without the full path)
     * @category Storage Operations
     */
    async listUserFolders (userId, subfolder = "") {
        try {
            const storage = this.getFirebaseStorage();
            const path = subfolder ? `users/${userId}/${subfolder}` : `users/${userId}`;
            const userFolderRef = storage.ref(path);

            // List all items in the user's folder
            const result = await userFolderRef.listAll();

            // Extract folder names from prefixes
            const folders = result.prefixes.map(prefixRef => prefixRef.name);

            return folders;
        } catch (error) {
            console.error(`Error listing folders for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * @description Lists all files and folders in a user's files folder
     * @param {string} userId - The user ID to list for
     * @param {string} [subfolder] - Optional subfolder path
     * @returns {Promise<Object>} Object with { files: Array, folders: Array }
     * @category Storage Operations
     */
    async listUserBlobsAndFolders (userId, subfolder = "") {
        try {
            const storage = this.getFirebaseStorage();
            const path = subfolder ? `users/${userId}/${subfolder}` : `users/${userId}`;
            const userFolderRef = storage.ref(path);

            // List all items in the user's folder
            const result = await userFolderRef.listAll();

            // Get metadata for each file
            const filesMetadata = await Promise.all(
                result.items.map(async (itemRef) => {
                    const metadata = await itemRef.getMetadata();
                    return {
                        name: itemRef.name,
                        fullPath: itemRef.fullPath,
                        bucket: itemRef.bucket,
                        timeCreated: metadata.timeCreated,
                        updated: metadata.updated,
                        size: metadata.size,
                        contentType: metadata.contentType,
                        customMetadata: metadata.customMetadata || {}
                    };
                })
            );

            // Extract folder names from prefixes
            const folders = result.prefixes.map(prefixRef => ({
                name: prefixRef.name,
                fullPath: prefixRef.fullPath
            }));

            return {
                files: filesMetadata,
                folders: folders
            };
        } catch (error) {
            console.error(`Error listing blobs and folders for user ${userId}:`, error);
            throw error;
        }
    }

    isFirebaseStorageAvailable () {
        return this.firebaseApp() !== null;
    }

    firebaseApp () {
        // Check for cached storage instance (configured with emulator in firebase-shim.js)
        if (typeof globalThis !== "undefined" && globalThis._firebaseStorageInstance) {
            return globalThis._firebaseStorageInstance;
        }

        if (typeof firebase !== "undefined" && firebase && firebase.storage && firebase.app) {
            return firebase.app();
        }
        return null;
    }

    bucketName () {
        const app = this.firebaseApp();
        if (app) {
            let bucketName = null;

            if (typeof globalThis !== "undefined" && globalThis.UoBuildEnv) {
                bucketName = globalThis.UoBuildEnv.storageBucket;
            }

            if (!bucketName && app.options.storageBucket) {
                bucketName = app.options.storageBucket;
            }

            if (!bucketName) {
                throw new Error("Firebase Storage bucket found in UoBuildEnv or Firebase app options");
            }

            return bucketName;
        }
        return null;
    }

    /**
     * @description Gets Firebase Storage instance (reuses the initialized instance)
     * @returns {Object} Firebase Storage instance
     * @throws {Error} If Firebase Storage is not available
     * @category Helper
     */
    getFirebaseStorage () {
        const app = this.firebaseApp();
        if (app) {
            return app.storage(`gs://${this.bucketName()}`);
        }
        return null;
    }

    /**
     * @description Checks permissions for a given path based on security rules
     * This is a client-side simulation of the security rules, not a server check
     * @param {string} path - The storage path to check
     * @returns {Object} Object with canRead, canWrite, and anyoneCanRead boolean properties
     * @category Permissions
     */
    permissionsForPath (path) {
        const context = {
            auth: this.userId() ? { uid: this.userId() } : null
        };

        return this.permissions().evaluatePath(path, context);
    }

    async asyncTest () {
        if (!this._didTest) {
            this._didTest = true;
            console.log("================================================");
            console.log(this.logPrefix(), "testing...");

            const file = this.userFolder().fileNamedCreateIfAbsent("test.txt");
            console.log(this.logPrefix(), "File fullPath:", file.fullPath());
            console.log(this.logPrefix(), "File parent:", file.parentNode());
            console.log(this.logPrefix(), "userFolder:", this.userFolder().fullPath());
            file.setDataArrayBufferToString("Hello, world!");

            // test upload
            await file.asyncUpload();
            await new Promise(resolve => setTimeout(resolve, 1500)); // Delay for Firebase to propagate
            assert(await file.asyncDoesExist(), "File should exist");
            console.log(this.logPrefix(), "upload passed");

            // test download
            file.setDataArrayBuffer(null);
            await file.asyncDownload();
            const string = file.arrayBufferAsString();
            assert(string === "Hello, world!", "String should be 'Hello, world!'");
            console.log(this.logPrefix(), "download passed");

            // test delete
            await file.asyncDelete();
            await new Promise(resolve => setTimeout(resolve, 1500)); // Delay for Firebase to propagate

            {
                let deletedFile = this.userFolder().fileNamedCreateIfAbsent("test.txt");
                const exists = await deletedFile.asyncDoesExist();
                console.log(this.logPrefix(), "Deleted file exists:", exists);
                assert(!exists, "File should not exist");
                console.log(this.logPrefix(), "delete passed");
            }
            console.log("================================================");
        }
    }


}.initThisClass());
