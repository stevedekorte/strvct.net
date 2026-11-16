/**
 * @module library.view.webbrowser
 */

"use strict";

/**
 * @class SvWebBrowserNotifications
 * @extends ProtoClass
 * @classdesc Simple interface to browser notifications. Takes care of:
 * - only checking for permissions once
 * - sending any waiting notifications after permission is gained
 * - notification timeouts
 *
 * Todo:
 * - support for multiple waiting notes? waiting note limit
 * - add any abstractions specific to special Chrome/Android notifications
 *
 * example use:
 *
 * SvWebBrowserNotifications.shared().newNote().setTitle("hello").setBody("...").tryToPost()
 */
(class SvWebBrowserNotifications extends ProtoClass {

    /**
     * @static
     * @description Initializes the class as a singleton
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initializes the prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        this.setIsDebugging(true);
    }

    // --- getting permission ---

    /**
     * @description Asks the browser for permission to send notifications. One
     * ask at a time; a later call asks again (the browser answers at once
     * when the user has already decided), so a dismissed prompt can be
     * offered again from a user gesture.
     * @returns {Promise<Boolean>} whether permission is granted; never rejects
     * @category Permissions
     */
    requestPermission () {
        return this.inFlightPromiseNamed("requestPermission", () => this.asyncJustRequestPermission());
    }

    async asyncJustRequestPermission () {
        if (!this.isSupported()) {
            console.warn(this.svType() + " sending browser notifications is not supported");
            return false;
        }
        try {
            const result = await Notification.requestPermission();
            this.logDebug("requestPermission:", result);
            return result === "granted";
        } catch (error) {
            console.warn(this.svType() + " requestPermission failed:", error);
            return false;
        }
    }

    /**
     * @description Whether the user has granted permission (no prompt).
     * @returns {Boolean}
     * @category Permissions
     */
    hasPermission () {
        return this.isSupported() && Notification.permission === "granted";
    }

    /**
     * @description The unprompted ask made when something first posts: once
     * a session. Asking on every post would nag, and browsers block a site
     * whose prompt is dismissed repeatedly. Permission granted later (through
     * requestPermission, from a user gesture) is seen by hasPermission().
     * @returns {Promise<Boolean>}
     * @category Permissions
     */
    asyncAskOnceToPost () {
        return this.sharedPromiseNamed("askToPost", () => this.requestPermission());
    }

    /**
     * @description Checks if browser notifications are supported
     * @returns {boolean} True if notifications are supported, false otherwise
     * @category Support
     */
    isSupported () {
        return Object.hasOwn(window, "Notification");
    }

    // --- posting ---

    /**
     * @description Posts a notification if permission is granted
     * @param {SvWebBrowserNotification} aNote - The notification to post
     * @category Notification
     */
    async postNote (aNote) {
        if (this.hasPermission() || await this.asyncAskOnceToPost()) {
            aNote.justPost();
        }
    }

    /**
     * @description Creates a new notification
     * @returns {SvWebBrowserNotification} A new SvWebBrowserNotification instance
     * @category Notification
     */
    newNote () {
        return SvWebBrowserNotification.clone();
    }

}.initThisClass());

//SvWebBrowserNotifications.shared();

//SvWebBrowserNotifications.shared().newNote().setTitle("hello").setBody("world!").tryToPost();
