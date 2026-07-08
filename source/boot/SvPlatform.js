"use strict";

/**
 * @class SvPlatform
 * @extends Object
 * @classdesc Handles platform detection and environment setup for both browser and Node.js environments.
 * Provides unified interface for environment-specific operations and polyfills.
 */


/*
console.log("console.log test");
console.error("console.error test");
console.warn("console.warn test");
console.info("console.info test");
console.debug("console.debug test");
*/

// SvPlatform.getWindowLocationURL().explicitOrigin()

URL.prototype.explicitOrigin = function () {
    const scheme = this.protocol.slice(0, -1);            // drop trailing “:”
    const host   = this.hostname;
    const port   = this.port || (
        scheme === "https" ? "443" :
            scheme === "http"  ? "80"  :
                ""
    );
    return `${scheme}://${host}${port ? ":" + port : ""}`;
};

class SvPlatform extends Object {

    static _isNodePlatform = null;

    /**
   * @static
   * @description Detects if running in Node.js platform
   * @returns {boolean} True if running in Node.js
   * @category Environment Detection
   */
    static isNodePlatform () {
        if (this._isNodePlatform === null) {
            // we'll assume no polyfills at this point, so this should be a valid test
            this._isNodePlatform = (typeof process !== "undefined" &&
                  process.versions &&
                  process.versions.node);
        }
        return this._isNodePlatform;
    }

    /**
   * @static
   * @description Detects if running in browser platform
   * @returns {boolean} True if running in browser
   * @category Environment Detection
   */
    static isBrowserPlatform () {
        return !this.isNodePlatform();
        /*
      // we might have polyfills
      return (typeof window !== 'undefined' &&
              typeof document !== 'undefined');
      */
    }

    /**
   * @static
   * @private
   * @type {boolean}
   * @description Flag to track if environment has been set up
   */
    static _didSetupEnvironment = false;

    static _promiseReady = null;

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
        this.setupNodeTLS();
        // DISABLED: We use our own LevelDB implementation
        // await this.asyncSetupNodeIndexedDB();
    }

    /**
   * @static
   * @description Sets up TLS configuration for Node.js development environment
   * @category Node.js Setup
   */
    static setupNodeTLS () {
        // Allow self-signed certificates for local development
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    }

    // DISABLED: We use our own LevelDB implementation via SvIndexedDbFolder
    // The node-indexeddb-lmdb polyfill is not needed and can conflict
    /*
  static async asyncSetupNodeIndexedDB () {
      //console.log('Initializing IndexedDB for Node.js...');

      // Load and initialize the database cache FIRST
      const dbManager = require('node-indexeddb-lmdb/dbManager');
      await dbManager.loadCache();

      const { indexedDB, IDBKeyRange } = require('node-indexeddb-lmdb');
      SvGlobals.set("indexedDB", indexedDB);
      SvGlobals.set("IDBKeyRange", IDBKeyRange);

      //console.log('IndexedDB and IDBKeyRange are now available');
  }
  */

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

    static getWindowLocationURL () {
        if (SvPlatform.isNodePlatform()) {
            return new URL("file://" + this.getWorkingDirectory() + "/index.js");
        }
        return new URL(window.location.href);
    }

    // --- ready ---

    static async promiseReady () {
        if (this._promiseReady === null) {
            if (SvPlatform.isNodePlatform()) {
                this._promiseReady = this.promiseReadyOnNode();
            } else {
                this._promiseReady = this.promiseReadyInBrowser();
            }
        }
        return this._promiseReady;
    }

    static async promiseReadyOnNode () {
    //console.log("promiseReadyOnNode: starting SvBootLoader on Node");
    // In Node.js, we can start immediately since the process is already ready
    // Wait for next tick to ensure all modules are loaded
        await new Promise(resolve => {
            process.nextTick(() => {
                resolve();
            });
        });
    }

    static async promiseReadyInBrowser () {
        // Boot needs the parsed DOM (document.body for the loading view), not
        // the window "load" event — waiting for "load" serialized boot behind
        // every stylesheet, font, and synchronous script on the host page.
        // readyState is "interactive" once parsing completes, which is when
        // the (deferred) boot module scripts run — so this usually resolves
        // immediately.
        await new Promise(resolve => {
            if (document.readyState !== "loading") {
                resolve();
            } else {
                document.addEventListener("DOMContentLoaded", () => {
                    resolve();
                }, { once: true });
            }
        });
    }

    static async asyncWaitForNextRender () {
        if (SvPlatform.isNodePlatform()) {
            return;
        }
        // Double rAF resolves after the next paint — but rAF never fires
        // when the page can't paint: headless browsers, and hidden /
        // backgrounded tabs (Chrome suspends rAF entirely while
        // document.hidden). App boot awaits this, so without a fallback
        // the app hangs forever when opened in a background tab. Race a
        // timeout: painting pages resolve via rAF within ~2 frames; the
        // timeout only wins when no paint is coming.
        return new Promise(resolve => {
            let done = false;
            const finish = () => {
                if (!done) {
                    done = true;
                    resolve();
                }
            };
            requestAnimationFrame(() => {
                requestAnimationFrame(finish); // Resolves after the paint
            });
            setTimeout(finish, document.hidden ? 50 : 500);
        });
    }

    static isOnline () {
        if (this.isBrowserPlatform()) {
            return navigator.onLine;
        }
        // assume online for non-browser platforms?
        return true;
    }
}

SvGlobals.set("SvPlatform", SvPlatform);
//await SvPlatform.asyncSetup();

