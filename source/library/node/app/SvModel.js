"use strict";

/**
    @class SvModel
    @extends SvStorableNode
    @classdesc The SvModel class is the main model class of the SvApp.

*/

(class SvModel extends SvStorableNode {

    initPrototypeSlots () {
        {
            /**
             * @member {SvCoachMarkManager} coachMarkManager - Manager for coach marks
             * @category UI
             */
            const slot = this.newSlot("coachMarkManager", null);
            slot.setSlotType("SvCoachMarkManager");
            slot.setFinalInitProto(SvCoachMarkManager);
            slot.setShouldStoreSlot(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanReorderSubnodes(false);
    }

    finalInit () {
        super.finalInit();
        // (the model used to render as an SvBreadCrumbsTile inside the synthetic
        // breadcrumb wrapper; the breadcrumb bar is now a view owned by SvBrowserView)
    }

    async afterAppDidInit () {
        return this;
    }

    async setup () {
        return this;
    }

    // --- app lifecycle hooks ---
    //
    // Environment-agnostic lifecycle events, routed here by SvApp (which the
    // environment layer calls — browser DOM events via SvWebUserInterface, or
    // process signals in a headless host). The model reacts without touching
    // the DOM, window, or any view class, so the same overrides work headless.
    // Defaults are no-ops; subclasses override.

    /**
     * @description Connectivity restored.
     * @category Lifecycle
     */
    onAppDidGoOnline () {
        return this;
    }

    /**
     * @description Connectivity lost.
     * @category Lifecycle
     */
    onAppDidGoOffline () {
        return this;
    }

    /**
     * @description The app is being backgrounded (browser tab hidden, or a
     * headless suspend). A cue to flush volatile state.
     * @category Lifecycle
     */
    onAppWillSuspend () {
        return this;
    }

    /**
     * @description The app is about to terminate (browser unload, or a
     * headless shutdown signal). Do synchronous cleanup here.
     * @returns {Boolean} true to request that termination be blocked (e.g.
     * the browser's unsaved-changes prompt); false to allow it. Default false.
     * @category Lifecycle
     */
    onAppWillTerminate () {
        return false;
    }

}.initThisClass());
