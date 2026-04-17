"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class SvFirebaseFolders
 * @extends SvJsonArrayNode
 * @classdesc Collection of Firebase Storage folders
 *
 * This class manages a collection of SvFirebaseFolder instances.
 */
(class SvFirebaseFolders extends SvJsonArrayNode {

    initPrototype () {
        this.setTitle("Folders");
        this.setSubnodeClasses([SvFirebaseFolder]);
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
    }

    /**
     * @description Finds a folder by name
     * @param {string} name - The folder name to find
     * @returns {SvFirebaseFolder|null} The found folder or null
     * @category Query
     */
    folderNamed (name) {
        return this.subnodes().find(folder => folder.name() === name);
    }

    /**
     * @description Finds a folder by full path
     * @param {string} fullPath - The full path to find
     * @returns {SvFirebaseFolder|null} The found folder or null
     * @category Query
     */
    folderWithPath (fullPath) {
        return this.subnodes().find(folder => folder.fullPath() === fullPath);
    }

    /**
     * @description Gets folders sorted by name
     * @returns {Array<SvFirebaseFolder>} Sorted array of folders
     * @category Query
     */
    foldersSortedByName () {
        return this.subnodes().slice().sort((a, b) => {
            return a.name().localeCompare(b.name());
        });
    }

    /**
     * @description Reads subnodes for all folders
     * @returns {Promise<void>}
     * @category Storage Operations
     */
    async asyncReadAllSubnodes () {
        const promises = this.subnodes().map(folder => folder.asyncReadSubnodes());
        await Promise.all(promises);
    }

    /**
     * @description Gets total size of all folders
     * @returns {Promise<number>} Total size in bytes
     * @category Query
     */
    async asyncTotalSize () {
        const sizes = await Promise.all(
            this.subnodes().map(folder => folder.asyncGetTotalSize())
        );
        return sizes.reduce((sum, size) => sum + size, 0);
    }

}.initThisClass());
