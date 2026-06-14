"use strict";

/**
    @class SvHeadlessUserInterface
    @extends SvUserInterface
    @classdesc The SvHeadlessUserInterface class is the user interface class for the headless mode.

*/

(class SvHeadlessUserInterface extends SvUserInterface {


    init () {
        super.init();
        //SvWebDocument.shared().setTitle(this.app().name());
        return this;
    }

    async afterAppDidInit () {
        return this;
    }

    async setup () {
        this.setupLifecycleSignals();
        return this;
    }

    /**
     * @description Headless analogue of the browser lifecycle listeners:
     * translates process termination signals into the app's environment-
     * agnostic lifecycle call (SvApp.onAppWillTerminate), so a model's cleanup
     * runs on shutdown the same way it would on a browser unload. Foundation —
     * extend with suspend/connectivity signals as needed.
     * @category Lifecycle
     */
    setupLifecycleSignals () {
        if (this._lifecycleSignalsSetup || typeof process === "undefined" || !process.on) {
            return this;
        }
        this._lifecycleSignalsSetup = true;
        ["SIGTERM", "SIGINT"].forEach((sig) => {
            process.on(sig, () => {
                this.app().onAppWillTerminate();
                process.exit(0);
            });
        });
        return this;
    }

}.initThisClass());
