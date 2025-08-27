/**
 * AjvValidator - A wrapper around Ajv for JSON Schema validation
 * Compatible with STRVCT framework's validation needs
 */

"use strict";

class AjvValidator {
    /**
     * Creates a clean JSON structure without prototype pollution
     * This is necessary because STRVCT extends Object.prototype with methods like type()
     * which can interfere with libraries that iterate over object properties
     * @param {*} source - The source value to clean (can be object, array, or primitive)
     * @returns {*} - A clean version with no prototype pollution
     */
    static createCleanJSON (source) {
        // Handle null/undefined
        if (source === null || source === undefined) {
            return source;
        }
        
        // Handle primitives (string, number, boolean)
        if (typeof source !== 'object') {
            return source;
        }
        
        // Handle arrays - create clean array with only actual elements
        if (Array.isArray(source)) {
            const cleanArray = [];
            for (let i = 0; i < source.length; i++) {
                cleanArray.push(AjvValidator.createCleanJSON(source[i]));
            }
            return cleanArray;
        }
        
        // Handle regular objects - create with no prototype
        const clean = Object.create(null);
        for (const key in source) {
            if (Object.hasOwn(source, key)) {
                clean[key] = AjvValidator.createCleanJSON(source[key]);
            }
        }
        return clean;
    }

    /**
     * Temporarily removes STRVCT prototype extensions that conflict with Ajv
     * @returns {Object} Saved methods that can be restored later
     */
    static removePrototypeExtensions () {
        const saved = {};
        
        // List of methods that STRVCT adds that might conflict with Ajv
        const methodsToRemove = ['type', 'thisClass', 'superClass', 'thisPrototype'];
        
        // Only need to remove from Object.prototype since Array inherits from Object
        methodsToRemove.forEach(methodName => {
            if (Object.prototype[methodName]) {
                saved[methodName] = Object.prototype[methodName];
                delete Object.prototype[methodName];
            }
        });
        
        return saved;
    }
    
    /**
     * Restores previously removed prototype extensions
     * @param {Object} saved - The saved methods from removePrototypeExtensions
     */
    static restorePrototypeExtensions (saved) {
        // Restore methods to Object.prototype with proper descriptors
        Object.keys(saved).forEach(methodName => {
            Object.defineProperty(Object.prototype, methodName, {
                value: saved[methodName],
                writable: true,
                enumerable: false,  // Important: keep it non-enumerable
                configurable: true
            });
        });
    }

    /**
     * Constructor - creates a new AjvValidator instance
     * @param {Object} [options] - Ajv options
     */
    constructor (options = {}) {
        // Get Ajv7 from appropriate location based on environment
        let ajv7Lib;
        if (typeof window !== 'undefined' && window.ajv7) {
            ajv7Lib = window.ajv7;
        } else if (typeof global !== 'undefined' && global.ajv7) {
            ajv7Lib = global.ajv7;
        } else if (typeof globalThis !== 'undefined' && globalThis.ajv7) {
            ajv7Lib = globalThis.ajv7;
        } else {
            throw new Error("Ajv library not properly loaded. Make sure ajv7.js loads before AjvValidator.js");
        }
        
        // Default options optimized for our use case
        const defaultOptions = {
            strict: false,              // Less strict for compatibility
            validateFormats: false,     // Don't validate formats by default
            addUsedSchema: false,       // Don't add schemas automatically
            allErrors: true,            // Collect all errors, not just first
            verbose: false,             // Don't include schema and data in errors (can cause issues)
            allowUnionTypes: true,      // Allow union types
            strictTypes: false,         // Don't be strict about types
            strictTuples: false,        // Don't be strict about tuples
            strictRequired: false,      // Don't be strict about required
            validateSchema: false,      // DISABLE schema structure validation to avoid prototype pollution issues
        };
        
        // Merge options and create a clean object for Ajv
        const mergedOptions = { ...defaultOptions, ...options };
        this._options = AjvValidator.createCleanJSON(mergedOptions);
        
        // Temporarily remove prototype extensions while creating Ajv
        const savedMethods = AjvValidator.removePrototypeExtensions();
        
        try {
            // Create Ajv instance with clean options
            this._ajv = new ajv7Lib(this._options);
        } catch (err) {
            console.error("Error creating Ajv instance:", err);
            console.error("This is likely due to prototype pollution from STRVCT's extensions");
            // Try again with minimal clean options
            const minimalOptions = AjvValidator.createCleanJSON({
                strict: false,
                validateSchema: false
            });
            this._ajv = new ajv7Lib(minimalOptions);
        } finally {
            // Always restore the prototype extensions
            AjvValidator.restorePrototypeExtensions(savedMethods);
        }
        
        // Internal properties
        this._validate = null;
        this._jsonSchema = null;
        this._error = null;
    }

    /**
     * Set JSON Schema for validation
     * @param {Object} schema - JSON Schema object
     * @returns {AjvValidator} - Returns this for method chaining
     */
    setJsonSchema (schema) {
        if (!schema || typeof schema !== 'object') {
            throw new Error('Schema must be a valid object');
        }
        
        // Use createCleanJSON to remove prototype pollution from ALL parts of the schema
        // This handles objects, arrays, and nested structures
        const cleanSchema = AjvValidator.createCleanJSON(schema);
        
        this._jsonSchema = cleanSchema;
        
        // Temporarily remove prototype extensions while compiling schema
        const savedMethods = AjvValidator.removePrototypeExtensions();
        
        try {
            // Compile the schema
            this._validate = this._ajv.compile(cleanSchema);
            this._error = null;
        } catch (err) {
            // Store compilation error
            this._error = {
                isSchemaError: true,
                isCompilationError: true,
                message: `Schema compilation error: ${err.message}`,
                originalError: err
            };
            
            // Log the error for debugging
            console.error("Ajv compilation error:", err.message);
            console.error("Schema that failed:", JSON.stringify(cleanSchema, null, 2));
        } finally {
            // Always restore the prototype extensions
            AjvValidator.restorePrototypeExtensions(savedMethods);
        }
        
        return this;
    }

    /**
     * Validate JSON data against the schema
     * @param {*} data - Data to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    validate (data) {
        if (!this._validate) {
            if (this._error) {
                // Schema compilation failed
                return false;
            }
            throw new Error('No schema has been set. Call setJsonSchema first.');
        }
        
        if (this._error && this._error.isCompilationError) {
            // Schema compilation error
            return false;
        }
        
        // Validate the data
        const valid = this._validate(data);
        
        if (!valid) {
            // Store validation errors
            this._error = {
                isValidationError: true,
                errors: this._validate.errors,
                message: this._formatErrors(this._validate.errors)
            };
        } else {
            this._error = null;
        }
        
        return valid;
    }

    /**
     * Check if there's an error
     * @returns {boolean} - True if there's an error
     */
    hasError () {
        return this._error !== null;
    }

    /**
     * Get error message
     * @returns {string} - Error message
     */
    errorMessage () {
        if (!this._error) {
            return '';
        }
        
        if (this._error.message) {
            return this._error.message;
        }
        
        if (this._error.errors) {
            return this._formatErrors(this._error.errors);
        }
        
        return 'Unknown validation error';
    }

    /**
     * Get error message formatted for LLM consumption
     * @returns {string} - Formatted error message
     */
    errorMessageForLLM () {
        if (!this._error) {
            return '';
        }
        
        if (this._error.isCompilationError) {
            return `JSON Schema validation failed:\n${this._error.message}`;
        }
        
        if (this._error.isValidationError && this._error.errors) {
            const errors = this._error.errors
                .map(err => {
                    const path = err.instancePath || '/';
                    const message = err.message || 'validation failed';
                    return `At ${path}: ${message}`;
                })
                .join('\n');
            return `JSON validation failed:\n${errors}`;
        }
        
        return this.errorMessage();
    }

    /**
     * Format Ajv errors into a readable message
     * @private
     * @param {Array} errors - Ajv error objects
     * @returns {string} - Formatted error message
     */
    _formatErrors (errors) {
        if (!errors || !Array.isArray(errors)) {
            return 'Validation failed';
        }
        
        return errors
            .map(err => {
                const path = err.instancePath || '#';
                const message = err.message || 'validation failed';
                const params = err.params ? ` (${JSON.stringify(err.params)})` : '';
                return `${path}: ${message}${params}`;
            })
            .join('; ');
    }

    /**
     * Get the last validation errors
     * @returns {Array|null} - Array of error objects or null
     */
    getErrors () {
        if (this._error && this._error.errors) {
            return this._error.errors;
        }
        return null;
    }

    /**
     * Get the JSON Schema
     * @returns {Object|null} - The current schema or null
     */
    getJsonSchema () {
        return this._jsonSchema;
    }

    /**
     * Clear the validator state
     * @returns {AjvValidator} - Returns this for method chaining
     */
    clear () {
        this._validate = null;
        this._jsonSchema = null;
        this._error = null;
        return this;
    }

    /**
     * Get the options
     * @returns {Object} - Current options
     */
    getOptions () {
        return { ...this._options };
    }
}

SvGlobals.set("AjvValidator", AjvValidator);