/**
 * @module webserver/orm
 */

"use strict";

const { SvBase } = require("../../../GameServer/site/strvct/webserver");

/**
 * @class SvDbSchema
 * @extends Base
 * @classdesc Handles database schema introspection and JSON generation.
 *
 * This class is responsible for reading database metadata via Sequelize's QueryInterface
 * and converting it into a structured JSON representation that can be used by the ORM
 * to create table and column objects.
 *
 * Key responsibilities:
 * - Connect to database via Sequelize instance
 * - Introspect table structures and metadata
 * - Detect foreign key relationships
 * - Generate JSON schema representation
 * - Handle multiple database dialects (SQLite, PostgreSQL)
 */
const SvDbSchema = (class SvDbSchema extends SvBase {

    /**
     * @description Initialize prototype slots for the SvDbSchema.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            this.newSlot("sequelize", null);
        }
    }

    /**
     * @description Initialize prototype for the SvDbSchema.
     * @category Initialization
     */
    initPrototype () {
        // Prototype initialization will be implemented here
    }

    /**
     * Read the database schema and return it as JSON
     * @returns {Promise<Object>} JSON representation of the database schema
     */
    async readSchemaJson () {
        const sequelize = this.sequelize();
        if (!sequelize) {
            throw new Error("Sequelize instance is required");
        }

        const queryInterface = sequelize.getQueryInterface();
        const dialect = sequelize.getDialect();

        console.log(this.logPrefix(), `Reading database schema for dialect: ${dialect}`);

        // Get all table names
        const allTableNames = await queryInterface.showAllTables();
        console.log(this.logPrefix(), `Found ${allTableNames.length} tables:`, allTableNames.join(", "));

        // Filter out system tables that we don't want in our ORM
        const tableNames = this.filterSystemTables(allTableNames);
        console.log(this.logPrefix(), `Processing ${tableNames.length} application tables:`, tableNames.join(", "));

        // Validate all application table names before processing
        for (const tableName of tableNames) {
            this.validateTableName(tableName);
        }

        const schemaJson = {
            database: sequelize.getDatabaseName() || "database",
            tables: []
        };

        // Process each table
        for (const tableName of tableNames) {
            console.log(this.logPrefix(), `Processing table: ${tableName}`);

            try {
                const tableSchema = await this.getTableSchema(queryInterface, tableName, dialect);
                if (tableSchema) {
                    schemaJson.tables.push(tableSchema);
                }
            } catch (error) {
                console.warn(`Failed to process table ${tableName}:`, error.message);
                // Continue processing other tables
            }
        }

        return schemaJson;
    }

    /**
     * Get schema information for a specific table
     * @param {Object} queryInterface - Sequelize QueryInterface
     * @param {string} tableName - Name of the table
     * @param {string} dialect - Database dialect
     * @returns {Promise<Object>} Table schema object
     */
    async getTableSchema (queryInterface, tableName, dialect) {
        try {
            // Get table description (columns)
            let tableDescription;
            try {
                tableDescription = await queryInterface.describeTable(tableName);
                console.log(this.logPrefix(), `Successfully described table ${tableName}`);
            } catch (error) {
                console.error(this.logPrefix(), error);
                console.log(this.logPrefix(), `Attempting alternative table description for ${tableName}...`);
                // Fallback for some databases
                const rawDescription = await queryInterface.sequelize.query(
                    `PRAGMA table_info(${tableName})`,
                    { type: queryInterface.sequelize.QueryTypes.SELECT }
                );

                // Convert PRAGMA output to describeTable format
                tableDescription = {};
                for (const col of rawDescription) {
                    tableDescription[col.name] = {
                        type: col.type,
                        allowNull: col.notnull === 0,
                        defaultValue: col.dflt_value,
                        primaryKey: col.pk === 1
                    };
                }
                console.log(this.logPrefix(), `Alternative table description successful for ${tableName}`);
            }

            // Get foreign key information
            const foreignKeys = await this.getForeignKeys(queryInterface, tableName, dialect);
            console.log(this.logPrefix(), `Found ${foreignKeys.length} foreign keys for table ${tableName}`);

            // Get indexes
            const indexes = await this.getIndexes(queryInterface, tableName, dialect);

            // Convert to our schema format
            const tableSchema = {
                name: tableName,
                columns: []
            };

            for (const [columnName, columnInfo] of Object.entries(tableDescription)) {
                // Validate column name follows naming conventions
                this.validateColumnName(columnName, tableName);

                const column = {
                    name: columnName,
                    dataType: this.normalizeDataType(columnInfo.type),
                    allowNull: columnInfo.allowNull !== false,
                    primaryKey: columnInfo.primaryKey === true,
                    autoIncrement: columnInfo.autoIncrement === true,
                    unique: columnInfo.unique === true,
                    defaultValue: columnInfo.defaultValue
                };

                // Add foreign key information if present
                const foreignKey = foreignKeys.find(fk => fk.columnName === columnName);
                if (foreignKey) {
                    column.foreignKey = {
                        referencedTable: foreignKey.referencedTableName,
                        referencedColumn: foreignKey.referencedColumnName,
                        onUpdate: foreignKey.onUpdate,
                        onDelete: foreignKey.onDelete,
                        constraintName: foreignKey.constraintName
                    };
                }

                // Check if column is indexed
                const isIndexed = indexes.some(index => index.columns.includes(columnName));
                column.isIndexed = isIndexed;

                tableSchema.columns.push(column);
            }

            return tableSchema;

        } catch (error) {
            console.error(`Error processing table ${tableName}:`, error.message);
            throw error;
        }
    }

    /**
     * Get foreign key information for a table
     * @param {Object} queryInterface - Sequelize QueryInterface
     * @param {string} tableName - Name of the table
     * @param {string} dialect - Database dialect
     * @returns {Promise<Array>} Array of foreign key objects
     */
    async getForeignKeys (queryInterface, tableName, dialect) {
        try {
            if (dialect === "sqlite") {
                // SQLite uses PRAGMA foreign_key_list
                const foreignKeys = await queryInterface.sequelize.query(
                    `PRAGMA foreign_key_list(${tableName})`,
                    { type: queryInterface.sequelize.QueryTypes.SELECT }
                );

                return foreignKeys.map(fk => ({
                    columnName: fk.from,
                    referencedTableName: fk.table,
                    referencedColumnName: fk.to,
                    onUpdate: fk.on_update,
                    onDelete: fk.on_delete,
                    constraintName: null // SQLite doesn't provide constraint names in PRAGMA
                }));

            } else if (dialect === "postgres") {
                // PostgreSQL uses information_schema
                const query = `
                    SELECT 
                        kcu.column_name,
                        ccu.table_name AS referenced_table_name,
                        ccu.column_name AS referenced_column_name,
                        rc.update_rule,
                        rc.delete_rule,
                        rc.constraint_name
                    FROM information_schema.key_column_usage kcu
                    JOIN information_schema.referential_constraints rc 
                        ON kcu.constraint_name = rc.constraint_name
                    JOIN information_schema.constraint_column_usage ccu 
                        ON rc.unique_constraint_name = ccu.constraint_name
                    WHERE kcu.table_name = :tableName
                `;

                const foreignKeys = await queryInterface.sequelize.query(query, {
                    replacements: { tableName },
                    type: queryInterface.sequelize.QueryTypes.SELECT
                });

                return foreignKeys.map(fk => ({
                    columnName: fk.column_name,
                    referencedTableName: fk.referenced_table_name,
                    referencedColumnName: fk.referenced_column_name,
                    onUpdate: fk.update_rule,
                    onDelete: fk.delete_rule,
                    constraintName: fk.constraint_name
                }));
            }

            return [];
        } catch (error) {
            console.warn(`Could not get foreign keys for ${tableName}:`, error.message);
            return [];
        }
    }

    /**
     * Get index information for a table
     * @param {Object} queryInterface - Sequelize QueryInterface
     * @param {string} tableName - Name of the table
     * @param {string} dialect - Database dialect
     * @returns {Promise<Array>} Array of index objects
     */
    async getIndexes (queryInterface, tableName, dialect) {
        try {
            if (dialect === "sqlite") {
                // SQLite uses PRAGMA index_list and index_info
                const indexes = await queryInterface.sequelize.query(
                    `PRAGMA INDEX_LIST(${tableName})`,
                    { type: queryInterface.sequelize.QueryTypes.SELECT }
                );

                const indexDetails = [];
                for (const index of indexes) {
                    try {
                        const columns = await queryInterface.sequelize.query(
                            `PRAGMA INDEX_INFO(${index.name})`,
                            { type: queryInterface.sequelize.QueryTypes.SELECT }
                        );

                        indexDetails.push({
                            name: index.name,
                            unique: index.unique === 1,
                            columns: columns.map(col => col.name)
                        });
                    } catch (indexError) {
                        console.warn(`Could not get index info for ${index.name}:`, indexError.message);
                    }
                }

                return indexDetails;
            }

            return [];
        } catch (error) {
            console.warn(`Could not get indexes for ${tableName}:`, error.message);
            return [];
        }
    }

    /**
     * Normalize data type names across different database dialects
     * @param {string} rawType - Raw database type
     * @returns {string} Normalized type name
     */
    normalizeDataType (rawType) {
        if (!rawType) return "UNKNOWN";

        const typeStr = rawType.toString().toUpperCase();

        // Handle common type variations
        if (typeStr.includes("VARCHAR") || typeStr.includes("TEXT")) return "STRING";
        if (typeStr.includes("INT")) return "INTEGER";
        if (typeStr.includes("UUID")) return "UUID";
        if (typeStr.includes("DECIMAL") || typeStr.includes("NUMERIC")) return "DECIMAL";
        if (typeStr.includes("FLOAT") || typeStr.includes("DOUBLE")) return "FLOAT";
        if (typeStr.includes("BOOL")) return "BOOLEAN";
        if (typeStr.includes("DATE")) return "DATE";
        if (typeStr.includes("TIME")) return "TIME";
        if (typeStr.includes("BLOB")) return "BLOB";
        if (typeStr.includes("ENUM")) return "ENUM";

        return typeStr;
    }

    /**
     * Filter out system tables that should not be included in the ORM
     * @param {Array<string>} tableNames - All table names from the database
     * @returns {Array<string>} Filtered table names excluding system tables
     */
    filterSystemTables (tableNames) {
        const systemTables = [
            "SequelizeMeta",  // Sequelize migration tracking table
            "sqlite_sequence", // SQLite internal table
            "sqlite_master"   // SQLite system table
        ];

        const filtered = tableNames.filter(tableName => !systemTables.includes(tableName));

        const excluded = tableNames.filter(tableName => systemTables.includes(tableName));
        if (excluded.length > 0) {
            console.log(this.logPrefix(), `Excluding system tables from ORM: ${excluded.join(", ")}`);
        }

        return filtered;
    }

    /**
     * Validate that a table name follows the required naming convention
     * @param {string} tableName - Name of the table to validate
     * @throws {Error} If table name doesn't end with 's'
     */
    validateTableName (tableName) {
        if (!tableName.endsWith("s")) {
            throw new Error(
                `Invalid table name '${tableName}'. All table names must end with 's' ` +
                "to ensure consistent method generation in the ORM. " +
                "Table names ending in 's' are used to generate methods like 'userWithId()' from 'users'. " +
                `Please rename your table to '${tableName}s' or choose another plural form ending in 's'. ` +
                "Examples: 'users', 'transactions', 'api_keys', 'categories'"
            );
        }
    }

    /**
     * Validate that a column name follows the required naming convention
     * @param {string} columnName - Name of the column to validate
     * @param {string} tableName - Name of the table containing the column
     * @throws {Error} If column name doesn't follow camelCase conventions
     */
    validateColumnName (columnName, tableName) {
        // Primary key must be exactly "id"
        if (columnName === "id") {
            return; // Valid primary key
        }

        // Check for snake_case (not allowed)
        if (columnName.includes("_")) {
            throw new Error(
                `Invalid column name '${columnName}' in table '${tableName}'. ` +
                "Column names must use camelCase format, not snake_case. " +
                `Please rename '${columnName}' to '${this.snakeToCamelCase(columnName)}'. ` +
                "Examples: 'firstName', 'createdAt', 'userId'"
            );
        }

        // Check for PascalCase (not allowed for columns)
        if (columnName.length > 0 && columnName[0] === columnName[0].toUpperCase()) {
            throw new Error(
                `Invalid column name '${columnName}' in table '${tableName}'. ` +
                "Column names must start with lowercase letter (camelCase), not uppercase (PascalCase). " +
                `Please rename '${columnName}' to '${columnName[0].toLowerCase()}${columnName.slice(1)}'. ` +
                "Examples: 'firstName', 'createdAt', 'userId'"
            );
        }

        // Check for foreign key naming convention
        if (columnName.endsWith("Id")) {
            const tableRef = columnName.slice(0, -2); // Remove 'Id' suffix

            // Should be camelCase reference to another table
            if (tableRef.includes("_") || (tableRef.length > 0 && tableRef[0] === tableRef[0].toUpperCase())) {
                throw new Error(
                    `Invalid foreign key column name '${columnName}' in table '${tableName}'. ` +
                    "Foreign key columns must follow the pattern '{camelCaseTableName}Id'. " +
                    "The table reference part should be camelCase (lowercase first letter). " +
                    "Examples: 'userId', 'billingTransactionId', 'apiRequestId'"
                );
            }
        }

        // Check that it's a valid JavaScript identifier
        const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
        if (!validIdentifier.test(columnName)) {
            throw new Error(
                `Invalid column name '${columnName}' in table '${tableName}'. ` +
                "Column names must be valid JavaScript identifiers using camelCase. " +
                "Valid characters: letters, numbers, and underscore/dollar (but avoid these). " +
                "Examples: 'email', 'firstName', 'createdAt'"
            );
        }
    }

    /**
     * Convert snake_case to camelCase for error messages
     * @param {string} snakeStr - Snake case string
     * @returns {string} CamelCase string
     */
    snakeToCamelCase (snakeStr) {
        return snakeStr.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    }

}).initThisClass();

module.exports = SvDbSchema;
