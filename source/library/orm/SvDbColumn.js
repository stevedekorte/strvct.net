/**
 * @module webserver/orm
 */

"use strict";

const { Base } = require("../../../GameServer/site/strvct/webserver");
const SvDbDataType = require("./SvDbDataType");
// const SvDbTable = require("./SvDbTable");
// const SvDbRow = require("./SvDbRow");

/**
 * @class SvDbColumn
 * @extends Base
 * @classdesc Represents a database column with its metadata and constraints.
 * 
 * This class stores complete column information extracted from database schema introspection,
 * including data types, constraints, and default values. It provides the metadata foundation
 * for data validation and object-relational mapping operations.
 * 
 * Column properties include:
 * - Basic metadata: name, data type, null constraints
 * - Key constraints: primary key, unique, foreign key relationships
 * - Auto-generation: auto-increment, default values
 * - Validation: data type checking, constraint enforcement
 * 
 * The column metadata is used by SvDbRow for data validation and by SvDbTable for
 * primary key identification during CRUD operations. It serves as the schema definition
 * that ensures data integrity between the object model and database storage.
 * 
 * Usage:
 * ```javascript
 * const column = table.columnWithName("user_id");
 * console.log(column.dataType());           // "UUID"
 * console.log(column.allowNull());          // false
 * console.log(column.isForeignKey());       // true
 * console.log(column.referencedTableName()); // "users"
 * console.log(column.referencedColumnName()); // "id"
 * ```
 */
(class SvDbColumn extends SvBase {

    /**
     * @description Initialize prototype slots for the SvDbColumn.
     * @category Initialization
     */
    initPrototypeSlots () {
        // Prototype slots will be defined here
        {
            this.newSlot("table", null);
        }

        {
            this.newSlot("columnName", null);
        }

        {
            this.newSlot("dataType", null);
        }

        {
            this.newSlot("allowNull", null);
        }

        {
            this.newSlot("primaryKey", false);
        }

        {
            this.newSlot("autoIncrement", false);
        }

        {
            this.newSlot("unique", false);
        }

        {
            this.newSlot("defaultValue", null);
        }

        {
            this.newSlot("isIndexed", false);
        }

        {
            /*
            Holds the structure of the foreign key constraint
            {
                referencedTable: "table_name",      // The table being referenced
                referencedColumn: "column_name",    // The column being referenced  
                onUpdate: "CASCADE|RESTRICT|...",   // Action on update
                onDelete: "CASCADE|RESTRICT|...",   // Action on delete
                constraintName: "fk_constraint_name" // Constraint name (PostgreSQL only)
            }
            */
            
            this.newSlot("foreignKey", null);
        }
    }

    /**
     * @description Initialize prototype for the SvDbColumn.
     * @category Initialization
     */
    initPrototype () {
        // Prototype initialization will be implemented here
    }

    setupFromSchemaJson (columnData) {
        this.setColumnName(columnData.name);
        this.setDataType(columnData.dataType);
        this.setAllowNull(columnData.allowNull);
        this.setPrimaryKey(columnData.primaryKey);
        this.setAutoIncrement(columnData.autoIncrement);
        this.setUnique(columnData.unique);
        this.setDefaultValue(columnData.defaultValue);
        this.setIsIndexed(columnData.isIndexed || false);
        
        // Set foreign key information if present
        if (columnData.foreignKey) {
            this.setForeignKey(columnData.foreignKey);
        }
    }

    asJsonSchema () {
        const json = {
            name: this.columnName(),
            dataType: this.dataType(),
            allowNull: this.allowNull(),
            primaryKey: this.primaryKey(),
            autoIncrement: this.autoIncrement(),
            unique: this.unique(),
            defaultValue: this.defaultValue(),
            isIndexed: this.isIndexed()
        };

        // Include foreign key information if present
        if (this.foreignKey()) {
            json.foreignKey = this.foreignKey();
        }

        return json;
    }

    /**
     * Check if this column is a foreign key reference
     * @returns {boolean} True if this column references another table
     */
    isForeignKey () {
        return this.foreignKey() !== null;
    }

    /**
     * Get the name of the table this column references (if it's a foreign key)
     * @returns {string|null} Referenced table name or null if not a foreign key
     */
    referencedTableName () {
        return this.isForeignKey() ? this.foreignKey().referencedTable : null;
    }

    /**
     * Get the name of the column this column references (if it's a foreign key)
     * @returns {string|null} Referenced column name or null if not a foreign key
     */
    referencedColumnName () {
        return this.isForeignKey() ? this.foreignKey().referencedColumn : null;
    }

    /**
     * Get the foreign key constraint actions
     * @returns {Object|null} Object with onUpdate and onDelete actions, or null if not a foreign key
     */
    foreignKeyActions () {
        if (!this.isForeignKey()) return null;
        
        const fk = this.foreignKey();
        return {
            onUpdate: fk.onUpdate,
            onDelete: fk.onDelete
        };
    }

    /**
     * Get the foreign key constraint name (if available)
     * @returns {string|null} Constraint name or null if not available
     */
    constraintName () {
        return this.isForeignKey() && this.foreignKey().constraintName ? this.foreignKey().constraintName : null;
    }

    /**
     * Determine the relationship type of this foreign key
     * @returns {string|null} "one-to-one", "one-to-many", or null if not a foreign key
     */
    getRelationshipType () {
        if (!this.isForeignKey()) return null;
        
        if (this.unique() || this.primaryKey()) {
            return "one-to-one";  // This record can only reference one parent
        } else {
            return "one-to-many"; // Multiple records can reference same parent
        }
    }

    /**
     * Check if this column is suitable for fast lookups (indexed)
     * @returns {boolean} True if column is indexed and good for queries
     */
    isSuitableForLookup () {
        return this.isIndexed() || this.primaryKey() || this.unique();
    }

    /**
     * Get performance characteristics of this column for queries
     * @returns {Object} Performance information
     */
    getQueryPerformance () {
        if (this.primaryKey()) {
            return { type: "primary-key", speed: "fastest", note: "Primary key lookup" };
        } else if (this.unique() && this.isIndexed()) {
            return { type: "unique-index", speed: "very-fast", note: "Unique index lookup" };
        } else if (this.isIndexed()) {
            return { type: "index", speed: "fast", note: "Index scan" };
        } else {
            return { type: "table-scan", speed: "slow", note: "Full table scan required" };
        }
    }

    /**
     * Determine the JavaScript data type of a value with detailed classification
     * @param {*} value - The value to analyze
     * @returns {string} The detected data type
     */
    dataTypeForValue (value) {
        return SvDbDataType.dataTypeForValue(value);
    }

    /**
     * Validate if a value is compatible with this column's requirements
     * @param {*} value - The value to validate
     * @returns {Object} Validation result with { valid: boolean, error?: string }
     */
    validateValue (value) {
        return SvDbDataType.validateValueForDbType(
            value, 
            this.dataType(), 
            this.allowNull(), 
            this.columnName()
        );
    }

    // --- following foreign keys ---

    pointsToTableName () {
        // ok if this is a foreign key, we need to get the table name from the foreign key
        if (this.isForeignKey()) {
            return this.foreignKey().referencedTable;
        }
        return null;
    }

    pointsToOwningTable () {
        const tableName = this.pointsToTableName();
        if (!tableName) {
            return null;
        }
        return this.table().database().tableWithName(tableName);
    }

    // getter and setter names

    getterName () {
        return this.columnName().uncapitalized();
    }

    setterName () {
        return "set" + this.columnName().capitalized();
    }

    // getters and setters for the owning table

    ownerGetterName () {
        // e.g. foreign key "userId" -> "user"
        return this.columnName().sansSuffix("Id").uncapitalized();
    }

    ownerSetterName () {
        // e.g. foreign key "userId" -> "setUser"
        return "set" + this.columnName().sansSuffix("Id").capitalized();
    }

}).initThisClass();

module.exports = SvDbColumn;