/**
 * @class Worker
 * @extends Object
 * @classdesc A service worker abstract class.
 */

class SvServiceWorker extends Object {

    /**
     * @member {function}
     * @category Initialization
     */
    init () {
        this._isRegistered = false;
        this._registration = null;
    }

    static _shared = null;

    static shared () {
        const thisClass = SvServiceWorker;
        if (!thisClass._shared) {
            thisClass._shared = new thisClass();
            thisClass._shared.init();
        }
        return thisClass._shared;
    }

    static register () {
        const worker = thisClass.shared();
        worker.registerServiceWorker();
        return worker;
    }

    /**
     * @member {function}
     * @category Service Worker Registration
     */
    async registerServiceWorker () {
        if (!SvPlatform.isBrowserPlatform()) {
            return;
        }

        if (this._isRegistered) {
            return;
        }
        this._isRegistered = true;

        const path = "strvct/source/ServiceWorker/SvServiceWorkerCode.js"
        this.log("registering service worker '" + path + "'")
        const promise = navigator.serviceWorker.register(path); //{ scope: ""../"}

        try { 
            this._registration = await promise;
            this.onRegistered();
        } catch (error) {
            this.onError(error);
        }
    }

    /**
     * @member {function}
     * @category Service Worker Registration
     */
    onRegistered () {
        this.log("Service worker successfully registered on scope ", registration.scope);
    }

    /**
     * @member {function}
     * @category Error Handling
     */
    onError (error) {
        this.log("Service worker error:\n",
            "  typeof(error): ", typeof(error), "\n", 
            "  message:", error.message, "\n",
            "  fileName:", error.fileName, "\n",
            "  lineNumber:", error.lineNumber,  "\n",
            "  stack:", error.stack,  "\n"
            //"  JSON.stringify(error):", JSON.stringify(error),  "\n",
            //"  toString:", error.toString()
        );
    }
}

SvGlobals.set("SvServiceWorker", SvServiceWorker);