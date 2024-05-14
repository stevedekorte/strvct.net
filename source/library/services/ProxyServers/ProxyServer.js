"use strict";

/* 
    ProxyServer

    NOTES:

    This is setup up for a simple proxy with a path and url sent in a url parameter.
    Use another class or subclass to handle more complex proxy request, such as passing 
    an XML/JSON body with auth and/or other info.

*/

(class ProxyServer extends BMSummaryNode {
  initPrototypeSlots() {
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

    {
      const slot = this.newSlot("error", "");
      slot.setShouldJsonArchive(true)
      slot.setInspectorPath("")
      slot.setLabel("Error")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }
  }

  init() {
    super.init();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setTitle("Unnamed Proxy Server");
    //this.setSubnodeClasses([ProxyRequest]);
    //this.setCanAdd(true);
  }

  finalInit() {
    super.finalInit()
    this.setCanDelete(true)
    this.setNoteIsSubnodeCount(false);
    this.setNodeCanReorderSubnodes(false);
    this.setNodeCanEditTitle(true);
    this.setSubtitle("");
  }

  protocolString () {
    return this.isSecure() ? "https" : "http";
  }

  // --- hostname ---

  hostname () {
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

  setHostname (hostname) {
      // Split the hostname by the dots
      const parts = hostname.split('.');
  
      if (parts.length < 2) {
          this.setDomain(hostname); // e.g. localhost
          return this;
      }
  
      // Extract the domain (last two parts)
      const domain = parts.slice(-2).join('.');
  
      // Extract the subdomain (everything except the last two parts)
      const subdomain = parts.slice(0, -2).join('.') || null;
  
      this.setDomain(domain);
      this.setSubdomain(subdomain);
      return this;
  }

  // -----------------------

  validationErrors () {
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

  subtitle () {
    return this.proxyUrlForUrl("targetUrl")
  }

  proxyUrlForUrl (targetUrl) {
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
      //console.log("ProxyServer proxyURL: '" + parameterValue + "'");
      url.searchParams.set(this.parameterName(), parameterValue);
      //url.searchParams.set(this.parameterName(), encodeURIComponent(parameterValue));
      resultUrl = url.toString();
    } catch (e) {
      this.setError(e.message);
      this.showError();
      return null;
    }

    this.setError("");
    return resultUrl;
  }

  showError () {
    console.warn(this.type() + " ERROR: " + this.error());
    return this;
  }

}.initThisClass());
