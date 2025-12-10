"use strict";

/**
 * @module library.services.ProxyServers
 */

/**
 * @class DefaultProxyServer
 * @extends ProxyServer
 * @classdesc ProxyServer implementation for default proxy settings.
 *
 *
 */
(class DefaultProxyServer extends ProxyServer {

    /**
   * @description Initializes prototype slots for the class.
   * @category Initialization
   */
    initPrototypeSlots () {
    }

    /**
   * @description Initializes the instance.
   * @category Initialization
   */
    init () {
        super.init();
    }

    /**
   * @description Performs final initialization steps.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.setTitle("Default Proxy Server");
        this.setParameterName("proxyUrl");
        this.setupForPage();
    }

    /**
   * @description Sets up the proxy server based on the current page's location.
   * @category Configuration
   */
    setupForPage () {
        if (SvPlatform.isNodePlatform()) {
            return;
        }

        // default to the window location
        this.setupForConfigDict(this.configDictForWindowLocation());

        // SvApp subclass might want to set this in it's init() method
        // Example: ProxyServers.shared().defaultServer().setupForConfigDict(appProxyConfigDict);
    }

    configDictForWindowLocation () {
        return {
            isSecure: window.location.protocol === "https:",
            hostname: window.location.hostname,
            port: Number(window.location.port) || null,
            path: "/proxy",
            parameterName: "proxyUrl"
        };
    }

    setupForConfigDict (dict) {
        this.setIsSecure(typeof dict.isSecure === "boolean" ? dict.isSecure : true);

        if (Type.isString(dict.hostname) && dict.hostname.length > 0) {
            this.setHostname(dict.hostname); // this will set the domain and subdomain
        } else {
            this.setDomain(dict.domain ? dict.domain : "");
            this.setSubdomain(dict.subdomain ? dict.subdomain : "");
        }

        this.setPort(dict.port ? dict.port : 0);
        this.setPath(dict.path ? dict.path : "");
        this.setParameterName(dict.parameterName ? dict.parameterName : "");
        return this;
    }

}.initThisClass());
