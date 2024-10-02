/**
 * @module library.ideal.networking
 * @class HttpResponseCodes
 * @extends ProtoClass
 * @classdesc The HttpResponseCodes class provides a convenient way to retrieve information about HTTP response codes.
 */
"use strict";

(class HttpResponseCodes extends ProtoClass {
  /**
   * Initializes the prototype slots.
   * @private
   */
  initPrototypeSlots() {
    {
      /**
       * @member {Map} codesMap - A map of HTTP response codes and their corresponding information.
       * @category Data Storage
       */
      const slot = this.newSlot("codesMap", null);
      slot.setSlotType("Map");
    }
  }

  /**
   * Initializes the prototype by setting the codesMap.
   * @private
   */
  initPrototype() {
    this.setCodesMap(this.codesAsMap());
  }

  /**
   * Initializes the instance.
   * @private
   */
  init() {
    super.init();
  }

  /**
   * Creates a Map of HTTP response codes and their corresponding information.
   * @returns {Map} A Map object containing HTTP response codes as keys and their corresponding information as values.
   * @private
   * @category Data Processing
   */
  codesAsMap() {
    const m = new Map();
    const json = this.jsonCodes();
    Object.keys(json).forEach(code => {
      const value = json[code];
      m.set(code, value);
    });
    return m;
  }

  /**
   * Retrieves the information for a given HTTP response code.
   * @param {number} code - The HTTP response code.
   * @returns {Object} An object containing the type and description of the HTTP response code, or undefined if the code is not found.
   * @static
   * @category Data Retrieval
   */
  infoForCode(code) {
    const info = this.codesMap().get("" + code);
    return info;
  }

  /**
   * Generates a string representation of the HTTP response code information.
   * @param {number} code - The HTTP response code.
   * @returns {string} A string containing the HTTP response code, type, and description.
   * @static
   * @description Retrieves the information for a given HTTP response code and formats it as a string.
   * @category Formatting
   */
  stringForCode(code) {
    const info = this.infoForCode(code);
    if (info) {
      return "HTTP Response Code '" + code + "': " + info.type + ": " + info.description;
    }
    return "Unknown HTTP Response code: '" + code + "'";
  }

  /**
   * Generates a shorter string representation of the HTTP response code information.
   * @param {number} code - The HTTP response code.
   * @returns {string} A string containing the type and description of the HTTP response code.
   * @static
   * @description Retrieves the information for a given HTTP response code and formats it as a shorter string.
   * @category Formatting
   */
  shortStringForCode(code) {
    const info = this.infoForCode(code);
    if (info) {
      return info.type + ": " + info.description;
    }
    return "Unknown HTTP Response code: '" + code + "'";
  }

  /**
   * Retrieves the HTTP response codes and their corresponding information as a JSON object.
   * @returns {Object} A JSON object containing HTTP response codes as keys and their corresponding information as values.
   * @static
   * @private
   * @category Data Storage
   */
  jsonCodes() {
    return {
      "100": {"type": "Informational", "description": "Continue"},
      "101": {"type": "Informational", "description": "Switching Protocols"},
      "102": {"type": "Informational", "description": "Processing"},
      "200": {"type": "Success", "description": "OK"},
      "201": {"type": "Success", "description": "Created"},
      "202": {"type": "Success", "description": "Accepted"},
      "203": {"type": "Success", "description": "Non-Authoritative Information"},
      "204": {"type": "Success", "description": "No Content"},
      "205": {"type": "Success", "description": "Reset Content"},
      "206": {"type": "Success", "description": "Partial Content"},
      "207": {"type": "Success", "description": "Multi-Status"},
      "208": {"type": "Success", "description": "Already Reported"},
      "226": {"type": "Success", "description": "IM Used"},
      "300": {"type": "Redirection", "description": "Multiple Choices"},
      "301": {"type": "Redirection", "description": "Moved Permanently"},
      "302": {"type": "Redirection", "description": "Found"},
      "303": {"type": "Redirection", "description": "See Other"},
      "304": {"type": "Redirection", "description": "Not Modified"},
      "305": {"type": "Redirection", "description": "Use Proxy"},
      "307": {"type": "Redirection", "description": "Temporary Redirect"},
      "308": {"type": "Redirection", "description": "Permanent Redirect"},
      "400": {"type": "Client Error", "description": "Bad Request"},
      "401": {"type": "Client Error", "description": "Unauthorized"},
      "402": {"type": "Client Error", "description": "Payment Required"},
      "403": {"type": "Client Error", "description": "Forbidden"},
      "404": {"type": "Client Error", "description": "Not Found"},
      "405": {"type": "Client Error", "description": "Method Not Allowed"},
      "406": {"type": "Client Error", "description": "Not Acceptable"},
      "407": {"type": "Client Error", "description": "Proxy Authentication Required"},
      "408": {"type": "Client Error", "description": "Request Timeout"},
      "409": {"type": "Client Error", "description": "Conflict"},
      "410": {"type": "Client Error", "description": "Gone"},
      "411": {"type": "Client Error", "description": "Length Required"},
      "412": {"type": "Client Error", "description": "Precondition Failed"},
      "413": {"type": "Client Error", "description": "Payload Too Large"},
      "414": {"type": "Client Error", "description": "URI Too Long"},
      "415": {"type": "Client Error", "description": "Unsupported Media Type"},
      "416": {"type": "Client Error", "description": "Range Not Satisfiable"},
      "417": {"type": "Client Error", "description": "Expectation Failed"},
      "418": {"type": "Client Error", "description": "I'm a teapot"},
      "421": {"type": "Client Error", "description": "Misdirected Request"},
      "422": {"type": "Client Error", "description": "Unprocessable Entity"},
      "423": {"type": "Client Error", "description": "Locked"},
      "424": {"type": "Client Error", "description": "Failed Dependency"},
      "425": {"type": "Client Error", "description": "Too Early"},
      "426": {"type": "Client Error", "description": "Upgrade Required"},
      "428": {"type": "Client Error", "description": "Precondition Required"},
      "429": {"type": "Client Error", "description": "Too Many Requests"},
      "431": {"type": "Client Error", "description": "Request Header Fields Too Large"},
      "451": {"type": "Client Error", "description": "Unavailable For Legal Reasons"},
      "500": {"type": "Server Error", "description": "Internal Server Error"},
      "501": {"type": "Server Error", "description": "Not Implemented"},
      "502": {"type": "Server Error", "description": "Bad Gateway"},
      "503": {"type": "Server Error", "description": "Service Unavailable"},
      "504": {"type": "Server Error", "description": "Gateway Timeout"},
      "505": {"type": "Server Error", "description": "HTTP Version Not Supported"},
      "506": {"type": "Server Error", "description": "Variant Also Negotiates"},
      "507": {"type": "Server Error", "description": "Insufficient Storage"},
      "508": {"type": "Server Error", "description": "Loop Detected"},
      "510": {"type": "Server Error", "description": "Not Extended"},
      "511": {"type": "Server Error", "description": "Network Authentication Required"}
    };
  }

}.initThisClass());