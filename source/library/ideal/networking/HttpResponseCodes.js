"use strict";

/* 
    HttpResponseCodes

    Example use:

    const info = HttpResponseCodes.shared().infoForCode(426)

    // info contains: { "type": "Client Error", "description": "Upgrade Required" }

*/

(class HttpResponseCodes extends ProtoClass {
  initPrototypeSlots () {
    this.newSlot("codesMap", null);
  }

  initPrototype () {
    this.setCodesMap(this.codesAsMap())
  }

  init () {
    super.init();
  }

  codesAsMap () {
    const m = new Map();
    const json = this.jsonCodes();
    Object.keys(json).forEach(code => {
      const value = json[code];
      m.set(code, value)
    });
    return m
  }

  infoForCode (code) {
    const info = this.codesMap().get("" + code);
    return info;
  }

  stringForCode (code) {
    const info = this.infoForCode(code);
    if (info) {
      return "HTTP Response Code '" + code + "': " + info.type + ": " + info.description;
    }
    return "Unknown HTTP Response code: '" + code + "'";
  }


  shortStringForCode (code) {
    const info = this.infoForCode(code);
    if (info) {
      return info.type + ": " + info.description;
    }
    return "Unknown HTTP Response code: '" + code + "'";
  }

  jsonCodes () {
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
    }
  }

}.initThisClass());

