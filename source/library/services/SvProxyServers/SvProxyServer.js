"use strict";

/**
 * @module library.services.SvProxyServers
 */

/**
 * @class SvProxyServer
 * @extends SvSummaryNode
 * @classdesc SvProxyServer
 *
 * NOTES:
 *
 * This is setup up for a simple proxy with a path and url sent in a url parameter.
 * Use another class or subclass to handle more complex proxy request, such as passing
 * an XML/JSON body with auth and/or other info.
 */
(class SvProxyServer extends SvSummaryNode {
    /**
   * @description Initializes the prototype slots for the SvProxyServer class.
   * @category Initialization
   */
    initPrototypeSlots () {

        /**
     * @member {boolean} isSecure - Indicates if the server is secure (https).
     * @category Configuration
     */
        {
            const slot = this.newSlot("isSecure", true);
            slot.setShouldJsonArchive(true);
            slot.setInspectorPath("");
            slot.setLabel("Secure");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Boolean");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
        }

        /**
     * @member {string} subdomain - The subdomain of the proxy server.
     * @category Configuration
     */
        {
            const slot = this.newSlot("subdomain", "");
            slot.setShouldJsonArchive(true);
            slot.setInspectorPath("");
            slot.setLabel("Sudomain");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
        }

        /**
     * @member {string} domain - The domain of the proxy server.
     * @category Configuration
     */
        {
            const slot = this.newSlot("domain", "");
            slot.setShouldJsonArchive(true);
            slot.setInspectorPath("");
            slot.setLabel("Domain");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
        }

        /**
     * @member {number} port - The port number of the proxy server.
     * @category Configuration
     */
        {
            const slot = this.newSlot("port", 0);
            slot.setAllowsNullValue(true); // null means with don't use the proxy
            slot.setShouldJsonArchive(true);
            slot.setInspectorPath("");
            slot.setLabel("Port");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
        }

        /**
     * @member {string} path - The path of the proxy server.
     * @category Configuration
     */
        {
            const slot = this.newSlot("path", "");
            slot.setShouldJsonArchive(true);
            slot.setInspectorPath("");
            slot.setLabel("Path");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
        }

        /**
     * @member {string|null} parameterName - The name of the parameter used in the proxy URL.
     * @category Configuration
     */
        {
            const slot = this.newSlot("parameterName", null);
            slot.setShouldJsonArchive(true);
            slot.setInspectorPath("");
            slot.setLabel("Parameter Name");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
        }

        /**
     * @member {string} error - The error message, if any.
     * @category Error Handling
     */
        {
            const slot = this.newSlot("error", "");
            slot.setShouldJsonArchive(true);
            slot.setInspectorPath("");
            slot.setLabel("Error");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // isDisabled slot which causes urls to not be generated
        {
            const slot = this.newSlot("isDisabled", false);
            slot.setShouldJsonArchive(true);
            slot.setInspectorPath("");
            slot.setLabel("Disabled");
            slot.setSlotType("Boolean");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(true);
        }

        /**
     * @member {Map} extraQueryParameters - Query parameters added to every
     * generated proxy URL alongside the target-url parameter. Runtime only:
     * never stored, never synced to a view, never sent in cloud json.
     *
     * This is how an app attaches request metadata that the PROXY SERVER
     * reads and the vendor must never see — attribution tags, for example.
     * The proxy strips them when it forwards the target url, so anything put
     * here stays between the client and our own server.
     * @category Configuration
     */
        {
            const slot = this.newSlot("extraQueryParameters", null);
            slot.setSlotType("Map");
            slot.setAllowsNullValue(true);
            slot.setShouldStoreSlot(false);
            slot.setShouldJsonArchive(false);
            slot.setSyncsToView(false);
            slot.setIsInCloudJson(false);
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
   * @description Initializes the instance.
   * @returns {SvProxyServer} The current instance for method chaining.
   * @category Initialization
   */
    init () {
        super.init();
        this.setExtraQueryParameters(new Map()); // per-instance, not the shared prototype value
        return this;
    }

    /**
   * @description Adds, replaces, or removes one extra query parameter that
   * every generated proxy URL will carry. A null or undefined value removes
   * the parameter rather than sending an empty one.
   * @param {string} name - The query parameter name.
   * @param {*} value - The value to send, or null to stop sending it.
   * @returns {SvProxyServer} The current instance for method chaining.
   * @category Configuration
   */
    setExtraQueryParameter (name, value) {
        assert(Type.isString(name) && name.length > 0, "name is required");
        const parameters = this.extraQueryParameters();
        if (Type.isNullOrUndefined(value)) {
            parameters.delete(name);
        } else {
            parameters.set(name, value);
        }
        return this;
    }

    /**
   * @description Returns the protocol string based on the isSecure property.
   * @returns {string} The protocol string ("https" or "http").
   * @category URL Generation
   */
    protocolString () {
        return this.isSecure() ? "https" : "http";
    }

    /**
   * @description Returns the full hostname of the proxy server.
   * @returns {string} The full hostname.
   * @category URL Generation
   */
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

    /**
   * @description Sets the hostname by splitting it into subdomain and domain.
   * @param {string} hostname - The full hostname to set.
   * @returns {SvProxyServer} The current instance for method chaining.
   * @category Configuration
   */
    setHostname (hostname) {
        assert(Type.isString(hostname) && hostname.length > 0, "hostname is required");

        const parts = hostname.split(".");

        if (parts.length < 2) {
            this.setDomain(hostname); // e.g. localhost
            return this;
        }

        const domain = parts.slice(-2).join(".");
        // a bare two-part domain (undreamedof.ai) has an EMPTY subdomain -
        // null tripped the String slot's type warning on every prod boot
        const subdomain = parts.slice(0, -2).join(".");

        this.setDomain(domain);
        this.setSubdomain(subdomain);
        return this;
    }

    /**
   * @description Validates the current state of the proxy server.
   * @returns {string[]} An array of validation error messages.
   * @category Validation
   */
    validationErrors () {
        const errors = [];

        if (!Type.isString(this.hostname())) {
            errors.push("hostname isn't a string");
        } else if (this.hostname().length === 0) {
            errors.push("hostname is empty");
        }

        if (!Type.isString(this.parameterName())) {
            errors.push("parameterName isn't a string");
        } else if (this.parameterName().length === 0) {
            errors.push("parameterName is empty");
        }

        return errors;
    }

    /**
   * @description Returns the subtitle for the proxy server.
   * @returns {string|null} The proxy URL for the "targetUrl" parameter.
   * @category UI
   */
    subtitle () {
        return this.proxyUrlForUrl("targetUrl");
    }

    /**
   * @description Generates a proxy URL for the given target URL.
   * @param {string} targetUrl - The target URL to be proxied.
   * @returns {string|null} The generated proxy URL or null if there's an error.
   * @category URL Generation
   */
    proxyUrlForUrl (targetUrl) {
        if (this.isDisabled()) {
            console.warn("SvProxyServer is disabled, returning targetUrl: ", targetUrl);
            return targetUrl;
        }

        assert(targetUrl);

        const errors = this.validationErrors();
        if (errors.length) {
            this.setError("ERROR: " + errors[0]);
            this.showError();
            return null;
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
            this.applyExtraQueryParameters(url);
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
   * @description Writes this server's extra query parameters onto a proxy
   * URL being built.
   * @param {URL} url - The proxy URL under construction.
   * @returns {SvProxyServer} The current instance for method chaining.
   * @category URL Generation
   */
    applyExtraQueryParameters (url) {
        this.extraQueryParameters().forEach((value, name) => {
            url.searchParams.set(name, String(value));
        });
        return this;
    }

    /**
   * @description Displays the current error message in the console.
   * @returns {SvProxyServer} The current instance for method chaining.
   * @category Error Handling
   */
    showError () {
        console.warn(this.svType() + " ERROR: " + this.error());
        return this;
    }

}.initThisClass());
