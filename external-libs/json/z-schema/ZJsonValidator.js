"use strict";

/**
 * ZJsonValidator - A wrapper around z-schema for JSON Schema validation
 * Compatible with the JsonValidator interface used in the application
 */
class ZJsonValidator extends Object {
  /**
   * Constructor - creates a new ZJsonValidator instance
   * @param {Object} [options] - z-schema options
   */
  constructor (options = {}) {
    super();
    
    // Check if z-schema is properly loaded
    if (!window.ZSchema) {
      throw new Error("z-schema library not properly loaded. Make sure z-schema.js loads before ZJsonValidator.js");
    }
    
    // Default options optimized for our use case
    const defaultOptions = {
      // Don't throw errors, return validation result instead
      breakOnFirstError: false,
      // Report errors as objects with details
      reportPathAsArray: false,
      // Allow unknown formats (for compatibility)
      ignoreUnknownFormats: true,
      // Don't force strict mode
      strictMode: false,
      // Ignore unresolvable references (like the meta-schema reference)
      ignoreUnresolvableReferences: true,
      // Allow additional properties by default
      forceAdditional: false,
      assumeAdditional: false,
      // Don't require type to be specified
      noTypeless: false,
      // Don't disallow extra keywords (for newer draft support)
      noExtraKeywords: false
    };
    
    // Merge default options with provided options
    this._options = { ...defaultOptions, ...options };
    
    // Create z-schema instance
    const ZSchema = window.ZSchema;
    this._validator = new ZSchema(this._options);
    
    // Internal properties
    this._jsonSchema = null;
    this._error = null;
  }

  /**
   * Set JSON Schema for validation
   * @param {Object} schema - JSON Schema object
   * @returns {ZJsonValidator} - Returns this for method chaining
   */
  setJsonSchema (schema) {
    if (!schema || typeof schema !== 'object') {
      throw new Error('Schema must be a valid object');
    }
    
    this._jsonSchema = schema;
    this._error = null;
    
    // Pre-compile the schema for better performance
    try {
      const isValid = this._validator.validateSchema(schema);
      if (!isValid) {
        const errors = this._validator.getLastErrors();
        this._error = {
          isSchemaError: true,
          isCompilationError: true,
          message: `Schema compilation error: ${this._formatZSchemaErrors(errors)}`,
          errors: errors
        };
      }
    } catch (err) {
      this._error = {
        isSchemaError: true,
        isCompilationError: true,
        message: `Schema compilation error: ${err.message}`,
        originalError: err
      };
    }
    
    return this;
  }

  /**
   * Get current JSON Schema
   * @returns {Object|null} - The current JSON Schema or null if not set
   */
  jsonSchema () {
    return this._jsonSchema;
  }

  /**
   * Validate data against the set schema
   * @param {*} data - Data to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  validate (data) {
    if (!this._jsonSchema) {
      throw new Error('Schema not set. Call setJsonSchema() first.');
    }
    
    // Clear previous error
    this._error = null;
    
    // If schema compilation failed, return false
    if (this._error && this._error.isCompilationError) {
      return false;
    }
    
    try {
      const isValid = this._validator.validate(data, this._jsonSchema);
      
      if (!isValid) {
        const errors = this._validator.getLastErrors();
        this._error = {
          isSchemaError: true,
          errors: errors,
          message: this._formatZSchemaErrors(errors)
        };
      }
      
      return isValid;
    } catch (err) {
      this._error = {
        isSchemaError: false,
        message: `Validation error: ${err.message}`,
        originalError: err
      };
      return false;
    }
  }

  /**
   * Check if the last validation had errors
   * @returns {boolean} - True if there were errors, false otherwise
   */
  hasError () {
    return this._error !== null;
  }

  /**
   * Get error details from the last validation
   * @returns {Object|null} - Error object or null if no errors
   */
  error () {
    return this._error;
  }

  /**
   * Get error message formatted for LLM consumption
   * @returns {string} - Formatted error message
   */
  errorMessageForLLM () {
    if (!this._error) {
      return '';
    }
    
    if (this._error.errors && Array.isArray(this._error.errors)) {
      return this._formatZSchemaErrorsForLLM(this._error.errors);
    }
    
    return this._error.message || 'Unknown validation error';
  }

  /**
   * Format z-schema errors into a readable string
   * @private
   * @param {Array} errors - Array of z-schema error objects
   * @returns {string} - Formatted error message
   */
  _formatZSchemaErrors (errors) {
    if (!errors || errors.length === 0) {
      return 'Unknown error';
    }
    
    return errors.map(err => {
      let message = err.message || err.code || 'Unknown error';
      if (err.path) {
        message = `${err.path}: ${message}`;
      }
      return message;
    }).join('; ');
  }

  /**
   * Format z-schema errors for LLM consumption with clear instructions
   * @private
   * @param {Array} errors - Array of z-schema error objects
   * @returns {string} - Formatted error message for LLM
   */
  _formatZSchemaErrorsForLLM (errors) {
    if (!errors || errors.length === 0) {
      return 'Unknown validation error';
    }
    
    const errorMessages = errors.map(err => {
      let path = err.path || 'root';
      let message = err.message || err.code || 'Unknown error';
      
      // Make the error message more descriptive for LLMs
      if (err.code === 'OBJECT_MISSING_REQUIRED_PROPERTY') {
        const property = err.params && err.params[0];
        if (property) {
          message = `Missing required property: ${property}`;
        }
      } else if (err.code === 'INVALID_TYPE') {
        const expected = err.params && err.params[0];
        const actual = err.params && err.params[1];
        if (expected && actual) {
          message = `Expected type ${expected} but got ${actual}`;
        }
      } else if (err.code === 'ENUM_MISMATCH') {
        const allowedValues = err.params && err.params[0];
        if (allowedValues) {
          message = `Value must be one of: ${JSON.stringify(allowedValues)}`;
        }
      }
      
      return `At ${path}: ${message}`;
    });
    
    return 'JSON Schema validation failed:\n' + errorMessages.join('\n');
  }

  /**
   * Add a schema definition that can be referenced by $ref
   * @param {Object} schema - The schema to add
   * @param {string} uri - The URI to register the schema under
   * @returns {ZJsonValidator} - Returns this for method chaining
   */
  addSchema (schema, uri) {
    // z-schema uses setRemoteReference for adding schemas
    this._validator.setRemoteReference(uri, schema);
    return this;
  }

  /**
   * Set validation options
   * @param {Object} options - Options to set
   * @returns {ZJsonValidator} - Returns this for method chaining
   */
  setOptions (options) {
    this._options = { ...this._options, ...options };
    // Recreate validator with new options
    const ZSchema = window.z_schema;
    this._validator = new ZSchema(this._options);
    // Re-set the schema if it was already set
    if (this._jsonSchema) {
      this.setJsonSchema(this._jsonSchema);
    }
    return this;
  }

  /**
   * Get current validation options
   * @returns {Object} - Current options
   */
  getOptions () {
    return { ...this._options };
  }
}

// Draft-07 JSON Schema meta-schema
/*
const draft07Schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://json-schema.org/draft-07/schema#",
    "title": "Core schema meta-schema",
    "definitions": {
        "schemaArray": {
            "type": "array",
            "minItems": 1,
            "items": { "$ref": "#" }
        },
        "nonNegativeInteger": {
            "type": "integer",
            "minimum": 0
        },
        "nonNegativeIntegerDefault0": {
            "allOf": [
                { "$ref": "#/definitions/nonNegativeInteger" },
                { "default": 0 }
            ]
        },
        "simpleTypes": {
            "enum": [
                "array",
                "boolean",
                "integer",
                "null",
                "number",
                "object",
                "string"
            ]
        },
        "stringArray": {
            "type": "array",
            "items": { "type": "string" },
            "uniqueItems": true,
            "default": []
        }
    },
    "type": ["object", "boolean"],
    "properties": {
        "$id": {
            "type": "string",
            "format": "uri-reference"
        },
        "$schema": {
            "type": "string",
            "format": "uri"
        },
        "$ref": {
            "type": "string",
            "format": "uri-reference"
        },
        "$comment": {
            "type": "string"
        },
        "title": {
            "type": "string"
        },
        "description": {
            "type": "string"
        },
        "default": true,
        "readOnly": {
            "type": "boolean",
            "default": false
        },
        "writeOnly": {
            "type": "boolean",
            "default": false
        },
        "examples": {
            "type": "array",
            "items": true
        },
        "multipleOf": {
            "type": "number",
            "exclusiveMinimum": 0
        },
        "maximum": {
            "type": "number"
        },
        "exclusiveMaximum": {
            "type": "number"
        },
        "minimum": {
            "type": "number"
        },
        "exclusiveMinimum": {
            "type": "number"
        },
        "maxLength": { "$ref": "#/definitions/nonNegativeInteger" },
        "minLength": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
        "pattern": {
            "type": "string",
            "format": "regex"
        },
        "additionalItems": { "$ref": "#" },
        "items": {
            "anyOf": [
                { "$ref": "#" },
                { "$ref": "#/definitions/schemaArray" }
            ],
            "default": true
        },
        "maxItems": { "$ref": "#/definitions/nonNegativeInteger" },
        "minItems": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
        "uniqueItems": {
            "type": "boolean",
            "default": false
        },
        "contains": { "$ref": "#" },
        "maxProperties": { "$ref": "#/definitions/nonNegativeInteger" },
        "minProperties": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
        "required": { "$ref": "#/definitions/stringArray" },
        "additionalProperties": { "$ref": "#" },
        "definitions": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "properties": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "patternProperties": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "propertyNames": { "format": "regex" },
            "default": {}
        },
        "dependencies": {
            "type": "object",
            "additionalProperties": {
                "anyOf": [
                    { "$ref": "#" },
                    { "$ref": "#/definitions/stringArray" }
                ]
            }
        },
        "propertyNames": { "$ref": "#" },
        "const": true,
        "enum": {
            "type": "array",
            "items": true,
            "minItems": 1,
            "uniqueItems": true
        },
        "type": {
            "anyOf": [
                { "$ref": "#/definitions/simpleTypes" },
                {
                    "type": "array",
                    "items": { "$ref": "#/definitions/simpleTypes" },
                    "minItems": 1,
                    "uniqueItems": true
                }
            ]
 
 
 
 
            },
        "format": { "type": "string" },
        "contentMediaType": { "type": "string" },
        "contentEncoding": { "type": "string" },
        "if": { "$ref": "#" },
        "then": { "$ref": "#" },
        "else": { "$ref": "#" },
        "allOf": { "$ref": "#/definitions/schemaArray" },
        "anyOf": { "$ref": "#/definitions/schemaArray" },
        "oneOf": { "$ref": "#/definitions/schemaArray" },
        "not": { "$ref": "#" }
    },
    "default": true
};
*/

SvGlobals.set("ZJsonValidator", ZJsonValidator);