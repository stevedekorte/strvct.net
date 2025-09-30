/**
 * @module webserver/orm
 */

"use strict";

const assert = require("assert");
const { Base } = require("../../../GameServer/site/strvct/webserver");
// const SvDbTable = require("./SvDbTable");
// const SvDbColumn = require("./SvDbColumn");

// Zone.js initialization helper
require("./external-libs/zonejs/ZoneJS_init.js");

/**
 * @class SvDbRow
 * @extends Base
 * @classdesc Represents a single database row with data validation and persistence operations.
 *
 * This class provides an Active Record pattern implementation where each instance represents
 * a single row of data from a database table. It handles data storage, validation, and
 * persistence operations while maintaining the relationship with its parent table.
 *
 * Key features:
 * - Data storage in a dictionary format with column validation
 * - Automatic validation against table schema (column names and types)
 * - Convenience save() method for CRUD operations (automatic insert/update detection)
 * - Support for custom row classes per table via inheritance
 * - Integration with the table's column metadata for data integrity
 *
 * The row validates all data against the table's column definitions and provides
 * a clean interface for working with individual records. Custom row classes can
 * extend SvDbRow to add domain-specific methods and validation logic.
 *
 * Usage:
 * ```javascript
 * const tx = database.newTx();
 * await tx.begin(async () => {
 *   // Create new row (insert)
 *   const row = table.rowClass().clone();
 *   row.setRowKeyValue("name", "John Doe");
 *   row.setRowKeyValue("email", "john@example.com");
 *   await row.save(tx); // Automatically inserts (no primary key)
 *
 *   // Update existing row
 *   row.setRowKeyValue("name", "Jane Doe");
 *   await row.save(tx); // Automatically updates (has primary key)
 * });
 * ```
 */
(class SvDbRow extends SvBase {

    /**
     * @description Initialize prototype slots for the SvDbRow.
     * @category Initialization
     */
    initPrototypeSlots () {
        // Prototype slots will be defined here
        {
            this.newSlot("table", null);
        }

        {
            this.newSlot("dict", null);
        }

        {
            this.newSlot("oldDict", null);
        }

        {
            this.newSlot("isDirty", false);
        }

        {
            // This is the transaction that has modified this row.
            // If another transaction tries to modify this row, while this is set, it will throw an error.
            // We use whether this is null or not to determine isDirty().
            // Upon commit or rollback, this is set to null.
            this.newSlot("editingTx", null);
        }
    }

    /**
     * @description Initialize prototype for the SvDbRow.
     * @category Initialization
     */
    initPrototype () {
        // Prototype initialization will be implemented here
    }

    init () {
        super.init();
        this.setDict({});
        this.setOldDict({});
    }

    isDirty () {
        return this.editingTx() !== null;
    }

    // --- helpers ---

    rowKeysSet () {
        return this.table().columnNamesSet();
    }

    tableName () {
        return this.table().tableName();
    }

    // --- dict ---

    copyOldDictFromDict () {
        this.setOldDict(Object.assign({}, this.dict()));
    }

    setupFromDict (rowDict) {
        // Check if we're getting a new primary key value
        const oldPrimaryKeyValue = this.primaryKeyValue();

        this.setDict({});

        Reflect.ownKeys(rowDict).forEach(key => {
            // this will validate the key and value
            this.setRowKeyValue(key, rowDict[key]);
        });
        this.copyOldDictFromDict();

        // Check if primary key was assigned
        const newPrimaryKeyValue = this.primaryKeyValue();

        // If we didn't have a primary key before but we do now, notify the table
        if ((oldPrimaryKeyValue === undefined || oldPrimaryKeyValue === null) &&
            (newPrimaryKeyValue !== undefined && newPrimaryKeyValue !== null)) {
            this.table().onAssignedIdToRow(this); // so it can be cached
        }
    }

    hasColumnName (key) {
        // assert key is valid
        const columnMap = this.table().nameToColumnMap();
        const column = columnMap.get(key);
        if (!column) {
            return false;
        }
        return true;
    }

    setRowKeyValue (key, value) {
        // only set the value if it is different from the old value
        if (this.dict()[key] === value) {
            return this;
        }

        // Validate key exists
        if (!this.hasColumnName(key)) {
            throw new Error(`table ${this.table().tableName()} has no column with name: ${key}`);
        }

        // Validate value using column's validation method
        const column = this.table().columnWithName(key);
        const validation = column.validateValue(value);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const currentTx = this.table().database().currentTx();

        if (currentTx === null) {
            throw new Error("attempt to modify a row outside of a transaction is not allowed");
        }

        if (this.editingTx() !== null && this.editingTx() !== currentTx) {
            throw new Error("attempt to modify a row that is being edited by another transaction is not allowed");
        }

        // Set editing transaction if not already set
        if (this.editingTx() === null) {
            // Take a snapshot of current state before first modification
            this.copyOldDictFromDict();
            this.setEditingTx(currentTx);
            // Register as listener for transaction lifecycle events
            currentTx.addListener(this);
        }

        this.dict()[key] = value;

        return this;
    }

    getRowKey (key) {
        return this.dict()[key];
    }

    asDict () {
        return this.dict();
    }

    primaryKeyName () {
        return this.table().primaryKeyName();
    }

    primaryKeyValue () {
        const pkName = this.primaryKeyName();
        return pkName ? this.dict()[pkName] : null;
    }

    async insert (tx) {
        return await this.table().insertRow(this, tx);
    }

    async update (tx) {
        return await this.table().updateRow(this, tx);
    }

    async delete (tx) {
        if (!tx) {
            throw new Error("Transaction required for delete() operation");
        }

        const primaryKeyValue = this.primaryKeyValue();
        if (primaryKeyValue === undefined || primaryKeyValue === null) {
            throw new Error("Row must have a primary key to delete");
        }
        return await this.table().deleteRow(this, tx);
    }

    /**
     * Save the row to the database (insert if new, update if existing)
     * Uses Zone.js to get current transaction context, no tx parameter needed
     * @param {SvDbTx} [tx] - Optional transaction (will use current Zone context if not provided)
     * @returns {Promise<Object>} The saved row data from database
     */
    async save (tx) {
        // Get transaction from Zone context if not provided
        if (!tx) {
            tx = this.table().database().currentTx();
        }

        if (!tx) {
            throw new Error("No transaction context available. Must be called within a transaction scope.");
        }

        if (!this.isDirty()) {
            // no changes to save
            return this;
        }

        // Ensure this row is registered as a listener (may already be registered from setRowKeyValue)
        if (this.editingTx() === tx) {
            // Already registered as listener in setRowKeyValue, no need to add again
        } else {
            // This shouldn't happen normally, but add as listener just in case
            tx.addListener(this);
        }

        const primaryKeyValue = this.primaryKeyValue();
        if (primaryKeyValue === undefined || primaryKeyValue === null) {
            // No primary key - definitely an insert
            return await this.insert(tx);
        } else {
            // Has primary key - check if it exists in cache first
            const cachedRow = this.table().getCachedRowForId(primaryKeyValue);
            if (cachedRow && cachedRow === this) {
                // Row is cached and it's the same instance - this is an update
                return await this.update(tx);
            } else {
                // Row has a primary key but isn't cached - this is a new insert with explicit ID
                return await this.insert(tx);
            }
        }
    }

    changedDict () {
        // return a new dict with only the changed keys and values
        const changedDict = {};
        const oldDict = this.oldDict();
        const dict = this.dict();
        const dictKeys = Reflect.ownKeys(dict);
        for (const key of dictKeys) {
            if (dict[key] !== oldDict[key]) {
                changedDict[key] = dict[key];
            }
        }
        // but we need to add the primary key to the changedDict
        // so we know which row is being updated
        const primaryKeyName = this.primaryKeyName();
        if (primaryKeyName) {
            changedDict[primaryKeyName] = this.primaryKeyValue();
        }
        return changedDict;
    }

    // --- Transaction Listener Interface ---

    /**
     * Called when a transaction commits successfully
     * @param {SvDbTx} tx - The transaction that committed
     */
    onTxCommit (tx) {
        assert(tx === this.editingTx(), "transaction that committed is not the same as the transaction that modified this row");
        // Update oldDict to reflect committed state
        this.copyOldDictFromDict();
        this.setEditingTx(null);
    }

    /**
     * Called when a transaction rolls back. Subclasses may override this to roll back slots that aren't column values.
     * @param {SvDbTx} tx - The transaction that rolled back
     */
    onTxRollback (tx) {
        assert(tx === this.editingTx(), "transaction that rolled back is not the same as the transaction that modified this row");
        // NOTE: subclasses may need to override this to roll back slots that aren't column values
        // revert to the old values by copying oldDict back to dict
        this.setDict(Object.assign({}, this.oldDict()));
        this.setEditingTx(null);
    }

}).initThisClass();

module.exports = SvDbRow;
