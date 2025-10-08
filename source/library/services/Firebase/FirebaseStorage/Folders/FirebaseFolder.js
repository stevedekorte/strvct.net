"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirebaseFolder
 * @extends FirebaseNode
 * @classdesc Represents a folder (prefix) in Firebase Storage
 *
 * This class represents a folder in Firebase Storage. Its subnodes can be
 * a mix of FirebaseFolder and FirebaseFile instances, creating a hierarchical
 * structure that mirrors the Firebase Storage organization.
 *
 * ## Folder Structure Convention
 *
 * Firebase Storage uses top-level folders to separate access patterns:
 *
 * ```
 * storage/
 * ├── users/{userId}/       # User-specific files (private)
 * │   ├── images/
 * │   ├── documents/
 * │   └── ...
 * ├── public/               # Public shared resources
 * │   ├── game-assets/
 * │   ├── templates/
 * │   └── ...
 * └── shared/               # Collaborative files (optional)
 *     └── ...
 * ```
 *
 * This structure enables clean security rules:
 * - `users/{userId}/` - Only the owner can access
 * - `public/` - Everyone can read, authenticated users can write
 * - `shared/` - Collaborative access with specific permissions
 */
(class FirebaseFolder extends FirebaseNode {

    initPrototypeSlots () {

        // Whether contents have been loaded
        {
            const slot = this.newSlot("isLoaded", false);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(false);
        }

        // Read subnodes action
        {
            const slot = this.newSlot("asyncReadSubnodesAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Refresh");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(false);
            slot.setCanInspect(true);
            slot.setActionMethodName("asyncReadSubnodes");
        }

    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
        this.setSubnodeClasses([FirebaseFolder, FirebaseFile]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(false);
    }

    /**
     * @description Gets the title for display
     * @returns {string} The folder name
     * @category Display
     */
    title () {
        return this.name() || "Unnamed";
    }

    /**
     * @description Gets the subtitle for display
     * @returns {string} Count of items in folder
     * @category Display
     */
    subtitle () {
        const folders = this.subfolders().length;
        const files = this.files().length;
        const parts = [];

        if (folders > 0) {
            parts.push(`${folders} folder${folders !== 1 ? "s" : ""}`);
        }
        if (files > 0) {
            parts.push(`${files} file${files !== 1 ? "s" : ""}`);
        }

        return parts.length > 0 ? parts.join(", ") : "empty";
    }

    /**
     * @description Gets action info for refresh action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    asyncReadSubnodesActionInfo () {
        const canRead = this.canRead();
        return {
            isEnabled: canRead,
            title: "Refresh from Firebase",
            subtitle: canRead ? null : "No read permission"
        };
    }

    /**
     * @description Gets all subfolders
     * @returns {Array<FirebaseFolder>} Array of subfolders
     * @category Query
     */
    subfolders () {
        return this.subnodes().filter(node => node.svType() === "FirebaseFolder");
    }

    /**
     * @description Gets all files in this folder
     * @returns {Array<FirebaseFile>} Array of files
     * @category Query
     */
    files () {
        return this.subnodes().filter(node => node.svType() === "FirebaseFile");
    }

    /**
     * @description Finds a subfolder by name
     * @param {string} name - The folder name to find
     * @returns {FirebaseFolder|null} The found folder or null
     * @category Query
     */
    subfolderNamed (name) {
        return this.subfolders().find(folder => folder.name() === name);
    }

    /**
     * @description Gets a subfolder by name, creating it if it doesn't exist
     * @param {string} name - The folder name
     * @returns {FirebaseFolder} The found or created folder
     * @category Helper
     */
    subfolderNamedCreateIfAbsent (name) {
        let subfolder = this.subfolderNamed(name);
        if (!subfolder) {
            subfolder = FirebaseFolder.clone();
            subfolder.setName(name);
            this.addSubnode(subfolder);
        }
        return subfolder;
    }

    subfolderAtPathCreateIfAbsent (path) {
        const pathArray = path.split("/");
        let subfolder = this;
        for (const name of pathArray) {
            subfolder = subfolder.subfolderNamedCreateIfAbsent(name);
        }
        return subfolder;
    }

    fileAtPath (path) {
        const pathArray = path.split("/");
        const fileName = pathArray.pop();
        const folder = this.subfolderAtPath(pathArray.join("/"));
        const file = folder.fileNamed(fileName);
        return file;
    }

    fileAtPathCreateIfAbsent (path) {
        const pathArray = path.split("/");
        const fileName = pathArray.pop();
        const folder = this.subfolderAtPathCreateIfAbsent(pathArray.join("/"));
        const file = folder.fileNamedCreateIfAbsent(fileName);
        return file;
    }

    /**
     * @description Finds a file by name
     * @param {string} name - The file name to find
     * @returns {FirebaseFile|null} The found file or null
     * @category Query
     */
    fileNamed (name) {
        return this.files().find(file => file.name() === name);
    }

    fileNamedCreateIfAbsent (name) {
        let file = this.fileNamed(name);
        if (!file) {
            file = FirebaseFile.clone();
            file.setName(name);
            this.addSubnode(file);
        }
        return file;
    }

    /**
     * @deprecated Use fileNamed() instead
     */
    blobNamed (name) {
        return this.fileNamed(name);
    }


    /**
     * @description Syncs subnodes with Firebase Storage contents
     * Removes subnodes not found on server, adds new ones from server
     * @returns {Promise<void>}
     * @category Storage Operations
     */
    async asyncReadSubnodes () {
        try {
            this.setError(null);
            const storage = this.getFirebaseStorage();
            const folderRef = storage.ref(this.fullPath());

            // List all items in this folder
            const result = await folderRef.listAll();

            // Get server folder names and file names
            const serverFolderNames = new Set(result.prefixes.map(ref => ref.name));
            const serverFileNames = new Set(result.items.map(ref => ref.name));

            // Remove subnodes not found on server
            const existingSubnodes = this.subnodes().slice(); // Copy array
            for (const subnode of existingSubnodes) {
                // Skip non-Firebase nodes (like action fields)
                if (!subnode.isKindOf(FirebaseNode)) {
                    throw new Error("subnode is not a FirebaseNode: " + subnode.svType());
                }

                const name = subnode.name();
                if (subnode.svType() === "FirebaseFolder") {
                    if (!serverFolderNames.has(name)) {
                        this.removeSubnode(subnode);
                    }
                } else if (subnode.svType() === "FirebaseFile") {
                    if (!serverFileNames.has(name)) {
                        this.removeSubnode(subnode);
                    }
                }
            }

            // Add new subfolders not already present
            for (const prefixRef of result.prefixes) {
                const existingFolder = this.subfolderNamed(prefixRef.name);
                if (!existingFolder) {
                    const subfolder = FirebaseFolder.clone();
                    subfolder.setName(prefixRef.name);
                    this.addSubnode(subfolder);
                }
            }

            // Add new files not already present (with metadata)
            const newFiles = await Promise.all(
                result.items
                    .filter(itemRef => !this.fileNamed(itemRef.name))
                    .map(itemRef => FirebaseFile.clone().setItemRef(itemRef))
            );

            // Add all new files
            newFiles.forEach(file => this.addSubnode(file));

            this.setIsLoaded(true);
        } catch (error) {
            console.error(`Error reading subnodes for ${this.fullPath()}:`, error);
            this.setError(error);
            throw error;
        }
    }

    /**
     * @description Refreshes the contents of this folder
     * @returns {Promise<void>}
     * @category Storage Operations
     */
    async asyncRefresh () {
        return this.asyncReadSubnodes();
    }

    /**
     * @description Creates a new subfolder (note: Firebase Storage requires at least one file)
     * @param {string} name - The folder name
     * @returns {FirebaseFolder} The created folder instance
     * @category Storage Operations
     */
    createSubfolder (name) {
        const subfolder = FirebaseFolder.clone();
        subfolder.setName(name);
        this.addSubnode(subfolder);
        return subfolder;
    }

    /**
     * @description Deletes this folder and all its contents
     * @returns {Promise<void>}
     * @category Storage Operations
     */
    async asyncDeleteRecursively () {
        try {
            this.setError(null);

            // Load contents if not loaded
            if (!this.isLoaded()) {
                await this.asyncReadSubnodes();
            }

            // Delete all files
            const deletePromises = this.files().map(file => file.asyncDelete());
            await Promise.all(deletePromises);

            // Recursively delete subfolders
            const subfoldersToDelete = this.subfolders();
            for (const subfolder of subfoldersToDelete) {
                await subfolder.asyncDeleteRecursively();
            }

            // Remove from parent
            const parent = this.parentNode();
            if (parent && parent.removeSubnode) {
                parent.removeSubnode(this);
            }
        } catch (error) {
            console.error(`Error deleting folder ${this.fullPath()}:`, error);
            this.setError(error);
            throw error;
        }
    }

    /**
     * @description Gets total size of all files in this folder and subfolders
     * @returns {Promise<number>} Total size in bytes
     * @category Query
     */
    async asyncGetTotalSize () {
        try {
            this.setError(null);

            if (!this.isLoaded()) {
                await this.asyncReadSubnodes();
            }

            let total = this.files().reduce((sum, file) => sum + file.size(), 0);

            // Add sizes from subfolders
            for (const subfolder of this.subfolders()) {
                total += await subfolder.asyncGetTotalSize();
            }

            return total;
        } catch (error) {
            console.error(`Error getting total size for ${this.fullPath()}:`, error);
            this.setError(error);
            throw error;
        }
    }

}.initThisClass());
