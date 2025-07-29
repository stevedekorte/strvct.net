/**
 * @module webserver/orm
 */

"use strict";

const { Base } = require("../../../GameServer/site/strvct/webserver");

/**
 * @class SvDbDataType
 * @extends Base
 * @classdesc Centralizes data type detection, validation, and compatibility logic for the ORM.
 * 
 * This class provides static methods for JavaScript type analysis and database type compatibility
 * checking. It serves as the foundation for data validation throughout the ORM system.
 * 
 * Key responsibilities:
 * - JavaScript value type detection with detailed classification
 * - Database type compatibility mapping and validation
 * - Type-specific validation rules (UUID format, date parsing, etc.)
 * - Centralized type conversion and coercion logic
 * 
 * Usage:
 * ```javascript
 * // Detect JavaScript type of a value
 * const jsType = SvDbDataType.dataTypeForValue(42); // "Integer"
 * 
 * // Validate value compatibility with database type
 * const validation = SvDbDataType.validateValueForDbType(value, "UUID", true);
 * if (!validation.valid) {
 *   console.error(validation.error);
 * }
 * 
 * // Check type compatibility
 * const compatible = SvDbDataType.isValueCompatibleWithDbType("hello", "STRING"); // true
 * ```
 */
(class SvDbDataType extends Base {

    /**
     * @description Initialize prototype slots for the SvDbDataType.
     * @category Initialization
     */
    initPrototypeSlots () {
        // No instance slots needed - this is primarily a utility class with static methods
    }

    /**
     * @description Initialize prototype for the SvDbDataType.
     * @category Initialization
     */
    initPrototype () {
        // Prototype initialization will be implemented here
    }

    /**
     * Determine the JavaScript data type of a value with detailed classification
     * @param {*} value - The value to analyze
     * @returns {string} The detected data type
     * @static
     */
    static dataTypeForValue (value) {
        // Handle null and undefined explicitly
        if (value === null) {
            return "Null";
        }
        if (value === undefined) {
            return "Undefined";
        }
        
        // Handle primitive types
        if (typeof value === "string") {
            return "String";
        }
        if (typeof value === "boolean") {
            return "Boolean";
        }
        if (typeof value === "bigint") {
            return "BigInt";
        }
        
        // Handle numbers with special cases
        if (typeof value === "number") {
            if (Number.isNaN(value)) {
                return "NaN";
            }
            if (!Number.isFinite(value)) {
                return "Infinity";
            }
            if (Number.isInteger(value)) {
                return "Integer";
            }
            return "Float";
        }
        
        // Handle object types by constructor
        if (typeof value === "object") {
            const constructor = value.constructor?.name;
            switch (constructor) {
                case "Date":
                    return "Date";
                case "Array":
                    return "Array";
                case "Buffer":
                    return "Buffer";
                case "RegExp":
                    return "RegExp";
                default:
                    // Generic object or unknown constructor
                    return constructor || "Object";
            }
        }
        
        // Catch-all for functions and other exotic types
        return typeof value;
    }

    /**
     * Get the compatible JavaScript types for a database column type
     * @param {string} dbType - The database column type (UUID, STRING, INTEGER, etc.)
     * @returns {Array<string>} Array of compatible JavaScript type names
     * @static
     */
    static getCompatibleJsTypesForDbType (dbType) {
        const typeCompatibility = {
            'UUID': ['String'],
            'STRING': ['String', 'Integer', 'Float'], // Numbers can be converted to strings
            'INTEGER': ['Integer', 'Boolean'], // Boolean -> 0/1
            'FLOAT': ['Float', 'Integer'],
            'DATE': ['Date', 'String'], // ISO strings are acceptable
            'BOOLEAN': ['Boolean', 'Integer'], // 0/1 values
            'BLOB': ['Buffer', 'String'],
            'DECIMAL': ['Float', 'Integer', 'String'],
            'TIME': ['Date', 'String'],
            'ENUM': ['String']
        };

        return typeCompatibility[dbType] || [dbType];
    }

    /**
     * Check if a JavaScript value type is compatible with a database column type
     * @param {string} jsType - The JavaScript type (from dataTypeForValue)
     * @param {string} dbType - The database column type
     * @returns {boolean} True if types are compatible
     * @static
     */
    static isJsTypeCompatibleWithDbType (jsType, dbType) {
        const compatibleTypes = this.getCompatibleJsTypesForDbType(dbType);
        return compatibleTypes.includes(jsType);
    }

    /**
     * Check if a value is compatible with a database column type
     * @param {*} value - The value to check
     * @param {string} dbType - The database column type
     * @returns {boolean} True if value is compatible
     * @static
     */
    static isValueCompatibleWithDbType (value, dbType) {
        const jsType = this.dataTypeForValue(value);
        return this.isJsTypeCompatibleWithDbType(jsType, dbType);
    }

    /**
     * Validate a UUID string format
     * @param {string} value - The UUID string to validate
     * @returns {Object} Validation result with { valid: boolean, error?: string }
     * @static
     */
    static validateUuidFormat (value) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
            return { valid: false, error: "Invalid UUID format" };
        }
        return { valid: true };
    }

    /**
     * Validate a date string format
     * @param {string} value - The date string to validate
     * @returns {Object} Validation result with { valid: boolean, error?: string }
     * @static
     */
    static validateDateFormat (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return { valid: false, error: "Invalid date string" };
        }
        return { valid: true };
    }

    /**
     * Perform type-specific validation for database column types
     * @param {*} value - The value to validate
     * @param {string} dbType - The database column type
     * @param {string} jsType - The JavaScript type (optional, will be detected if not provided)
     * @returns {Object} Validation result with { valid: boolean, error?: string }
     * @static
     */
    static validateSpecificDbType (value, dbType, jsType = null) {
        if (!jsType) {
            jsType = this.dataTypeForValue(value);
        }

        // UUID-specific validation
        if (dbType === 'UUID' && jsType === 'String') {
            return this.validateUuidFormat(value);
        }

        // Date-specific validation
        if (dbType === 'DATE' && jsType === 'String') {
            return this.validateDateFormat(value);
        }

        // Add more type-specific validations here as needed
        // TIME, DECIMAL, ENUM, etc.

        return { valid: true };
    }

    /**
     * Comprehensive validation of a value against a database column type
     * @param {*} value - The value to validate
     * @param {string} dbType - The database column type
     * @param {boolean} allowNull - Whether null values are allowed
     * @param {string} columnName - Column name for error messages (optional)
     * @returns {Object} Validation result with { valid: boolean, error?: string }
     * @static
     */
    static validateValueForDbType (value, dbType, allowNull = true, columnName = null) {
        const columnRef = columnName ? `Column '${columnName}'` : 'Column';

        // Handle null values
        if (value === null || value === undefined) {
            if (!allowNull) {
                return { valid: false, error: `${columnRef} does not allow null values` };
            }
            return { valid: true };
        }

        const jsType = this.dataTypeForValue(value);

        // Check basic type compatibility
        if (!this.isJsTypeCompatibleWithDbType(jsType, dbType)) {
            const compatibleTypes = this.getCompatibleJsTypesForDbType(dbType);
            return { 
                valid: false, 
                error: `${columnRef} expects ${dbType} but received ${jsType}. Compatible types: ${compatibleTypes.join(', ')}` 
            };
        }

        // Perform type-specific validation
        const specificValidation = this.validateSpecificDbType(value, dbType, jsType);
        if (!specificValidation.valid) {
            return { 
                valid: false, 
                error: `${columnRef} ${specificValidation.error}` 
            };
        }

        return { valid: true };
    }

}).initThisClass();

module.exports = SvDbDataType;