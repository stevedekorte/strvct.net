class Worker {

    /**
     * @member {function}
     * @category Initialization
     */
    init () {

    }

    /**
     * @member {function}
     * @category Service Worker Registration
     */
    async registerServiceWorker () {
        // doesn't work
        // "/source/ServiceWorker.js"
        // "../ServiceWorker.js"
        const path = "sj.js"
        console.log("registering service worker '" + path + "'")
        const promise = navigator.serviceWorker.register(path); //{ scope: ""../"}

        try { 
            await promise;
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