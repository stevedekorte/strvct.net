/**
 * JsonValidator - A class to validate JSON against JSON Schema
 * using jsonschema
 * 
 * Example usage:
 * 
 * const validator = new JsonValidator();
 * validator.setJsonSchema(schema);
 * const isValid = validator.validate(json);
 * if (!isValid) {
 *   console.error(validator.errorMessageForLLM());
 * } else {
 *   console.log("JSON is valid");
 * }
 * 
 */

// Check if jsonschema is available, but don't throw immediately
// The global might not be set yet if this file loads before jsonschema.js
if (SvGlobals.globals().jsonschema === undefined) {
  console.warn("jsonschema is not yet available in globals - it may load later");
}

class JsonValidator {
  /**
   * Constructor - creates a new JsonValidator instance
   * @param {Object} [options] - jsonschema options
   */
  constructor(options = {}) {
    // Check if jsonschema is properly loaded
    if (!SvGlobals.globals().jsonschema || !SvGlobals.globals().jsonschema.Validator) {
      throw new Error("jsonschema library not properly loaded. Validator class not found. Make sure jsonschema.js loads before JsonValidator.js");
    }
    
    // Default options
    const defaultOptions = {
      throwError: false,        // Don't throw on validation errors
      allowUnknownAttributes: false, // Don't allow unknown attributes
      skipAttributes: [],       // No attributes to skip
      nestedErrors: true,       // Enable nested error reporting
      required: true,           // Enable required field validation
      type: true,              // Enable type checking
      format: true,            // Enable format validation
      coerceTypes: false       // Disable type coercion
    };
    
    // Merge default options with provided options
    this._options = { ...defaultOptions, ...options };
    
    // Internal properties
    this._jsonSchema = null;
    const Validator = SvGlobals.globals().jsonschema.Validator;
    this._validator = new Validator();
    if (!this._validator) { // do not remove this check!
      throw new Error("Failed to create validator instance"); 
    }
    this._error = null;
  }

  /**
   * Set JSON Schema and compile validation function
   * @param {Object} schema - JSON Schema object
   * @returns {JsonValidator} - Returns this for method chaining
   */
  setJsonSchema(schema) {
    if (!schema || typeof schema !== 'object') {
      throw new Error('Schema must be a valid object');
    }
    
    this._jsonSchema = schema;
    try {
      // jsonschema doesn't need compilation, just store the schema
      this._error = null;
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
  jsonSchema() {
    return this._jsonSchema;
  }

  /**
   * Validate JSON data against the schema
   * @param {Object|string} json - JSON data as object or string
   * @returns {boolean} - True if valid, false if invalid
   */
  validate(json) {
    if (!this._jsonSchema) {
      throw new Error('No schema set. Call setJsonSchema() first.');
    }
    
    this._error = null;
    
    // Parse JSON if it's a string
    let data = json;
    if (typeof json === 'string') {
      try {
        data = JSON.parse(json);
      } catch (err) {
        this._error = {
          isJsonParseError: true,
          message: `Invalid JSON: ${err.message}`,
          originalError: err
        };
        return false;
      }
    }
    
    // Explicit type checking
    if (this._jsonSchema.properties) {
      for (const [key, propSchema] of Object.entries(this._jsonSchema.properties)) {
        if (propSchema.type && data[key] !== undefined) {
          const expectedType = propSchema.type;
          const actualType = typeof data[key];
          
          // Special case for integers
          if (expectedType === 'integer' && Number.isInteger(data[key])) {
            continue;
          }
          
          // Special case for numbers
          if (expectedType === 'number' && typeof data[key] === 'number') {
            continue;
          }
          
          // For strings, ensure it's actually a string
          if (expectedType === 'string' && typeof data[key] !== 'string') {
            this._error = {
              isSchemaError: true,
              message: `Property "${key}" must be of type ${expectedType}, got ${actualType}`
            };
            return false;
          }
        }
      }
    }
    
    // Validate against schema
    console.log('Validating data:', data);
    console.log('Against schema:', this._jsonSchema);
    console.log('With options:', this._options);
    const result = this._validator.validate(data, this._jsonSchema, this._options);
    console.log('Validation result:', result);
    if (result.errors && result.errors.length > 0) {
      console.log('Validation errors:', result.errors);
    }
    
    if (!result.valid) {
      this._error = {
        isSchemaError: true,
        errors: result.errors,
        message: this._formatErrors(result.errors)
      };
    }
    
    return result.valid;
  }

  /**
   * Check if the last validation had errors
   * @returns {boolean} - True if there were errors, false otherwise
   */
  hasError() {
    return this._error !== null;
  }

  /**
   * Get error details from the last validation
   * @returns {Object|null} - Error object or null if no errors
   */
  error() {
    return this._error;
  }

  /**
   * Get error message formatted for LLM consumption
   * @returns {string} - Formatted error message
   */
  errorMessageForLLM() {
    if (!this._error) {
      return "No validation errors";
    }

    if (this._error.isJsonParseError) {
      return `JSON Parse Error: ${this._error.message}`;
    }

    if (this._error.isSchemaError) {
      return `Schema Validation Error: ${this._error.message}`;
    }
    
    // Generic error
    return `Error: ${this._error.message || 'An unknown validation error occurred.'}`;
  }

  /**
   * Format errors from jsonschema into a more readable format
   * @private
   */
  _formatErrors(errors) {
    if (!errors || errors.length === 0) {
      return "Unknown validation error";
    }
    
    return errors.map(err => {
      const path = err.property || '(root)';
      return `${path}: ${err.message || 'Validation failed'}`;
    }).join('; ');
  }

  /**
   * Static test method to demonstrate JsonValidator functionality
   * @returns {boolean} - True if all tests pass
   */
  static test() {
    console.log('Running JsonValidator tests...');
    
    // Check if jsonschema is available
    if (!SvGlobals.globals().jsonschema) {
      console.error('jsonschema is not available in global scope');
      return false;
    }
    
    if (!SvGlobals.globals().jsonschema.Validator) {
      console.error('jsonschema.Validator is not available');
      return false;
    }
    
    // Test schema with explicit type definitions
    const schema = {
      type: "object",
      properties: {
        name: {
          type: "string",
          required: true
        }
      },
      additionalProperties: false,
      required: ["name"]
    };
    
    console.log('Test schema:', schema);
    
    // Test cases
    const testCases = [
      {
        name: 'Valid JSON',
        json: { name: 'John' },
        expected: true
      },
      {
        name: 'Invalid JSON - wrong type',
        json: { name: 123 },
        expected: false
      }
    ];
    
    try {
      const validator = new JsonValidator();
      validator.setJsonSchema(schema);
      
      let allTestsPassed = true;
      
      for (const testCase of testCases) {
        const result = validator.validate(testCase.json);
        const passed = result === testCase.expected;
        
        console.log(`Test "${testCase.name}": ${passed ? 'PASSED' : 'FAILED'}`);
        if (!passed) {
          console.log(`Expected: ${testCase.expected}, Got: ${result}`);
          if (validator.hasError()) {
            console.log(`Error: ${validator.errorMessageForLLM()}`);
          }
        }
        
        allTestsPassed = allTestsPassed && passed;
      }
      
      console.log(`All tests ${allTestsPassed ? 'PASSED' : 'FAILED'}`);
      return allTestsPassed;
    } catch (error) {
      console.error('Error during validation:', error);
      return false;
    }
  }
}

SvGlobals.globals().JsonValidator = JsonValidator;

/*
// Run tests always
if (!JsonValidator.test()) {
  throw new Error("JsonValidator tests failed");
}
*/
