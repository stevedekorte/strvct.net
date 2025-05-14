(() => {
  // json/jsonrepair/JsonRepairShop.js
  var JsonRepairShop = class {
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
        return void 0;
      }
      let propertyValue;
      propertyValue = this._robustPropertyExtractor(propertyName);
      if (propertyValue !== void 0) return propertyValue;
      const allProps = this.extractTopLevelProperties();
      propertyValue = allProps[propertyName];
      if (propertyValue !== void 0) return propertyValue;
      propertyValue = this._extractPropertyWithManualRepair(propertyName);
      if (propertyValue !== void 0) return propertyValue;
      propertyValue = this._extractPropertyWithRegex(propertyName);
      if (propertyValue !== void 0) return propertyValue;
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
      const propertyRegex = new RegExp(`"${propertyName}"\\s*:\\s*(?:"([^"]*)"|(\\d+))`, "i");
      const match = this._jsonString.match(propertyRegex);
      if (match) {
        return match[1] || match[2] || void 0;
      }
      return void 0;
    }
    /**
     * Extract a property using a robust regex approach
     * @private
     * @param {string} propertyName - The name of the property to extract
     * @returns {any} The value of the property, or undefined if not found
     */
    _robustPropertyExtractor(propertyName) {
      const propertyRegex = new RegExp(`"${propertyName}"\\s*:\\s*(("[^"]*")|([\\d]+)|true|false|null)`, "i");
      const match = this._jsonString.match(propertyRegex);
      if (!match || !match[1]) return void 0;
      const rawValue = match[1].trim();
      if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
        return rawValue.slice(1, -1);
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
      const propRegex = /"([^"]+)"\s*:\s*("([^"\\]*(\\.[^"\\]*)*)"|\d+|true|false|null|\{[^}]*\}|\[[^\]]*\])/g;
      let match;
      while ((match = propRegex.exec(this._jsonString)) !== null) {
        const key = match[1];
        let value = match[2];
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
      let repaired = this._jsonString.replace(/:\s*"([^"]*)(?=[,}\]])/g, ': "$1"');
      repaired = repaired.replace(/}(\s*){/g, "},\n$1{");
      repaired = repaired.replace(/,(\s*[}\]])/g, "$1");
      try {
        const parsed = JSON.parse(repaired);
        return propertyName in parsed ? parsed[propertyName] : void 0;
      } catch (e) {
        console.log("Repair attempt failed:", e.message);
        return void 0;
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
        const repairedJson = jsonRepair(this._jsonString);
        const parsedJson = JSON.parse(repairedJson);
        return propertyName in parsedJson ? parsedJson[propertyName] : void 0;
      } catch (error) {
        console.error("Failed to repair JSON:", error);
        return void 0;
      }
    }
  };
  getGlobalThis().JsonRepairShop = JsonRepairShop;
})();
//# sourceMappingURL=JsonRepairShop.bundle.js.map
