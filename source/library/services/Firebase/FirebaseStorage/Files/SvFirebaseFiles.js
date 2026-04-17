"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class SvFirebaseFiles
 * @extends SvJsonArrayNode
 * @classdesc Collection of Firebase Storage files
 *
 * This class manages a collection of SvFirebaseFile instances.
 */
(class SvFirebaseFiles extends SvJsonArrayNode {

    initPrototype () {
        this.setTitle("Files");
        this.setSubnodeClasses([SvFirebaseFile]);
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
    }

    /**
     * @description Finds a file by name
     * @param {string} name - The file name to find
     * @returns {SvFirebaseFile|null} The found file or null
     * @category Query
     */
    blobNamed (name) {
        return this.subnodes().find(blob => blob.name() === name);
    }

    /**
     * @description Finds a file by full path
     * @param {string} fullPath - The full path to find
     * @returns {SvFirebaseFile|null} The found file or null
     * @category Query
     */
    blobWithPath (fullPath) {
        return this.subnodes().find(blob => blob.fullPath() === fullPath);
    }

    /**
     * @description Gets files sorted by name
     * @returns {Array<SvFirebaseFile>} Sorted array of files
     * @category Query
     */
    blobsSortedByName () {
        return this.subnodes().slice().sort((a, b) => {
            return a.name().localeCompare(b.name());
        });
    }

    /**
     * @description Gets files sorted by date (newest first)
     * @returns {Array<SvFirebaseFile>} Sorted array of files
     * @category Query
     */
    blobsSortedByDate () {
        return this.subnodes().slice().sort((a, b) => {
            const dateA = new Date(a.timeCreated());
            const dateB = new Date(b.timeCreated());
            return dateB - dateA;
        });
    }

    /**
     * @description Gets total size of all files
     * @returns {number} Total size in bytes
     * @category Query
     */
    totalSize () {
        return this.subnodes().reduce((total, blob) => total + blob.size(), 0);
    }

}.initThisClass());
