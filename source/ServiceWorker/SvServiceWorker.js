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
        if (!Worker._shared) {
            Worker._shared = new Worker();
            Worker._shared.init();
        }
        return Worker._shared;
    }

    static register () {
        const worker = Worker.shared();
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
        console.log("registering service worker '" + path + "'")
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
        console.log("Service worker successfully registered on scope ", registration.scope);
    }

    /**
     * @member {function}
     * @category Error Handling
     */
    onError (error) {
        console.log("Service worker error:\n",
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

SvGlobals.set("Worker", Worker);