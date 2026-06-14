"use strict";

/**
    @class SvWebUserInterface
    @extends SvUserInterface
    @classdesc The SvWebUserInterface class is the user interface class for the web.

*/

(class SvWebUserInterface extends SvUserInterface {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("lifecycleWindowListener", null);
            slot.setSlotType("SvWindowListener");
        }
        {
            const slot = this.newSlot("lifecycleDocumentListener", null);
            slot.setSlotType("SvDocumentListener");
        }
    }

    init () {
        super.init();
        //SvWebDocument.shared().setTitle(this.app().name());
        return this;
    }

    async afterAppDidInit () {
        this.setupDocTheme();
        // Seed initial connectivity: the `offline` event only fires on a
        // transition, so a cold start while already offline would otherwise
        // look online. Done here (not setup) so consumers created during the
        // setup phase are already listening.
        if (typeof SvWebBrowserWindow !== "undefined" && !SvWebBrowserWindow.shared().isOnline()) {
            this.app().onAppDidGoOffline();
        }
        return this;
    }

    async setup () {
        this.setupLifecycleListeners();
        return this;
    }

    /**
     * @description A web UI navigates (it has a browser/stack view), so code
     * awaiting promiseUserInterfaceReady() should issue navigation.
     * @returns {Boolean}
     * @category Navigation
     */
    providesNavigation () {
        return true;
    }

    /**
     * @description Translates browser lifecycle/connectivity events into the
     * app's environment-agnostic lifecycle calls (SvApp.onApp*). This is the
     * browser environment layer — DOM events live here, never in the model.
     * Uses the strvct event system (SvWindowListener / SvDocumentListener) so
     * beforeunload is delivered SYNCHRONOUSLY to a delegate method, which can
     * return false to drive the framework's preventDefault().
     * @category Lifecycle
     */
    setupLifecycleListeners () {
        if (this.lifecycleWindowListener()) {
            return this;
        }
        // online / offline / beforeunload — window-targeted.
        this.setLifecycleWindowListener(SvWindowListener.clone().setDelegate(this).setIsListening(true));
        // visibilitychange — document-targeted.
        this.setLifecycleDocumentListener(SvDocumentListener.clone().setDelegate(this).setIsListening(true));
        return this;
    }

    /**
     * @description online event → app lifecycle.
     * @category Lifecycle
     */
    onBrowserOnline (/*event*/) {
        this.app().onAppDidGoOnline();
    }

    /**
     * @description offline event → app lifecycle.
     * @category Lifecycle
     */
    onBrowserOffline (/*event*/) {
        this.app().onAppDidGoOffline();
    }

    /**
     * @description visibilitychange → suspend when the tab is hidden.
     * @category Lifecycle
     */
    onDocumentVisibilityChange (/*event*/) {
        if (typeof document !== "undefined" && document.visibilityState === "hidden") {
            this.app().onAppWillSuspend();
        }
    }

    /**
     * @description beforeunload → terminate. Returning false makes the event
     * system call preventDefault(), which triggers the browser's
     * unsaved-changes prompt. Synchronous, so the app's cleanup runs in time.
     * @param {Event} event
     * @returns {Boolean} false to block unload (warn), true to allow.
     * @category Lifecycle
     */
    onDocumentBeforeUnload (event) {
        const block = this.app().onAppWillTerminate() === true;
        if (block && event) {
            event.returnValue = ""; // some browsers key the prompt off returnValue
        }
        return !block; // false → framework preventDefault()
    }

    /**
     * @description Presents a user-facing alert in a panel. Overrides the
     * base (which only logs). The presenting view reference (SvPanelView)
     * lives here in the UI layer, never in the model that posted the alert.
     * @param {Object} info - { name, title, message, level }. `name` is a
     * machine id (not shown); `level` is "info" | "warning" | "error".
     * @category User Alerts
     */
    presentUserAlert (info) {
        super.presentUserAlert(info); // log for the console record too
        const title = info.title || (info.level === "error" ? "Error" : "Notice");
        const message = info.message || "";
        const panel = SvPanelView.clone().setTitle(title);
        if (message.length > 0) {
            panel.setSubtitle(message);
        }
        panel.addOption("OK").asyncOpen().catch((e) => {
            console.warn("SvWebUserInterface.presentUserAlert: panel error:", e && e.message);
        });
        return this;
    }


    /**
     * @description Sets up the document theme
     * @category UI
     */
    setupDocTheme () {
        const doc = SvDocumentBody.shared();
        doc.setColor("#f4f4ec");
        doc.setBackgroundColor("rgb(25, 25, 25)");
        this.setupNormalDocTheme();
    }

    /**
     * @description Sets up the normal document theme
     * @category UI
     */
    setupNormalDocTheme () {
        const doc = SvDocumentBody.shared();
        doc.setBackgroundColor("#191919");
        doc.setFontFamily("HoeflerTitling");

        //doc.setFontFamily("EB Garamond");
        //doc.setFontFamily("IMFellEnglish");
        //doc.setFontFamily("Lusitana");
        //doc.setFontFamily("BarlowCondensed");
        //doc.setFontWeight("medium");

        //doc.setFontSize("18px");
        //doc.setLineHeight(1.3);
    }

}.initThisClass());
