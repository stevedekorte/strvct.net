"use strict";

/**
    @class SvUserInterface
    @extends SvStorableNode
    @classdesc The SvUserInterface class is the main user interface class of the SvApp.

*/

(class SvUserInterface extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("app", null);
            slot.setSlotType("SvApp");
        }
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanReorderSubnodes(false);
    }

    init () {
        super.init();
        // General "show this to the user" channel. Any model can post
        // onRequestUserAlert(info) to surface a message without referencing
        // views, the DOM, or the concept of a user — it just announces that
        // the message should be shown to a user if one is present. The UI
        // layer (this object) presents it; the headless UI logs it, keeping
        // models headless-testable.
        this.watchForNote("onRequestUserAlert");
        // Permission requests are note-posted (not called) so models never
        // reference the UI; notification dispatch is synchronous, so a
        // user-gesture context survives to the browser permission prompt.
        this.watchForNote("onRequestUserNotificationsPermission");
        return this;
    }

    /**
     * @description Handles the onRequestUserAlert notification posted by a
     * model. Delegates to presentUserAlert, which subclasses implement per
     * environment (a panel in the browser, a log line in headless mode).
     * @param {SvNotification} aNote - info: { name, title, message, level }.
     * @category User Alerts
     */
    onRequestUserAlert (aNote) {
        this.presentUserAlert(aNote.info() || {});
        return this;
    }

    /**
     * @description Presents a user-facing alert. Base/headless implementation
     * logs it; the browser UI (SvWebUserInterface) overrides to open a panel.
     * @param {Object} info - { name, title, message, level }. `name` is a
     * machine id for logging (not shown); `level` is "info" | "warning" |
     * "error".
     * @category User Alerts
     */
    presentUserAlert (info) {
        const level = info.level || "info";
        const parts = [];
        if (info.name) { parts.push(info.name); }
        if (info.title) { parts.push(info.title); }
        if (info.message) { parts.push(info.message); }
        console.log("[UserAlert:" + level + "] " + parts.join(" — "));
        return this;
    }

    // --- user attention / notifications (platform capabilities) ---
    // Base implementations are headless-safe no-ops/logs, same pattern as
    // presentUserAlert: models announce facts; only UI subclasses that have
    // a real surface render them.

    /**
     * @description Renders "n things need the user's attention" on whatever
     * badge surfaces the platform offers (OS app badge, favicon, tab title).
     * Base: no-op.
     * @param {number} n - 0 clears.
     * @category User Attention
     */
    setAttentionCount (/*n*/) {
        return this;
    }

    /**
     * @description Shows a system notification if the platform supports it
     * and the user has granted permission. Base: logs.
     * @param {Object} info - { title, body, tag, onlyWhenHidden } —
     * onlyWhenHidden defaults true (don't toast a tab the user is watching).
     * @category User Attention
     */
    postUserNotification (info) {
        console.log("[UserNotification] " + [info.title, info.body].filter(s => s).join(" — "));
        return this;
    }

    /**
     * @description Closes the notifications showing under a tag. Base: none
     * are shown, so nothing to close.
     * @param {String} tag
     * @returns {SvUserInterface}
     * @category User Attention
     */
    closeUserNotifications (/*tag*/) {
        return this;
    }

    /**
     * @description Current notification permission: "granted" | "denied" |
     * "default" | "unsupported".
     * @returns {string}
     * @category User Attention
     */
    userNotificationsPermission () {
        return "unsupported";
    }

    /**
     * @description Handles the onRequestUserNotificationsPermission note.
     * Base: nothing to request.
     * @category User Attention
     */
    onRequestUserNotificationsPermission (/*aNote*/) {
        return this;
    }

    /**
     * @description Whether this UI can fulfill navigation requests. False here
     * (the base / headless case); a navigable UI like SvWebUserInterface
     * overrides to true. Lets code awaiting promiseUserInterfaceReady() know
     * whether to issue navigation.
     * @returns {Boolean}
     * @category Navigation
     */
    /**
     * @description Wears a theme's tokens: publishes them where every view and
     * every piece of model-authored markup inherits them (Plans/Theme
     * Environment Stage 3). Nothing to publish onto without a document.
     * @param {Object} tokenDict - { "--sv-text": "#111", … }
     * @param {String} colorScheme - "light" or "dark"
     * @returns {SvUserInterface}
     * @category Theme
     */
    publishThemeTokens (/*tokenDict, colorScheme*/) {
        return this;
    }

    providesNavigation () {
        return false;
    }

    // --- installed app, device, push (platform capabilities; base: headless) ---

    /**
     * @description Whether the app runs installed (from a home screen or dock) rather than in a browser tab.
     * @returns {Boolean}
     * @category Installed App
     */
    isInstalledApp () {
        return false;
    }

    /**
     * @description Whether the platform offers its own install prompt now (promptInstall would show it).
     * @returns {Boolean}
     * @category Installed App
     */
    canPromptInstall () {
        return false;
    }

    /**
     * @description Shows the platform's install prompt. Resolves true when the user installs.
     * @returns {Promise<Boolean>}
     * @category Installed App
     */
    async promptInstall () {
        return false;
    }

    /**
     * @description A name for the platform and browser, for choosing install
     * steps: "ios-safari", "ios-other" (Chrome, Edge or Firefox on iOS),
     * "android", "desktop-chromium", "mac-safari", "firefox", "other" or
     * "headless".
     * @returns {String}
     * @category Installed App
     */
    platformName () {
        return "headless";
    }

    /**
     * @description A small value kept on this device only (a dismissed
     * prompt, the last release seen) — never synced. Base: for this run.
     * @param {String} key
     * @returns {*} the value, or null
     * @category Device Values
     */
    deviceValue (key) {
        return this.deviceValues().has(key) ? this.deviceValues().get(key) : null;
    }

    setDeviceValue (key, value) {
        this.deviceValues().set(key, value);
        return this;
    }

    deviceValues () {
        if (!this._deviceValues) {
            this._deviceValues = new Map();
        }
        return this._deviceValues;
    }

    /**
     * @description Restarts the app on its current release (a page reload in a browser). Base: nothing to reload.
     * @category Lifecycle
     */
    reloadApp () {
        console.log("[" + this.svType() + "] reloadApp: nothing to reload");
        return this;
    }

    /**
     * @description Copies text for the user to paste elsewhere. Resolves true on success.
     * @param {String} text
     * @returns {Promise<Boolean>}
     * @category Clipboard
     */
    async asyncCopyText (/*text*/) {
        return false;
    }

    /**
     * @description This device's push subscription for the app's push key,
     * created when needed (permission must already be granted), as JSON
     * ({ endpoint, keys }); null where push is unavailable.
     * @param {String} vapidPublicKey - the server's public key, base64url
     * @returns {Promise<Object|null>}
     * @category Push
     */
    async asyncPushSubscriptionJson (/*vapidPublicKey*/) {
        return null;
    }

    assertCanRun () {
        // override in subclasses with any checks that need to be done before running
        return true;
    }

    async afterAppDidInit () {
        return this;
    }

    async setup () {
        return this;
    }


}.initThisClass());
