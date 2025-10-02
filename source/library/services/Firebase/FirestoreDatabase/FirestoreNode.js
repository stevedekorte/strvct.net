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

        // Path (Firestore path string)
        {
            const slot = this.newSlot("path", null);
            slot.setDescription("Firestore path (e.g., 'users' or 'users/user123' or 'users/user123/posts')");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // Error (if any operation failed)
        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("String");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }
    }

    /**
     * @description Gets the name (last segment of path)
     * @returns {string|null} The name/ID from the path
     * @category Firestore
     */
    name () {
        const path = this.path();
        if (!path) return null;
        const parts = path.split("/");
        return parts[parts.length - 1];
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

}.initThisClass());
