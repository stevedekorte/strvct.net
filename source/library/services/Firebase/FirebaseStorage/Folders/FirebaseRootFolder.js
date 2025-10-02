"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirebaseRootFolder
 * @extends FirebaseFolder
 * @classdesc Represents the root of Firebase Storage bucket
 *
 * This class extends FirebaseFolder to provide the top-level entry point
 * for navigating Firebase Storage. It uses an empty path to represent the
 * bucket root, with subfolders for users/, public/, and shared/.
 */
(class FirebaseRootFolder extends FirebaseFolder {

    initPrototypeSlots () {

    }

    initPrototype () {
        this.setName("root");
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
    }

    /**
     * @description Disables refresh action for root folder (no permissions to list bucket root)
     * @returns {Object} Action info with isEnabled false
     * @category Actions
     */
    asyncReadSubnodesActionInfo () {
        return {
            isEnabled: false,
            title: "Cannot list bucket root (use user folders instead)"
        };
    }

    /**
     * @description Gets or creates a folder for a user (within users/ folder)
     * @param {string} userId - The user ID
     * @returns {FirebaseFolder} The user's folder
     * @category Helper
     */
    folderForUser (userId) {
        const usersFolder = this.subfolderNamedCreateIfAbsent("users");
        const userFolder = usersFolder.subfolderNamedCreateIfAbsent(userId);
        return userFolder;
    }


}.initThisClass());
