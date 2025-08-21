/**
 * @module webserver/orm
 */

"use strict";

const { Base } = require("../../../GameServer/site/strvct/webserver");
const SvDbColumn = require("./SvDbColumn");
const SvDbRow = require("./SvDbRow");
const SvDbCache = require("./SvDbCache");

/**
 * @class SvDbTable
 * @extends Base
 * @classdesc Represents a database table with its columns and provides table-level operations.
 * 
 * This class encapsulates table metadata and provides high-level CRUD operations that work
 * with row objects. It manages the relationship between table schema (columns) and data (rows),
 * and handles the mapping between raw database records and object instances.
 * 
 * Key responsibilities:
 * - Store table metadata (name, columns, row class mapping)
 * - Provide table-specific CRUD operations (selectRows, insertRow, updateRow, deleteRow)
 * - Handle row object creation and population from database records
 * - Manage column name-to-column object mapping for efficient lookups
 * - Support custom row classes for domain-specific table representations
 * 
 * The table delegates actual database operations to its parent SvDatabase instance while
 * providing a convenient interface for working with specific tables and their data.
 * 
 * Usage:
 * ```javascript
 * const table = database.tableWithName("users");
 * const rows = await table.selectRows({ limit: 10 });
 * const newRow = table.rowClass().clone();
 * newRow.setupFromDict({ name: "John", email: "john@example.com" });
 * await table.insertRow(newRow);
 * ```
 */
const SvDbTable = (class SvDbTable extends SvBase {

    /**
     * @description Initialize prototype slots for the SvDbTable.
     * @category Initialization
     */
    initPrototypeSlots () {
        // Prototype slots will be defined here

        {
            this.newSlot("database", null);
        }

        {
            this.newSlot("tableName", null);
        }

        {
            this.newSlot("columns", null);
        }

        {
            this.newSlot("rowClass", SvDbRow); // we'll always override this with a custom row class
        }

        {
            this.newSlot("customTableClass", SvDbTable); // we'll always override this with a custom table class
        }

        {
            this.newSlot("nameToColumnMap", null); // updated when columns are set
        }

        {
            this.newSlot("rowCache", null);
        }
    }

    /**
     * @description Initialize prototype for the SvDbTable.
     * @category Initialization
     */
    initPrototype () {
        // Prototype initialization will be implemented here
    }

    init () {
        super.init();
        this.setRowCache(SvDbCache.clone());
        return this;
    }

    customClassPrefix () {
        return this.database().customClassPrefix();
    }

    customTableClassName () {
        // e.g. For "Transactions" -> "PmTransactions"
        return (this.customClassPrefix() + this.tableName()).capitalized();
    }

    customRowClassName () {
        // e.g. For "Transactions" -> "PmTransaction"
        return (this.customClassPrefix() + this.tableName().sansSuffix("s")).capitalized();
    }

    setupCustomClass () {
        this.setupCustomTableClass();
        this.setupCustomRowClass();
    }

    setupCustomTableClass () {
        // First, see if a custom class exists
        // e.g. For "Transactions" -> "PmTransactions"

        // lookup the custom table class
        const customClassName = this.customClassName();
        let customClass = this.classWithName(customClassName);

        // If there's no user-defined custom class, create a new one
        if (customClass === undefined) {
            const SvDbCustomTable = require("./SvDbCustomTable");
            customClass = SvDbCustomTable.newSubclassWithName(customClassName);
            console.log("created custom table class: ", customClassName);
        } else {
            console.log("found custom table class: ", customClassName);
        }

        // now setup the custom class
        customClass.prototype.setDatabase(this.database());
        customClass.setupCustomPrototype();
    }

    setupCustomRowClass () {
        // lookup the custom row class
        // e.g. For "Transactions" -> "PmTransaction"
        const customRowClassName = this.customRowClassName();
        let customRowClass = this.classWithName(customRowClassName);

        // If there's no user-defined custom row class, create a new one
        if (!customRowClass) {
            const SvDbCustomRow = require("./SvDbCustomRow");
            customRowClass = SvDbCustomRow.newSubclassWithName(customRowClassName);
            console.log("created custom row class: ", customRowClassName);
        } else {
            console.log("found custom row class: ", customRowClassName);
        }

        // now setup the custom row class
        customRowClass.prototype.setTable(this);
        this.setRowClass(customRowClass);
        customRowClass.setupCustomPrototype();
    }

    setColumns (columns) {
        this._columns = columns;
        this.updateNameToColumnMap();
        return this;
    }

    updateNameToColumnMap () {
        // todo: cache this
        const map = new Map(this.columns().map(column => [column.columnName(), column]));
        this.setNameToColumnMap(map);
    }

    columnWithName (name) {
        // TODO: add column index
        return this.columns().find(column => column.columnName() === name);
    }

    columnNamesSet () {
        return new Set(this.columns().map(column => column.columnName()));
    }

    primaryKeyName () {
        const primaryKeyColumn = this.columns().find(col => col.primaryKey());
        return primaryKeyColumn ? primaryKeyColumn.columnName() : null;
    }


    setupFromSchemaJson (tableData) {
        this.setTableName(tableData.name);
        
        // Create columns array for this table
        const columns = [];
        
        if (tableData.columns) {
            for (const columnData of tableData.columns) {
                // Create new SvDbColumn instance
                const column = SvDbColumn.clone();
                column.setTable(this);
                column.setupFromSchemaJson(columnData);
                columns.push(column);
            }
        }
        
        this.setColumns(columns);
    }

    asJsonSchema () {
        const json = {
            name: this.tableName(),
            columns: []
        };

        if (this.columns()) {
            this.columns().forEach(column => {
                json.columns.push(column.asJsonSchema());
            });
        }

        return json;
    }

    async selectRows (searchOptions = {}, tx) {
        const rows = [];
        const rowClass = this.rowClass();
        const primaryKeyName = this.primaryKeyName();
        const rowDicts = await this.database().query(this.tableName(), searchOptions, tx);
        
        for (const rowDict of rowDicts) {
            let row = null;
            
            // Check cache first if we have a primary key
            if (primaryKeyName && rowDict[primaryKeyName] !== undefined && rowDict[primaryKeyName] !== null) {
                row = this.getCachedRowForId(rowDict[primaryKeyName]);
                // we do not set the row with the rowDict here because it may be dirty
                // and we don't want to overwrite the cached row with a dirty row
            }
            
            // If not found in cache, create a new row instance
            if (!row) {
                row = rowClass.clone();
                row.setTable(this);  // Set the table reference
                row.setupFromDict(rowDict);
            }
            
            rows.push(row);
        }
        return rows;
    }

    async insertRow (row, tx) {
        const rowDict = row.asDict();
        const insertedData = await this.database().insert(this.tableName(), rowDict, tx);
        // Update the row with any auto-generated values (like auto-increment IDs)
        row.setupFromDict(insertedData);
        
        // Schedule cache addition for transaction commit
        const primaryKeyValue = row.primaryKeyValue();
        if (primaryKeyValue !== undefined && primaryKeyValue !== null) {
            tx.addPendingCacheOperation(() => {
                this.onAssignedIdToRow(row);
            });
        }
        
        return insertedData;
    }

    async deleteRow (row, tx) {
        const rowDict = row.asDict();
        const result = await this.database().delete(this.tableName(), rowDict, tx);
        
        // Schedule cache removal for transaction commit
        if (result) {
            const primaryKeyValue = row.primaryKeyValue();
            if (primaryKeyValue !== undefined && primaryKeyValue !== null) {
                tx.addPendingCacheOperation(() => {
                    this.rowCache().delete(primaryKeyValue);
                });
            }
        }
        
        return result;
    }

    async updateRow (row, tx) {
        const rowDict = row.asDict();
        const updatedData = await this.database().update(this.tableName(), rowDict, tx);
        // Update the row with the latest data from database
        row.setupFromDict(updatedData);
        return updatedData;
    }

    newRow () {
        const row = this.rowClass().clone();
        row.setTable(this);
        return row;
    }

    // row caching methods

    onAssignedIdToRow (row) {
        const primaryKeyName = this.primaryKeyName();
        if (!primaryKeyName) {
            return; // No primary key, nothing to track
        }

        const primaryKeyValue = row.primaryKeyValue();
        
        if (primaryKeyValue !== undefined && primaryKeyValue !== null) {
            // Add the row to the cache using the primary key as the key
            this.rowCache().set(primaryKeyValue, row);
        }
    }

    getCachedRowForId (id) {
        if (id === undefined || id === null) {
            return null;
        }
        return this.rowCache().get(id) || null;
    }

    /**
     * Get row by primary key ID (cache-first lookup)
     * @param {*} primaryKeyValue - The primary key value to look up
     * @param {SvDbTx} tx - The transaction to use for database query if cache miss
     * @returns {Promise<SvDbRow|null>} The row object or null if not found
     */
    async getRowForId (primaryKeyValue, tx) {
        if (primaryKeyValue === undefined || primaryKeyValue === null) {
            return null;
        }

        // Check cache first
        const cachedRow = this.getCachedRowForId(primaryKeyValue);
        if (cachedRow) {
            return cachedRow;
        }

        // Cache miss - query database
        const rows = await this.selectRows({ 
            where: { [this.primaryKeyName()]: primaryKeyValue } 
        }, tx);

        return rows.length > 0 ? rows[0] : null;
    }

    async getRowsWhereColumnNameHasValue (columnName, value, tx) {
        const rows = await this.selectRows({
            where: { [columnName]: value }
        }, tx);
        return rows;
    }

    
}).initThisClass();

module.exports = SvDbTable;