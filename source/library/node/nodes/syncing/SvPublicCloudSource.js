"use strict";

/**
 * @module library.node.nodes.syncing
 * @class SvPublicCloudSource
 * @extends SvCloudSyncSource
 * @description Sync source for public Firebase Cloud Storage paths.
 *
 * Unlike SvCloudSyncSource which constructs paths from userId/folderName,
 * this class uses an arbitrary cloud path (e.g., "public/Genre/Sword & Sorcery/Campaigns").
 *
 * Read/write access is controlled by Firebase Storage security rules, not client code.
 * Typically: anyone can read, only admins can write.
 *
 * Storage structure:
 * /{cloudPath}/
 *     _manifest.json           - Collection manifest
 *     {jsonId}.json            - Item data (plain JSON)
 */
(class SvPublicCloudSource extends SvCloudSyncSource {

    static jsonSchemaDescription () {
        return "Sync source for public Firebase Cloud Storage paths";
    }

    initPrototypeSlots () {
        /**
         * @member {String} cloudPath - The full cloud storage path
         */
        {
            const slot = this.newSlot("cloudPath", null);
            slot.setSlotType("String");
            slot.setDescription("Full cloud storage path (e.g., 'public/Genre/Sword & Sorcery/Default Characters')");
        }
    }

    initPrototype () {
        this.setIsDebugging(false);
    }

    // --- Path Construction (overrides SvCloudSyncSource) ---

    /**
     * Returns the cloud path directly, ignoring userId/folderName.
     * @returns {String}
     * @category Paths
     */
    basePath () {
        const path = this.cloudPath();
        if (!path) {
            throw new Error("SvPublicCloudSource requires a cloudPath to be set");
        }
        return path;
    }

    /**
     * Creates a sync source for a sub-collection within this public path.
     * @param {String} subCollectionId - The sub-collection identifier
     * @returns {SvPublicCloudSource} A new sync source for the sub-collection
     * @category Paths
     */
    syncSourceForSubCollection (subCollectionId) {
        const subSource = this.thisClass().clone();
        subSource.setCloudPath(this.basePath() + "/" + subCollectionId);
        subSource.setStorageRef(this.storageRef());
        return subSource;
    }

}.initThisClass());
