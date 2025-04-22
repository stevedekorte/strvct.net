/**
 * JsonValidator - A class to validate JSON against JSON Schema
 * using Ajv (Another JSON Schema Validator)
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

if (Ajv === undefined) {
  throw new Error("Ajv is not defined");
}

class JsonValidator {
  /**
   * Constructor - creates a new JsonValidator instance
   * @param {Object} [options] - Ajv options
   */
  constructor(options = {}) {
    // Default options
    const defaultOptions = {
      allErrors: true,           // Return all errors, not just the first one
      verbose: true,             // Include schema path in errors
      strictTypes: false,        // Less strict type checking for better error messages
      strictRequired: false      // More forgiving required checking
    };
    
    // Merge default options with provided options
    this._options = { ...defaultOptions, ...options };
    
    // Initialize Ajv instance
    this._ajv = new Ajv(this._options);
    
    // Internal properties
    this._jsonSchema = null;
    this._validateFunction = null;
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
    this._validateFunction = this._ajv.compile(schema);
    this._error = null;
    
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
    if (!this._validateFunction) {
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
    
    // Validate against schema
    const isValid = this._validateFunction(data);
    
    if (!isValid) {
      this._error = {
        isSchemaError: true,
        errors: this._validateFunction.errors,
        message: this._ajv.errorsText(this._validateFunction.errors)
      };
    }
    
    return isValid;
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
   * Format error messages specifically for LLM consumption
   * @returns {string|null} - Formatted error message or null if no errors
   */
  errorMessageForLLM() {
    if (!this._error) {
      return null;
    }
    
    // Handle JSON parsing errors
    if (this._error.isJsonParseError) {
      return `Error: The provided JSON is not valid. ${this._error.message}. Please ensure the JSON is properly formatted.`;
    }
    
    // Handle schema validation errors
    if (this._error.isSchemaError) {
      // Create a more detailed and structured message
      const errors = this._error.errors || [];
      
      if (errors.length === 0) {
        return "Error: The data does not match the required schema, but no specific errors were provided.";
      }
      
      // Create a summary
      const errorCount = errors.length;
      let message = `Error: The JSON data is invalid. Found ${errorCount} validation ${errorCount === 1 ? 'issue' : 'issues'}:\n\n`;
      
      // Add detailed errors
      errors.forEach((err, index) => {
        const path = err.instancePath ? err.instancePath : '(root)';
        const property = err.params && err.params.missingProperty ? 
          `"${err.params.missingProperty}"` : 
          (err.params && err.params.additionalProperty ? 
            `"${err.params.additionalProperty}"` : '');
            
        message += `${index + 1}. At ${path}${property ? ` property ${property}` : ''}: ${err.message}\n`;
        
        // Add suggestions based on error type
        if (err.keyword === 'type') {
          message += `   Suggestion: Ensure the value is of type "${err.params.type}"\n`;
        } else if (err.keyword === 'required') {
          message += `   Suggestion: Add the missing property "${err.params.missingProperty}"\n`;
        } else if (err.keyword === 'additionalProperties') {
          message += `   Suggestion: Remove the additional property "${err.params.additionalProperty}"\n`;
        } else if (err.keyword === 'enum') {
          message += `   Suggestion: Use one of the allowed values: ${JSON.stringify(err.params.allowedValues)}\n`;
        }
      });
      
      message += "\nPlease correct these issues and try again.";
      return message;
    }
    
    // Generic error
    return `Error: ${this._error.message || 'An unknown validation error occurred.'}`;
  }
}

getGlobalThis().JsonValidator = JsonValidator;