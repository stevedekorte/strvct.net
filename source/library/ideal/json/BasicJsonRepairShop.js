
/**
 * @class BasicJsonRepairShop
 * @extends Object
 * @classdesc A basic JSON repair shop that can repair JSON strings. 
 */

class BasicJsonRepairShop extends Object {
  /**
   * Constructor
   * @param {string} jsonString - Optional initial JSON string
   */
  constructor (jsonString = null) {
    super();
    this._jsonString = jsonString;
    this._isLogEnabled = false;
  }

  /**
   * Set the JSON string to work with
   * @param {string} jsonString - The JSON string to process
   */
  setJsonString (jsonString) {
    this._jsonString = jsonString;
    return this;
  }

  jsonString () {
    return this._jsonString;
  }

  setLogEnabled (isLogEnabled) {
    this._isLogEnabled = isLogEnabled;
    return this;
  }

  isLogEnabled () {
    return this._isLogEnabled;
  }

  // error handling

  isValid () {
    return Type.isValidJsonString(this.jsonString());
  }

  errorString () {
    return Type.errorWithJsonType(this.jsonString());
  }

  errorObject () {
    const errorString = this.errorString();
    if (Type.isNullOrUndefined(errorString)) {
        return new Error("JsonRepairShop: attempt to get error object but there is no error");
    }
    return new Error(errorString);
  }

  logAttemptingToFix () {
    console.warn("BasicJsonRepairShop attempting to fix:");
    this.logJsonString();
  }

  logSuccessfullyRepaired () {
    console.log("BasicJsonRepairShop successfully repaired:");
    this.logJsonString();
  }

  logFailedToRepair () {
    console.error("BasicJsonRepairShop failed to repair:");
    this.logJsonString();
  }

  logJsonString () {
    const parts = [" -- json string ---", this.jsonString(), " --- "];
    console.log(parts.join("\n"));
  }

  // repair methods


  repair () {
    // try our bag of tricks to fix common LLM JSON errors
    // exit early if fix seems to work

    if (this.isValid()) {  
        return true;
    }

    if (this.isLogEnabled()) {
      this.logAttemptingToFix();
    }

    this.tryRemovingLastChar("}"); // most common Claude error

    if (this.isValid()) {  
        return true;
    }

    this.repairCdata();

    this.repairInvalidFirstChar();
    this.repairInvalidLastChar();

    if (this.isValid()) {  
        return true;
    }

    this.matchFirstAndLastChars("{", "}");
    this.matchFirstAndLastChars("[", "]");
    this.matchFirstAndLastChars("\"", "\"");

    if (this.isValid()) {  
        return true;
    }

    this.tryRemovingFirstChar("{");
    this.tryRemovingFirstChar("[");
    this.tryRemovingFirstChar("\"");

    if (this.isValid()) {  
        return true;
    }

    this.tryRemovingLastChar("}"); // most common Claude error
    this.tryRemovingLastChar("]");
    this.tryRemovingLastChar("\"");

    const isValid = this.isValid();
    if (this.isLogEnabled()) {
        if (isValid) {
            this.logSuccessfullyRepaired();
        } else {
            this.logFailedToRepair();
        }
    }
    return isValid;
  }

  // JSON repair methods

  validFirstChars () {
    return ["{", "[", "\"", "-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "t", "f", "n"];
  }

  validLastChars () {
    return ["}", "]", "\"", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "e", "l"];
  }

  repairCdata () {
    // do we need to remove CDATA header and footer?
    let jsonString = this._jsonString;

    if (jsonString.startsWith("<![CDATA[")) {
        jsonString = jsonString.substring(9, jsonString.length);
    }

    if (jsonString.endsWith("]]>")) {
        jsonString = jsonString.substring(0, jsonString.length - 3);
    }

    this.setJsonString(jsonString);
  }

  hasValidFirstChar () {
    return this.validFirstChars().includes(this.jsonString().firstCharacter());
  }

  repairInvalidFirstChar () {
    while (this.jsonString().length > 0 && !this.hasValidFirstChar()) {
            this.setJsonString(this.jsonString().sansFirstCharacter());
    }
  }

  hasValidLastChar () {
    return this.validLastChars().includes(this.jsonString().lastCharacter());
  }

  repairInvalidLastChar () {
    while (this.jsonString().length > 0 && !this.hasValidLastChar()) {
      this.setJsonString(this.jsonString().sansLastCharacter());
    }
  }

  matchFirstAndLastChars (firstChar, lastChar) {
    let jsonString = this._jsonString;

    // e.g. if the first character is a {, make sure the last character is a }
    if (jsonString.firstCharacter() === firstChar) {
        if (jsonString.lastCharacter() !== lastChar) {
            let s = jsonString + lastChar;
            if (s.isValidJson()) {
                jsonString = s;
            }
        }
    }

    if (jsonString.lastCharacter() === lastChar) {
        if (jsonString.firstCharacter() !== firstChar) {
            let s = firstChar + jsonString;
            if (s.isValidJson()) {
                jsonString = s;
            }
        }
    }

    this.setJsonString(jsonString);
    return this;
  }

  tryRemovingLastChar (lastChar) {
    let jsonString = this._jsonString;
    if (jsonString.lastCharacter() === lastChar) {
        let s = jsonString.sansLastCharacter();
        if (s.isValidJson()) {
            jsonString = s;
        }
    }

    this.setJsonString(jsonString);
    return this;
  }

  tryRemovingFirstChar (firstChar) {
    let jsonString = this._jsonString;
    if (jsonString.firstCharacter() === firstChar) {
        let s = jsonString.sansFirstCharacter();
        if (s.isValidJson()) {
            jsonString = s;
        }
    }

    this.setJsonString(jsonString);
    return this;
  }



}

SvGlobals.globals().BasicJsonRepairShop = BasicJsonRepairShop;