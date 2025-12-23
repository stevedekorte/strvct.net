/**
 * @module library.node.nodes.syncing
 * @class SvLocalResourceSource
 * @extends SvSyncCollectionSource
 * @description Read-only sync source for bundled JSON resources.
 *
 * Used for loading default/template data that ships with the application.
 * Data is loaded from the CAM (content-addressable memory) resource system.
 *
 * Resource structure:
 * /resources/json/{folderName}/
 *     _manifest.json           - Collection manifest
 *     {jsonId}.json            - Item data (plain JSON)
 */
(class SvLocalResourceSource extends SvSyncCollectionSource {

    static jsonSchemaDescription () {
        return "Read-only sync source for bundled JSON resources";
    }

    initPrototypeSlots () {
        /**
         * @member {String} resourceBasePath - Base path to resources folder
         */
        {
            const slot = this.newSlot("resourceBasePath", "resources/json");
            slot.setSlotType("String");
            slot.setDescription("Base path to resources folder");
        }

        /**
         * @member {String} folderName - The folder name within resources
         */
        {
            const slot = this.newSlot("folderName", null);
            slot.setSlotType("String");
            slot.setDescription("Folder name (e.g., 'default-characters')");
        }
    }

    initPrototype () {
        this.setIsReadOnly(true);
    }

    // --- Path Construction ---

    /**
     * Gets the base path for this collection in resources.
     * @returns {String}
     * @category Paths
     */
    basePath () {
        return `${this.resourceBasePath()}/${this.folderName()}`;
    }

    /**
     * Gets the path to the manifest file.
     * @returns {String}
     * @category Paths
     */
    manifestPath () {
        return `${this.basePath()}/_manifest.json`;
    }

    /**
     * Gets the path to an item file.
     * @param {String} itemId - The item's jsonId
     * @returns {String}
     * @category Paths
     */
    itemPath (itemId) {
        return `${this.basePath()}/${itemId}.json`;
    }

    // --- Abstract Method Implementations ---

    /**
     * Fetches the manifest from bundled resources.
     * @returns {Promise<Object>}
     * @category Sync
     */
    async asyncFetchManifest () {
        const resource = this.resourceAtPath(this.manifestPath());
        if (!resource) {
            console.warn(`No manifest found at ${this.manifestPath()}`);
            return this.emptyManifest();
        }

        const data = await resource.asyncData();
        if (!data) {
            console.warn(`Empty manifest at ${this.manifestPath()}`);
            return this.emptyManifest();
        }

        if (typeof data === "string") {
            return JSON.parse(data);
        }
        return data;
    }

    /**
     * Fetches an item's JSON data from bundled resources.
     * @param {String} itemId
     * @returns {Promise<Object>}
     * @category Sync
     */
    async asyncFetchItem (itemId) {
        const path = this.itemPath(itemId);
        const resource = this.resourceAtPath(path);
        if (!resource) {
            throw new Error(`Resource not found: ${path}`);
        }

        const data = await resource.asyncData();
        if (!data) {
            throw new Error(`Empty resource: ${path}`);
        }

        if (typeof data === "string") {
            return JSON.parse(data);
        }
        return data;
    }

    // --- Resource Helpers ---

    /**
     * Gets a resource at the specified path.
     * @param {String} path - Resource path
     * @returns {Object|null} Resource object or null
     * @category Resources
     */
    resourceAtPath (path) {
        // Access the resource manager to get the resource
        const resourceManager = SvResourceManager.shared();
        return resourceManager.resourceAtPath(path);
    }

    /**
     * Checks if the resources for this source exist.
     * @returns {Boolean}
     * @category Resources
     */
    hasResources () {
        const manifestResource = this.resourceAtPath(this.manifestPath());
        return manifestResource !== null && manifestResource !== undefined;
    }

    // --- Override write methods to throw ---

    async asyncUploadItem (item) {
        throw new Error("SvLocalResourceSource is read-only");
    }

    async asyncUploadManifest () {
        throw new Error("SvLocalResourceSource is read-only");
    }

    async asyncDeleteItem (itemId) {
        throw new Error("SvLocalResourceSource is read-only");
    }

}.initThisClass());
