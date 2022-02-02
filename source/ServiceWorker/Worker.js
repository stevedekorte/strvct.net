
class Worker {

    init () {

    }

    registerServiceWorker () {
        // doesn't work
        // "/source/ServiceWorker.js"
        // "../ServiceWorker.js"
        const path = "sj.js"
        console.log("registering service worker '" + path + "'")
        const promise = navigator.serviceWorker.register(path); //{ scope: ""../"}

        promise.then(function (registration) {
            console.log("Service worker successfully registered on scope", registration.scope);
        }).catch(function (error) {
            console.log("Service worker failed to register:\n",
                "  typeof(error): ", typeof(error), "\n", 
                "  message:", error.message, "\n",
                "  fileName:", error.fileName, "\n",
                "  lineNumber:", error.lineNumber,  "\n",
                "  stack:", error.stack,  "\n"
                //"  JSON.stringify(error):", JSON.stringify(error),  "\n",
                //"  toString:", error.toString()
            );
        });
    }
}
