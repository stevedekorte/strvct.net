// First, install the json-repair package: npm install json-repair

/**
 * A utility class to extract properties from invalid JSON using the json-repair library
 */
class JsonRepairShop {
  /**
   * Constructor
   * @param {string} jsonString - Optional initial JSON string
   */
  constructor(jsonString = null) {
    this._jsonString = jsonString;
  }

  /**
   * Set the JSON string to work with
   * @param {string} jsonString - The JSON string to process
   */
  setJsonString(jsonString) {
    this._jsonString = jsonString;
  }

  /**
   * Extract a property from the JSON string
   * @param {string} propertyName - The name of the property to extract
   * @returns {any} The value of the property if found, or undefined otherwise
   */
  extractProperty(propertyName) {
    if (!this._jsonString) {
      return undefined;
    }

    // Try multiple methods to extract the property
    let propertyValue;
    
    // Method 1: Use the robust property extractor
    propertyValue = this._robustPropertyExtractor(propertyName);
    if (propertyValue !== undefined) return propertyValue;
    
    // Method 2: Try the top level extractor
    const allProps = this.extractTopLevelProperties();
    propertyValue = allProps[propertyName];
    if (propertyValue !== undefined) return propertyValue;
    
    // Method 3: Try manual repair
    propertyValue = this._extractPropertyWithManualRepair(propertyName);
    if (propertyValue !== undefined) return propertyValue;
    
    // Method 4: Try regex as a last resort
    propertyValue = this._extractPropertyWithRegex(propertyName);
    if (propertyValue !== undefined) return propertyValue;
    
    // Method 5: Try json-repair library as final attempt
    propertyValue = this._extractPropertyWithRepair(propertyName);
    
    return propertyValue;
  }

  /**
   * Extract a property using regex
   * @private
   * @param {string} propertyName - The name of the property to extract
   * @returns {any} The value of the property, or undefined if not found
   */
  _extractPropertyWithRegex(propertyName) {
    // This regex looks for "propertyName": followed by a string or number value
    const propertyRegex = new RegExp(`"${propertyName}"\\s*:\\s*(?:"([^"]*)"|(\\d+))`, 'i');
    const match = this._jsonString.match(propertyRegex);
    
    if (match) {
      // Return either the string value (match[1]) or the numeric value (match[2])
      return match[1] || match[2] || undefined;
    }
    
    return undefined;
  }

  /**
   * Extract a property using a robust regex approach
   * @private
   * @param {string} propertyName - The name of the property to extract
   * @returns {any} The value of the property, or undefined if not found
   */
  _robustPropertyExtractor(propertyName) {
    // This approach handles nested structures better
    const propertyRegex = new RegExp(`"${propertyName}"\\s*:\\s*(("[^"]*")|([\\d]+)|true|false|null)`, 'i');
    const match = this._jsonString.match(propertyRegex);
    
    if (!match || !match[1]) return undefined;
    
    const rawValue = match[1].trim();
    
    // Parse the value according to its type
    if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
      return rawValue.slice(1, -1); // String
    } else if (rawValue === "true") {
      return true;
    } else if (rawValue === "false") {
      return false;
    } else if (rawValue === "null") {
      return null;
    } else if (!isNaN(Number(rawValue))) {
      return Number(rawValue);
    }
    
    return rawValue;
  }

  /**
   * Extract all top-level properties
   * @private
   * @returns {object} An object containing all extracted properties
   */
  extractTopLevelProperties() {
    const result = {};
    
    // Match all top-level property definitions
    const propRegex = /"([^"]+)"\s*:\s*("([^"\\]*(\\.[^"\\]*)*)"|\d+|true|false|null|\{[^}]*\}|\[[^\]]*\])/g;
    
    let match;
    while ((match = propRegex.exec(this._jsonString)) !== null) {
      const key = match[1];
      let value = match[2];
      
      // Try to determine the type and convert accordingly
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (!isNaN(Number(value))) {
        value = Number(value);
      }
      
      result[key] = value;
    }
    
    return result;
  }

  /**
   * Extract a property using manual JSON repair
   * @private
   * @param {string} propertyName - The name of the property to extract
   * @returns {any} The value of the property, or undefined if not found or on error
   */
  _extractPropertyWithManualRepair(propertyName) {
    // Fix common JSON errors:
    
    // 1. Missing closing quotes for strings
    let repaired = this._jsonString.replace(/:\s*"([^"]*)(?=[,}\]])/g, ': "$1"');
    
    // 2. Missing commas between properties
    repaired = repaired.replace(/}(\s*){/g, '},\n$1{');
    
    // 3. Trailing commas
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    
    try {
      const parsed = JSON.parse(repaired);
      // Extract the requested property
      return propertyName in parsed ? parsed[propertyName] : undefined;
    } catch (e) {
      console.log("Repair attempt failed:", e.message);
      return undefined;
    }
  }

  /**
   * Extract a property using the json-repair library
   * @private
   * @param {string} propertyName - The name of the property to extract
   * @returns {any} The value of the property, or undefined if not found or on error
   */
  _extractPropertyWithRepair(propertyName) {
    try {
      // Try to repair the JSON
      const repairedJson = jsonRepair(this._jsonString);
      // Parse the repaired JSON
      const parsedJson = JSON.parse(repairedJson);
      // Return the requested property if it exists
      return propertyName in parsedJson ? parsedJson[propertyName] : undefined;
    } catch (error) {
      console.error('Failed to repair JSON:', error);
      return undefined;
    }
  }
}

getGlobalThis().JsonRepairShop = JsonRepairShop;