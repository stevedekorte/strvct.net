/**
 * @module webserver/orm
 */

"use strict";

const { SvBase } = require("../../../GameServer/site/strvct/webserver");

// Zone.js initialization helper
const loadZoneJs = require("./external-libs/zonejs/ZoneJS_init.js");

/**
 * @class SvDbTx
 * @extends Base
 * @classdesc Manages database transactions with automatic commit/rollback and listener-based execution.
 *
 * This class provides a safe, managed approach to database transactions using a listener pattern
 * that ensures proper transaction lifecycle management. It automatically handles commit on success
 * and rollback on errors, preventing transaction leaks and ensuring data consistency.
 *
 * Key features:
 * - Callback-based transaction execution with automatic lifecycle management
 * - Integration with Sequelize transaction system for underlying database operations
 * - Automatic commit on successful completion of callback
 * - Automatic rollback on any errors or exceptions during callback execution
 * - Observer pattern with listeners for transaction lifecycle events (onTxCommit/onTxRollback)
 * - Prevention of nested transactions and proper cleanup of database state
 * - Error propagation while maintaining transaction integrity
 *
 * The transaction enforces that all database operations must occur within a transaction scope,
 * providing ACID guarantees and preventing partial updates that could leave the database
 * in an inconsistent state.
 *
 * Usage:
 * ```javascript
 * const tx = database.newTx();
 *
 * // Add listener for transaction lifecycle events
 * tx.addListener({
 *   onTxCommit: (tx) => console.log(this.logPrefix(), "Transaction committed successfully"),
 *   onTxRollback: (tx) => console.log(this.logPrefix(), "Transaction rolled back")
 * });
 *
 * const result = await tx.begin(async () => {
 *   await database.insert("users", userData);
 *   await database.update("profiles", profileData);
 *   return "All operations completed successfully";
 * });
 * // Listeners automatically notified on commit/rollback
 * ```
 */
(class SvDbTx extends SvBase {

    /**
     * @description Initialize prototype slots for the SvDbTx.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            this.newSlot("database", null);
        }

        {
            this.newSlot("sequelizeTransaction", null);
        }

        {
            this.newSlot("isActive", false);
        }

        {
            this.newSlot("txRef", null);
        }

        {
            this.newSlot("listeners", null);
        }
    }

    /**
     * @description Initialize prototype for the SvDbTx.
     * @category Initialization
     */
    initPrototype () {
        // Prototype initialization will be implemented here
    }

    init () {
        super.init();
        this.setListeners([]);
        return this;
    }

    /**
     * Begin the transaction and execute callback within transaction scope
     * Uses Zone.js to store transaction context, eliminating need to pass tx parameter
     * @param {Function} callback - Async function to execute within transaction
     * @returns {Promise<any>} Result of the callback
     */
    async begin (callback) {
        if (!this.database()) {
            throw new Error("Transaction has no database reference");
        }

        if (!callback || typeof callback !== "function") {
            throw new Error("Transaction begin() requires a callback function");
        }

        // Initialize Zone.js and create transaction zone
        loadZoneJs();

        await this.database().onBegin(this);

        // Run callback in Zone with transaction context
        return Zone.current.fork({
            name: "SvDbTx",
            properties: {
                currentTx: this
            }
        }).run(async () => {
            try {
                const result = await callback();
                await this.commit();
                return result;
            } catch (error) {
                await this.rollback();
                throw error;
            }
        });
    }

    /**
     * Add a listener object to receive transaction lifecycle messages
     * @param {Object} listener - Object that may respond to onTxCommit and/or onTxRollback
     */
    addListener (listener) {
        if (!listener || typeof listener !== "object") {
            throw new Error("Listener must be an object");
        }
        this.listeners().push(listener);
    }

    /**
     * Remove a listener from the transaction
     * @param {Object} listener - The listener to remove
     */
    removeListener (listener) {
        const listeners = this.listeners();
        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }


    /**
     * Notify all listeners that the transaction has committed
     */
    notifyCommitListeners () {
        for (const listener of this.listeners()) {
            if (listener && typeof listener.onTxCommit === "function") {
                listener.onTxCommit(this);
            }
        }
        this.clearListeners();
    }

    /**
     * Notify all listeners that the transaction has rolled back
     */
    notifyRollbackListeners () {
        for (const listener of this.listeners()) {
            if (listener && typeof listener.onTxRollback === "function") {
                listener.onTxRollback(this);
            }
        }
        this.clearListeners();
    }


    /**
     * Clear all listeners without notifying them
     */
    clearListeners () {
        this.setListeners([]);
    }


    /**
     * Commit the transaction
     * @returns {Promise<SvDbTx>} This transaction instance
     */
    async commit () {
        if (!this.database()) {
            throw new Error("Transaction has no database reference");
        }

        await this.database().onCommit(this);

        // Notify listeners after successful database commit
        this.notifyCommitListeners();

        return this;
    }

    /**
     * Rollback the transaction
     * @returns {Promise<SvDbTx>} This transaction instance
     */
    async rollback () {
        if (!this.database()) {
            throw new Error("Transaction has no database reference");
        }

        await this.database().onRollback(this);

        // Notify listeners of rollback
        this.notifyRollbackListeners();

        return this;
    }

}).initThisClass();

module.exports = SvDbTx;
