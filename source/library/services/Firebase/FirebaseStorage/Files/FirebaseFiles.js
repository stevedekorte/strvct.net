"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirebaseFiles
 * @extends SvJsonArrayNode
 * @classdesc Collection of Firebase Storage files
 *
 * This class manages a collection of FirebaseFile instances.
 */
(class FirebaseFiles extends SvJsonArrayNode {

    initPrototype () {
        this.setTitle("Files");
        this.setSubnodeClasses([FirebaseFile]);
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
    }

    /**
     * @description Finds a file by name
     * @param {string} name - The file name to find
     * @returns {FirebaseFile|null} The found file or null
     * @category Query
     */
    blobNamed (name) {
        return this.subnodes().find(blob => blob.name() === name);
    }

    /**
     * @description Finds a file by full path
     * @param {string} fullPath - The full path to find
     * @returns {FirebaseFile|null} The found file or null
     * @category Query
     */
    blobWithPath (fullPath) {
        return this.subnodes().find(blob => blob.fullPath() === fullPath);
    }

    /**
     * @description Gets files sorted by name
     * @returns {Array<FirebaseFile>} Sorted array of files
     * @category Query
     */
    blobsSortedByName () {
        return this.subnodes().slice().sort((a, b) => {
            return a.name().localeCompare(b.name());
        });
    }

    /**
     * @description Gets files sorted by date (newest first)
     * @returns {Array<FirebaseFile>} Sorted array of files
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
