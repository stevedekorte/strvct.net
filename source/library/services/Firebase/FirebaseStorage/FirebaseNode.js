"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirebaseNode
 * @extends SvSummaryNode
 * @classdesc Base class for Firebase Storage nodes (files and folders)
 *
 * Provides common functionality for navigating the Firebase Storage hierarchy
 * and computing paths from the node structure.
 */
(class FirebaseNode extends SvSummaryNode {

    initPrototypeSlots () {

        // Node name (file or folder name)
        {
            const slot = this.newSlot("name", null);
            slot.setLabel("Name");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(false);
            slot.setCanEditInspection(true);
            slot.setCanInspect(true);
        }

        // Error (if any operation failed)
        {
            const slot = this.newSlot("error", null);
            slot.setLabel("Error");
            slot.setSlotType("Error");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
        }

    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
    }

    /**
     * @description Gets the parent folder
     * @returns {FirebaseFolder|null} The parent folder or null if at root
     * @category Hierarchy
     */
    parentFolder () {
        const p = this.parentNode();
        if (p && p.isKindOf(FirebaseFolder)) {
            return p;
        }
        return null;
    }

    /**
     * @description Computes the full storage path from the folder hierarchy
     * @returns {string} The full path composed from parent folder names
     * @category Hierarchy
     */
    fullPath () {
        const segments = [];
        let current = this;

        while (current) {
            const name = current.name();
            if (name && name !== "root") {
                segments.unshift(name);
            }

            if (current.isKindOf(FirebaseFolder)) {
                current = current.parentFolder();
            } else {
                // For files, get parent folder and continue
                current = current.parentFolder();
            }
        }

        return segments.join("/");
    }

    firebaseStorageService () {
        return FirebaseService.shared().firebaseStorageService();
    }

    /**
     * @description Gets Firebase Storage instance
     * @returns {Object} Firebase Storage instance
     * @throws {Error} If Firebase Storage is not available
     * @category Helper
     */
    getFirebaseStorage () {
        return this.firebaseStorageService().getFirebaseStorage();
    }

    /**
     * @description Gets the Firebase Storage reference for this node
     * @returns {Object} Firebase Storage reference
     * @category Helper
     */
    storageRef () {
        assert(this.parentNode(), "storageRef must be called on a node with a parent");
        const storage = this.getFirebaseStorage();
        return storage.ref(this.fullPath());
    }

    /**
     * @description Checks if current user can read from this path based on security rules
     * This is a client-side simulation of the security rules, not a server check
     * @returns {boolean} True if user likely has read permission
     * @category Permissions
     */
    canRead () {
        const permissions = this.firebaseStorageService().permissionsForPath(this.fullPath());
        return permissions.canRead;
    }

    /**
     * @description Checks if current user can write to this path based on security rules
     * This is a client-side simulation of the security rules, not a server check
     * @returns {boolean} True if user likely has write permission
     * @category Permissions
     */
    canWrite () {
        const permissions = this.firebaseStorageService().permissionsForPath(this.fullPath());
        return permissions.canWrite;
    }

    /**
     * @description Checks if anyone (including unauthenticated users) can read from this path
     * This is a client-side simulation of the security rules, not a server check
     * @returns {boolean} True if path allows public read access
     * @category Permissions
     */
    anyoneCanRead () {
        const permissions = this.firebaseStorageService().permissionsForPath(this.fullPath());
        return permissions.anyoneCanRead;
    }

}.initThisClass());
