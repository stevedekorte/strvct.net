"use strict";

/**
 * @class SvPlatform
 * @extends Object
 * @classdesc Handles platform detection and environment setup for both browser and Node.js environments.
 * Provides unified interface for environment-specific operations and polyfills.
 */

class SvPlatform extends Object {

    /**
     * @static
     * @description Detects if running in Node.js platform
     * @returns {boolean} True if running in Node.js
     * @category Environment Detection
     */
    static isNodePlatform () {
        return (typeof process !== 'undefined' && 
                process.versions && 
                process.versions.node);
    }

    /**
     * @static
     * @description Detects if running in browser platform
     * @returns {boolean} True if running in browser
     * @category Environment Detection
     */
    static isBrowserPlatform () {
        return (typeof window !== 'undefined' && 
                typeof document !== 'undefined');
    }

    /**
     * @static
     * @private
     * @type {boolean}
     * @description Flag to track if environment has been set up
     */
    static _didSetupEnvironment = false;

    static async asyncSetup () {
        if (this.isNodePlatform()) {
            await this.asyncSetupForNode();
        } else {
            await this.asyncSetupForBrowser();
        }
    }

    static async asyncSetupForBrowser () {
       // console.log("SvPlatform asyncSetupForBrowser");
    }

    static async asyncSetupForNode () {
        //console.log("SvPlatform asyncSetupForNode");
        this.setupPerformance();
        await this.asyncSetupNodeIndexedDB();
    }

    static async asyncSetupNodeIndexedDB () {
        //console.log('Initializing IndexedDB for Node.js...');
        
        // Load and initialize the database cache FIRST
        const dbManager = require('node-indexeddb/dbManager');
        await dbManager.loadCache();

        const { indexedDB, IDBKeyRange } = require('node-indexeddb');                
        SvGlobals.set("indexedDB", indexedDB);
        SvGlobals.set("IDBKeyRange", IDBKeyRange);

        //console.log('IndexedDB and IDBKeyRange are now available');
    }

    static setupPerformance () {
        // Setup basic performance API if not available
        if (!SvGlobals.has("performance")) {
            SvGlobals.set("performance", {
                now: () => Date.now(),
                timing: {
                    navigationStart: Date.now()
                }
            });
        }
    }
}

SvGlobals.set("SvPlatform", SvPlatform);

//await SvPlatform.asyncSetup();
