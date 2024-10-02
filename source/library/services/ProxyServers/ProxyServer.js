"use strict";

/**
 * @module library.services.ProxyServers
 */

/**
 * @class ProxyServer
 * @extends BMSummaryNode
 * @classdesc ProxyServer
 * 
 * NOTES:
 * 
 * This is setup up for a simple proxy with a path and url sent in a url parameter.
 * Use another class or subclass to handle more complex proxy request, such as passing 
 * an XML/JSON body with auth and/or other info.
 */
(class ProxyServer extends BMSummaryNode {
  /**
   * @description Initializes the prototype slots for the ProxyServer class.
   * @category Initialization
   */
  initPrototypeSlots () {
    /**
     * @member {boolean} isSecure - Indicates if the server is secure (https).
     * @category Configuration
     */
    {
      const slot = this.newSlot("isSecure", true);
      slot.setShouldJsonArchive(true)
      slot.setInspectorPath("")
      slot.setLabel("Secure")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
    }

    /**
     * @member {string} subdomain - The subdomain of the proxy server.
     * @category Configuration
     */
    {
      const slot = this.newSlot("subdomain", "");
      slot.setShouldJsonArchive(true)
      slot.setInspectorPath("")
      slot.setLabel("Sudomain")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
    }

    /**
     * @member {string} domain - The domain of the proxy server.
     * @category Configuration
     */
    {
      const slot = this.newSlot("domain", "");
      slot.setShouldJsonArchive(true)
      slot.setInspectorPath("")
      slot.setLabel("Domain")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
    }

    /**
     * @member {number} port - The port number of the proxy server.
     * @category Configuration
     */
    {
      const slot = this.newSlot("port", 0);
      slot.setShouldJsonArchive(true)
      slot.setInspectorPath("")
      slot.setLabel("Port")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
    }

    /**
     * @member {string} path - The path of the proxy server.
     * @category Configuration
     */
    {
      const slot = this.newSlot("path", "");
      slot.setShouldJsonArchive(true)
      slot.setInspectorPath("")
      slot.setLabel("Path")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
    }

    /**
     * @member {string|null} parameterName - The name of the parameter used in the proxy URL.
     * @category Configuration
     */
    {
      const slot = this.newSlot("parameterName", null);
      slot.setShouldJsonArchive(true)
      slot.setInspectorPath("")
      slot.setLabel("Parameter Name")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
    }

    /**
     * @member {string} error - The error message, if any.
     * @category Error Handling
     */
    {
      const slot = this.newSlot("error", "");
      slot.setShouldJsonArchive(true)
      slot.setInspectorPath("")
      slot.setLabel("Error")
      slot.setShouldStoreSlot(false)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    //this.setSubnodeClasses([ProxyRequest]);

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setTitle("Unnamed Proxy Server");
    this.setCanDelete(true);
    this.setNoteIsSubnodeCount(false);
    this.setNodeCanReorderSubnodes(false);
    this.setNodeCanEditTitle(true);
    this.setSubtitle("");
  }

  /**
   * @description Returns the protocol string based on the isSecure property.
   * @returns {string} The protocol string ("https" or "http").
   * @category URL Generation
   */
  protocolString() {
    return this.isSecure() ? "https" : "http";
  }

  /**
   * @description Returns the full hostname of the proxy server.
   * @returns {string} The full hostname.
   * @category URL Generation
   */
  hostname() {
    const s = this.subdomain();
    const d = this.domain();
    
    if (d === "localhost") {
      return d;
    }

    if (s) {
      return s + "." + d;
    }
    return d;
  }

  /**
   * @description Sets the hostname by splitting it into subdomain and domain.
   * @param {string} hostname - The full hostname to set.
   * @returns {ProxyServer} The current instance for method chaining.
   * @category Configuration
   */
  setHostname(hostname) {
      const parts = hostname.split('.');
  
      if (parts.length < 2) {
          this.setDomain(hostname); // e.g. localhost
          return this;
      }
  
      const domain = parts.slice(-2).join('.');
      const subdomain = parts.slice(0, -2).join('.') || null;
  
      this.setDomain(domain);
      this.setSubdomain(subdomain);
      return this;
  }

  /**
   * @description Validates the current state of the proxy server.
   * @returns {string[]} An array of validation error messages.
   * @category Validation
   */
  validationErrors() {
    const errors = []

    if (!Type.isString(this.hostname())) {
      errors.push("hostname isn't a string");
    } else if (this.hostname().length === 0) {
      errors.push("hostname is empty")
    }

    if (!Type.isString(this.parameterName())) {
      errors.push("parameterName isn't a string")
    } else if (this.parameterName().length === 0) {
      errors.push("parameterName is empty")
    }

    return errors
  }

  /**
   * @description Returns the subtitle for the proxy server.
   * @returns {string|null} The proxy URL for the "targetUrl" parameter.
   * @category UI
   */
  subtitle() {
    return this.proxyUrlForUrl("targetUrl")
  }

  /**
   * @description Generates a proxy URL for the given target URL.
   * @param {string} targetUrl - The target URL to be proxied.
   * @returns {string|null} The generated proxy URL or null if there's an error.
   * @category URL Generation
   */
  proxyUrlForUrl(targetUrl) {
    assert(targetUrl);

    const errors = this.validationErrors()
    if(errors.length) {
      this.setError("ERROR: " + errors[0]);
      this.showError();
      return null
    }


    const parameterValue = targetUrl;
    
    let urlString = this.protocolString() + "://" + this.hostname();

    if (this.port() !== 0 && this.port() !== null) {
        urlString += ":" + this.port();
    }

    if (this.path()) {
      urlString += this.path();
    }

    let resultUrl;
    try {
      const url = new URL(urlString);
      url.searchParams.set(this.parameterName(), parameterValue);
      resultUrl = url.toString();
    } catch (e) {
      this.setError(e.message);
      this.showError();
      return null;
    }

    this.setError("");
    return resultUrl;
  }

  /**
   * @description Displays the current error message in the console.
   * @returns {ProxyServer} The current instance for method chaining.
   * @category Error Handling
   */
  showError() {
    console.warn(this.type() + " ERROR: " + this.error());
    return this;
  }

}.initThisClass());