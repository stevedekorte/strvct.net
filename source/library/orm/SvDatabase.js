/**
 * @module webserver/orm
 */

"use strict";


// Load STRVCT dependencies in correct order
require("../../../GameServer/site/strvct/source/boot/SvGlobals");
require("../../../GameServer/site/strvct/source/boot/categories/Object_categorySupport");
require("../../../GameServer/site/strvct/source/library/ideal/categories/Error_ideal");
const { SvBase } = require("../../../GameServer/site/strvct/webserver");
require("../../../GameServer/site/strvct/source/boot/categories/Promise_ideal");

const { sequelize, initializeDatabase } = require("../database");
const SvDbTable = require("./SvDbTable");
const SvDbTx = require("./SvDbTx");
const SvDbSchema = require("./SvDbSchema");

// Zone.js initialization helper
require("./external-libs/zonejs/ZoneJS_init.js");

/**
 * @class SvDatabase
 * @extends Base
 * @classdesc Main database representation class that provides object-relational mapping capabilities.
 * 
 * This class serves as the primary interface for database operations, providing:
 * - Database schema introspection via Sequelize QueryInterface
 * - Object hierarchy creation (Database → Table → Column → Row)
 * - Managed transaction support with automatic commit/rollback
 * - CRUD operations with transaction enforcement
 * - JSON schema export for API consumption
 * 
 * The class reads database metadata and creates a structured object model that mirrors
 * the database schema. All database operations require an active transaction to ensure
 * data consistency and provide proper error handling.
 * 
 * Usage:
 * ```javascript
 * const database = SvDatabase.clone();
 * await database.setup(); // Read schema and create object hierarchy
 * 
 * const tx = database.newTx();
 * await tx.begin(async () => {
 *   const rows = await database.query("users", { limit: 10 });
 *   // All operations within transaction scope
 * });
 * ```
 */
const SvDatabase = (class SvDatabase extends SvBase {

    /**
     * @description Initialize prototype slots for the SvDatabase.
     * @category Initialization
     */
    initPrototypeSlots () {
        
        {
            this.newSlot("databaseName", null);
        }

        {
            this.newSlot("schemaJson", null);
        }

        {
            this.newSlot("tables", null);
        }

        {
            this.newSlot("tableNameToRowClassMap", null);
        }

        {
            this.newSlot("activeTxs", null);
        }

        {
            this.newSlot("rowClassPrefixes", ["Sv"]);
        }

        {
            this.newSlot("isSetup", false);
        }

        {
            this.newSlot("setupPromise", null); // shared promise for singleton
        }

        {
            this.newSlot("customClassPrefix", "Pm");
        }
    }


    /**
     * @description Initialize prototype for the SvDatabase.
     * @category Initialization
     */
    initPrototype () {
        // Prototype initialization will be implemented here
    }

    init () {
        super.init();
        this.setTableNameToRowClassMap(new Map());
        this.setActiveTxs(new Set());
        this.setSetupPromise(Promise.clone());
    }

    async setup () {
        if (!this.isSetup()) { // first call will start setup, subsequent calls will return the same promise
            this.setIsSetup(true);
            await initializeDatabase();
            const schemaJson = await SvDbSchema.clone().setSequelize(sequelize).readSchemaJson();
            this.setupFromSchemaJson(schemaJson);
            this.setupCustomTableAndRowClasses();
            this.setupPromise().callResolveFunc();
        }
        await this.setupPromise();
        return this;
    }


    setupCustomTableAndRowClasses () {
        this.tables().forEach(table => {
            table.setupCustomClass();
            //table.setupCustomTableClass();
            //table.setupCustomRowClass();
        });
    }

    tableWithName (tableName) {
        return this.tables().find(table => table.tableName() === tableName);
    }

    /**
     * Create a new transaction
     * @returns {SvDbTx} New transaction instance
     */
    newTx () {
        if (!this.setupPromise().isResolved()) {
            throw new Error("Database setup must be completed before creating a transaction");
        }
        const transaction = SvDbTx.clone();
        transaction.setDatabase(this);
        this.activeTxs().add(transaction);
        return transaction;
    }

    /**
     * Get the current transaction from Zone.js context
     * @returns {SvDbTx|null} Current transaction or null if no transaction context
     */
    currentTx () {
        try {
            if (typeof Zone !== 'undefined' && Zone.current && Zone.current.get('currentTx')) {
                return Zone.current.get('currentTx');
            }
        } catch (error) {
            // Zone.js not available or not in transaction context
            throw new Error("Zone.js not available or not in transaction context. Error: " + error.message);
        }
        return null;
    }

    // ========================================
    // Transaction Callback Methods
    // ========================================

    /**
     * Called when a transaction begins
     * @param {SvDbTx} tx - The transaction that is beginning
     * @returns {Promise<void>}
     */
    async onBegin (tx) {
        // Create Sequelize transaction and store reference
        const sequelizeTransaction = await sequelize.transaction();
        tx.setTxRef(sequelizeTransaction);
        tx.setIsActive(true);
        console.log(this.logPrefix(), "Database.onBegin() called - Sequelize transaction created");
    }

    /**
     * Called when a transaction commits
     * @param {SvDbTx} tx - The transaction that is committing
     * @returns {Promise<void>}
     */
    async onCommit (tx) {
        // Commit the Sequelize transaction
        if (tx.txRef()) {
            await tx.txRef().commit();
            console.log(this.logPrefix(), "Database.onCommit() called - Sequelize transaction committed");
        }
        tx.setIsActive(false);
        tx.setTxRef(null);
        this.activeTxs().delete(tx);
    }

    /**
     * Called when a transaction rolls back
     * @param {SvDbTx} tx - The transaction that is rolling back
     * @returns {Promise<void>}
     */
    async onRollback (tx) {
        // Rollback the Sequelize transaction
        if (tx.txRef()) {
            await tx.txRef().rollback();
            console.log(this.logPrefix(), "Database.onRollback() called - Sequelize transaction rolled back");
        }
        tx.setIsActive(false);
        tx.setTxRef(null);
        this.activeTxs().delete(tx);
    }

    /**
     * Validate transaction and get Sequelize transaction reference
     * @param {SvDbTx} tx - The transaction to validate
     * @returns {Object} Sequelize transaction reference
     * @throws {Error} If transaction is invalid
     */
    validateTxAndGetRef (tx) {
        if (!tx) {
            throw new Error("Transaction is required for database operations");
        }
        
        if (!this.activeTxs().has(tx)) {
            throw new Error("Transaction is not registered with this database");
        }
        
        if (!tx.isActive()) {
            throw new Error("Transaction is not active");
        }
        
        const txRef = tx.txRef();
        if (!txRef) {
            throw new Error("Transaction has no Sequelize transaction reference");
        }
        
        return txRef;
    }

    setupFromSchemaJson (schemaJson) {
        if (!schemaJson || !schemaJson.tables) {
            console.warn("No schema JSON available to create tables from");
            return;
        }

        // Store database info
        this.setDatabaseName(schemaJson.database);

        const tables = [];
        
        for (const tableData of schemaJson.tables) {
            // Create new SvDbTable instance
            const table = SvDbTable.clone();
            table.setDatabase(this);
            table.setupFromSchemaJson(tableData);
            tables.push(table);
        }
        
        this.setTables(tables);
    }


    asJsonSchema () {
        const json = {
            database: this.databaseName(),
            tables: []
        };

        if (this.tables()) {
            this.tables().forEach(table => {
                json.tables.push(table.asJsonSchema());
            });
        }
        return json;
    }
    // ========================================
    // Database Operations using Sequelize
    // ========================================

    /**
     * Execute a SELECT query on a table
     * @param {string} tableName - The table to query
     * @param {Object} searchOptions - Query options
     * @param {SvDbTx} tx - The transaction to use
     * @returns {Promise<Array>} Array of row data
     */
    async query (tableName, searchOptions = {}, tx) {
        try {
            // Validate transaction and get reference
            const transaction = this.validateTxAndGetRef(tx);
            
            // Build the query options
            const queryOptions = {
                raw: true, // Return plain objects instead of model instances
                nest: false, // Don't nest results
                transaction: transaction
            };

            // Handle pagination
            if (searchOptions.limit) {
                queryOptions.limit = parseInt(searchOptions.limit);
            }
            if (searchOptions.page && searchOptions.limit) {
                queryOptions.offset = (parseInt(searchOptions.page) - 1) * parseInt(searchOptions.limit);
            }

            // Handle sorting
            if (searchOptions.sort) {
                const order = searchOptions.order || 'ASC';
                queryOptions.order = [[searchOptions.sort, order.toUpperCase()]];
            }

            // Build WHERE clause
            let whereClause = '';
            const replacements = {};
            
            if (searchOptions.where && typeof searchOptions.where === 'object') {
                const conditions = [];
                for (const [key, value] of Object.entries(searchOptions.where)) {
                    conditions.push(`${key} = :${key}`);
                    replacements[key] = value;
                }
                if (conditions.length > 0) {
                    whereClause = 'WHERE ' + conditions.join(' AND ');
                }
            }

            // Build the SQL query
            const sql = `SELECT * FROM ${tableName} ${whereClause}`;
            
            // Execute the query
            const results = await sequelize.query(sql, {
                ...queryOptions,
                replacements: replacements,
                type: sequelize.QueryTypes.SELECT
            });

            return results;
        } catch (error) {
            console.error(`Error querying table ${tableName}:`, error);
            throw error;
        }
    }

    /**
     * Insert a row into a table
     * @param {string} tableName - The table to insert into
     * @param {Object} rowData - The data to insert
     * @param {SvDbTx} tx - The transaction to use
     * @returns {Promise<Object>} The inserted row data
     */
    async insert (tableName, rowData, tx) {
        try {
            // Validate transaction and get reference
            const transaction = this.validateTxAndGetRef(tx);
            
            // Build column and value lists
            const columns = Object.keys(rowData);
            const values = columns.map(col => `:${col}`);
            
            const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
            
            const dialect = sequelize.getDialect();
            let insertedRow;
            
            if (dialect === 'postgres') {
                // PostgreSQL supports RETURNING clause
                const sqlWithReturning = sql + ' RETURNING *';
                const [result] = await sequelize.query(sqlWithReturning, {
                    replacements: rowData,
                    type: sequelize.QueryTypes.INSERT,
                    transaction: transaction
                });
                insertedRow = result;
            } else {
                // SQLite and other databases: insert then query back
                await sequelize.query(sql, {
                    replacements: rowData,
                    type: sequelize.QueryTypes.INSERT,
                    transaction: transaction
                });
                
                // Find the primary key to query back the inserted row
                const table = this.tableWithName(tableName);
                const primaryKeyColumn = table.columns().find(col => col.primaryKey());
                
                if (primaryKeyColumn && rowData[primaryKeyColumn.columnName()]) {
                    const pkName = primaryKeyColumn.columnName();
                    const pkValue = rowData[pkName];
                    
                    const [result] = await sequelize.query(
                        `SELECT * FROM ${tableName} WHERE ${pkName} = :pk`,
                        {
                            replacements: { pk: pkValue },
                            type: sequelize.QueryTypes.SELECT,
                            transaction: transaction
                        }
                    );
                    insertedRow = result;
                } else {
                    // If no primary key or auto-generated key, return the original data
                    insertedRow = rowData;
                }
            }

            return insertedRow;
        } catch (error) {
            console.error(`Error inserting into table ${tableName}:`, error);
            throw error;
        }
    }

    /**
     * Update a row in a table
     * @param {string} tableName - The table to update
     * @param {Object} rowData - The data to update (must include primary key)
     * @param {SvDbTx} tx - The transaction to use
     * @returns {Promise<Object>} The updated row data
     */
    async update (tableName, rowData, tx) {
        try {
            // Validate transaction and get reference
            const transaction = this.validateTxAndGetRef(tx);
            
            // Find the primary key column
            const table = this.tableWithName(tableName);
            if (!table) {
                throw new Error(`Table ${tableName} not found in schema`);
            }

            const primaryKeyColumn = table.columns().find(col => col.primaryKey());
            if (!primaryKeyColumn) {
                throw new Error(`No primary key found for table ${tableName}`);
            }

            const primaryKeyName = primaryKeyColumn.columnName();
            const primaryKeyValue = rowData[primaryKeyName];
            
            if (!primaryKeyValue) {
                throw new Error(`Primary key ${primaryKeyName} not provided in row data`);
            }

            // Build SET clause
            const updates = [];
            const replacements = { pk: primaryKeyValue };
            
            for (const [key, value] of Object.entries(rowData)) {
                if (key !== primaryKeyName) {
                    updates.push(`${key} = :${key}`);
                    replacements[key] = value;
                }
            }

            if (updates.length === 0) {
                throw new Error('No fields to update');
            }

            const sql = `UPDATE ${tableName} SET ${updates.join(', ')} WHERE ${primaryKeyName} = :pk`;
            
            // Execute the update
            await sequelize.query(sql, {
                replacements: replacements,
                type: sequelize.QueryTypes.UPDATE,
                transaction: transaction
            });

            // Query the updated row
            const [updatedRow] = await sequelize.query(
                `SELECT * FROM ${tableName} WHERE ${primaryKeyName} = :pk`,
                {
                    replacements: { pk: primaryKeyValue },
                    type: sequelize.QueryTypes.SELECT,
                    transaction: transaction
                }
            );

            return updatedRow;
        } catch (error) {
            console.error(`Error updating table ${tableName}:`, error);
            throw error;
        }
    }

    /**
     * Delete a row from a table
     * @param {string} tableName - The table to delete from
     * @param {Object} rowData - The row data (must include primary key)
     * @param {SvDbTx} tx - The transaction to use
     * @returns {Promise<boolean>} True if deleted successfully
     */
    async delete (tableName, rowData, tx) {
        try {
            // Validate transaction and get reference
            const transaction = this.validateTxAndGetRef(tx);
            
            // Find the primary key column
            const table = this.tableWithName(tableName);
            if (!table) {
                throw new Error(`Table ${tableName} not found in schema`);
            }

            const primaryKeyColumn = table.columns().find(col => col.primaryKey());
            if (!primaryKeyColumn) {
                throw new Error(`No primary key found for table ${tableName}`);
            }

            const primaryKeyName = primaryKeyColumn.columnName();
            const primaryKeyValue = rowData[primaryKeyName];
            
            if (!primaryKeyValue) {
                throw new Error(`Primary key ${primaryKeyName} not provided in row data`);
            }

            const sql = `DELETE FROM ${tableName} WHERE ${primaryKeyName} = :pk`;
            
            // Execute the delete
            const result = await sequelize.query(sql, {
                replacements: { pk: primaryKeyValue },
                type: sequelize.QueryTypes.DELETE,
                transaction: transaction
            });

            // Check affected rows based on database dialect
            const dialect = sequelize.getDialect();
            if (dialect === 'postgres') {
                // PostgreSQL returns the number of affected rows in result[1].rowCount
                return result[1] && result[1].rowCount > 0;
            } else {
                // SQLite: check if result indicates successful deletion
                // For DELETE operations, Sequelize may return different formats
                if (Array.isArray(result) && result.length > 1 && typeof result[1] === 'number') {
                    return result[1] > 0;
                } else if (result && typeof result.affectedRows === 'number') {
                    return result.affectedRows > 0;
                } else {
                    // Assume success if no error was thrown (SQLite doesn't always provide affected count)
                    return true;
                }
            }
        } catch (error) {
            console.error(`Error deleting from table ${tableName}:`, error);
            throw error;
        }
    }

}).initThisClass();

module.exports = SvDatabase;
