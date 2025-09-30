"use strict";

/**
* @module framework
* @class StrvctFramework
* @description Main entry point for the STRVCT framework when used as an npm module
* Allows consumers to import/require the framework through a single entry point
*/

class StrvctFramework {
    /**
    * @constructor
    * @description Initializes a new StrvctFramework instance
    * @param {Object} [options={}] - Configuration options for the framework
    * @param {string} [options.rootPath='strvct'] - Path to the strvct directory
    * @param {boolean} [options.autoInitialize=true] - Whether to automatically initialize the framework
    */
    constructor (options = {}) {
        this._options = Object.assign({
            rootPath: "strvct",
            autoInitialize: true
        }, options);

        this._isInitialized = false;

        if (this._options.autoInitialize) {
            this.initialize();
        }
    }

    /**
    * @method initialize
    * @description Initializes the framework, loading core files and resources
    * @returns {Promise<StrvctFramework>} A promise that resolves with the framework instance
    */
    async initialize () {
        if (SvPlatform.isNodePlatform()) {
            require("./strvct/source/boot/SvBootLoader.js");
            this._isInitialized = true;
            return this;
        }
    }

    /**
    * @method isInitialized
    * @description Returns whether the framework has been initialized
    * @returns {boolean} True if the framework is initialized, false otherwise
    */
    isInitialized () {
        return this._isInitialized;
    }

    /**
    * @method resourceManager
    * @description Returns the SvResourceManager instance
    * @returns {SvResourceManager|null} The SvResourceManager instance, or null if not initialized
    */
    resourceManager () {
        return this._resourceManager;
    }
}

// Handle both CommonJS and ES module exports
if (typeof module !== "undefined" && module.exports) {
    module.exports = StrvctFramework;
} else if (typeof define === "function" && define.amd) {
    define([], function () { return StrvctFramework; });
} else {
    window.StrvctFramework = StrvctFramework;
}
