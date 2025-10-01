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
        const storage = this.getFirebaseStorage();
        return storage.ref(this.fullPath());
    }

}.initThisClass());
