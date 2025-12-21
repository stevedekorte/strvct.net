"use strict";

/**
 * @module library.services.Firebase
 */

/**
 * @class FirestoreNode
 * @extends SvSummaryNode
 * @classdesc Base class for Firestore nodes (documents and collections)
 *
 * Provides common functionality for working with Firestore, including:
 * - Path composition from node hierarchy
 * - Error handling
 * - Firestore database access with emulator support
 */

(class FirestoreNode extends SvSummaryNode {

    initPrototypeSlots () {

        // Base path (parent's Firestore path)
        {
            const slot = this.newSlot("basePath", null);
            slot.setLabel("Base Path");
            slot.setDescription("Parent's Firestore path (e.g., 'users' for a document, 'users/user123' for a subcollection)");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // Name (this node's identifier)
        {
            const slot = this.newSlot("name", null);
            slot.setLabel("Name");
            slot.setDescription("This node's name/identifier (collection name or document ID)");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
        }

        // Cloud path (the path currently stored in Firestore, null if not yet uploaded)
        {
            const slot = this.newSlot("cloudPath", null);
            slot.setLabel("Cloud Path");
            slot.setDescription("The path where this node exists in Firestore (null if not yet uploaded)");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // Error (if any operation failed)
        {
            const slot = this.newSlot("error", null);
            slot.setLabel("Error");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // Migrate action
        {
            const slot = this.newSlot("migrateAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Migrate to New Path");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncMigrate");
        }
    }

    /**
     * @description Composes the full Firestore path from basePath and name
     * @returns {string|null} The full path (e.g., 'users/user123' or 'users/user123/posts')
     * @category Firestore
     */
    path () {
        const basePath = this.basePath();
        const name = this.name();

        if (!name) {
            return basePath || null;
        }

        if (!basePath) {
            return name;
        }

        return basePath + "/" + name;
    }

    /**
     * @description Gets the Firestore database instance
     * @returns {Object} The Firestore database instance
     * @throws {Error} If Firebase Firestore is not available
     * @category Firestore Access
     */
    getFirestoreDb () {
        if (typeof firebase === "undefined" || !firebase.firestore) {
            throw new Error("Firebase Firestore web client not available");
        }

        const db = firebase.firestore();

        // Configure emulator if in local development
        this.configureEmulatorIfNeeded(db);

        return db;
    }

    /**
     * @description Configures Firestore emulator for local development
     * @param {Object} db - The Firestore database instance
     * @category Firestore Access
     */
    configureEmulatorIfNeeded (db) {
        try {
            const h = (typeof window !== "undefined" && window.location && window.location.hostname) || "";
            const isLocal = ["localhost", "127.0.0.1", "::1"].includes(h) || h.endsWith(".local") || h.endsWith(".test");
            if (isLocal && !window.__uo_firestore_emulator_configured__) {
                if (typeof db.useEmulator === "function") {
                    db.useEmulator("localhost", 8080);
                } else if (typeof db.settings === "function") {
                    db.settings({ host: "localhost:8080", ssl: false });
                }
                window.__uo_firestore_emulator_configured__ = true;
            }
        } catch (e) {
            console.warn("Firestore emulator configuration failed (non-fatal):", e);
        }
    }

    // --- Migration Support ---

    /**
     * @description Checks if this node exists in Firestore (has been uploaded)
     * @returns {boolean} True if cloudPath is set
     * @category Migration
     */
    existsInCloud () {
        return this.cloudPath() !== null;
    }

    /**
     * @description Checks if local path differs from cloud path (needs migration)
     * @returns {boolean} True if paths differ and node exists in cloud
     * @category Migration
     */
    needsMigration () {
        const cloudPath = this.cloudPath();
        if (!cloudPath) {
            return false; // Not in cloud yet, nothing to migrate
        }
        return this.path() !== cloudPath;
    }

    /**
     * @description Gets action info for migrate action
     * @returns {Object} Action info with isEnabled property
     * @category Actions
     */
    migrateActionInfo () {
        const needsMigration = this.needsMigration();
        const hasPath = this.path() !== null;

        if (!this.existsInCloud()) {
            return {
                isEnabled: false,
                isVisible: false,
                title: "Migrate to New Path",
                subtitle: "Not yet in cloud"
            };
        }

        if (!needsMigration) {
            return {
                isEnabled: false,
                isVisible: false,
                title: "Migrate to New Path",
                subtitle: "Paths match"
            };
        }

        return {
            isEnabled: hasPath,
            isVisible: true,
            title: "Migrate to New Path",
            subtitle: `${this.cloudPath()} → ${this.path()}`
        };
    }

    /**
     * @description Migrates this node from cloudPath to current path()
     * Subclasses must override this to implement actual migration logic
     * @returns {Promise<void>}
     * @category Migration
     */
    async asyncMigrate () {
        throw new Error("Subclass must implement asyncMigrate()");
    }

    /**
     * @description Updates cloudPath after successful upload/migration
     * @category Migration
     */
    syncCloudPath () {
        this.setCloudPath(this.path());
    }

}.initThisClass());
