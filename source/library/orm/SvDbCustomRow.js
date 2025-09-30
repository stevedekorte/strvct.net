/**
 * @module webserver/orm
 */

"use strict";

const SvDbRow = require("./SvDbRow");

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
(class SvDbCustomRow extends SvDbRow {

    static initThisClass () {
        SvDatabase.shared().registerCustomRowClass(this);
        //this.setupMethods();
    }

    /**
     * @description Initialize prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {

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
    }

    customClassPrefix () {
        return this.table().database().customClassPrefix();
    }


    setupCustomPrototype () {
        // Note: this needs to be called after the database schema is loaded
        assert(this.isPrototype(), "setupRowPrototype must be called on a prototype");
        assert(this.table() !== null, "table is not set");
        this.setupColumnValueGettersAndSetters();
    }

    findChildTables () {
        const tables = this.table().database().tables();
        const childTables = tables.filter(table => table.foreignKey()?.columnName === this.myForeignKeyName());
        return childTables;
    }

    // setting up column value getter and setters

    setupColumnValueGettersAndSetters () {
        const columns = this.table().columns();
        for (const column of columns) {
            this.addCustomMethodsForColumn(column);
        }
    }

    addCustomMethodsForColumn (column) {
        const columnName = column.name();

        const proto = this.thisPrototype();

        // add get/set methods for the column
        // e.g. if the column is "userId", we add "userId" and "setUserId" methods
        proto.addMethod(column.getterName(), function () { return this.getRowKey(columnName); });
        proto.addMethod(column.setterName(), function (value) { return this.set(columnName, value); });

        // If it's a foreign key (ends in "Id"), then add get/set for referenced owner row
        // e.g.  "userId" -> "user" + "setUser"
        if (column.isForeignKey()) {
            const ownerTable = column.pointsToOwningTable();
            assert(ownerTable !== null, "ownerTable not found for column " + columnName);

            // get/set a parent table
            // e.g. if the column is "userId", we add "user" and "setUser" methods
            proto.addMethod(column.ownerGetterName(), async function () {
                const ownerRowId = this.getRowKey(columnName);
                return await ownerTable.getRowForId(ownerRowId);
            });

            proto.addMethod(column.ownerSetterName(), function (ownerRow) {
                // assert that ownerRow is not null
                assert(ownerRow !== null, "ownerRow is null for column " + columnName);

                // assert that ownerRow's table is of the correct type
                assert(ownerRow.table() === ownerTable, "ownerRow is not of the correct type for column " + columnName);

                // assert that ownerRow has an id
                assert(ownerRow.id() !== null, "ownerRow argument has no id");

                // set the foreign key value to the owner row's id
                this.setRowKeyValue(columnName, ownerRow.id());
            });

            // e.g. if this is the Transaction row and it has a userId,
            // then Users is the owner table and User is the owner row
            // User.transactions() and User.newTransaction() methods

            const ownerRowClass = ownerTable.rowClass();
            const ownerRowPrototype = ownerRowClass.prototype;

            ownerRowPrototype.addMethod(this.ownerGetChildrenMethodName(), async function () {
                const children = await this.getChildrenInTable(ownerTable.name(), tx);
                return children;
            });

            ownerRowPrototype.addMethod(this.ownerNewChildMethodName(), async function (tx) {
                const child = await this.newChildInTable(ownerTable.name(), tx);
                return child;
            });
        }
    }

    ownerGetChildrenMethodName () {
        // ownerGetChildrenMethodName is this row's table name with a lower case first letter
        // e.g. Transactions -> transactions
        return this.table().name().charAt(0).toLowerCase() + this.table().name().slice(1);
    }

    ownerNewChildMethodName () {
        // ownerNewChildMethodName is this row's table name with a lower case first letter and "New" added to the front and the "s" suffix removed
        // e.g. Transactions -> newTransaction
        return `new${this.table().name().charAt(0).toLowerCase()}${this.table().name().slice(1).replace(/s$/, "")}`;
    }

    // --- following foreign keys ---

    async getChildrenInTable (tableName, tx) {
        const table = this.table().database().tableWithName(tableName);
        const children = await table.getRowsWhereColumnNameHasValue(this.myForeignKeyName(), this.id(), tx);
        return children;
    }

    async newChildInTable (tableName, tx) {
        const table = this.table().database().tableWithName(tableName);
        const child = table.newRow(tx);
        child.set(this.myForeignKeyName(), this.id());
        //await child.save(tx);
        return child;
    }

    // --- advanced setup ---
    // so when the SvDatabase is initialized and loaded, we need to find all the custom row classes
    // and call setTable() and setupMethods() on each prototype
    // maybe on initThisClass, SvCustomRow could find the shared SvDatabase and register itself
    // with a method like addCustomRowClass()
    /*

    myForeignKeyName () { // TODO cache this on the prototype
        let fk = this.tableName();
        // now remove the "s" from the end of the table name
        fk = fk.replace(/s$/, "");
        // now add _id to the end of the table name
        fk = fk + "_id";
        return fk;
    }

    findChildrenTableNames () {
        const fk = this.myForeignKeyName();
        const tables = this.table().database().tables();
        const childrenTableNames = tables.filter(table => table.foreignKey()?.columnName === fk);
        return childrenTableNames.map(table => table.tableName());
    }

    setupMethods () {
        const childrenTableNames = this.findChildrenTableNames();
        for (const tableName of childrenTableNames) {
            this[`get${tableName}`] = async (tx) => await this.getChildrenInTable(tableName, tx);
            this[`new${tableName}`] = async (tx) => await this.newChildInTable(tableName, tx);
        }
    }
    */

}).initThisClass();

module.exports = SvDbRow;
