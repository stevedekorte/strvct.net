/**
 * @module library.view.webbrowser
 */

"use strict";

/**
 * @class WebBrowserNotifications
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
 * WebBrowserNotifications.shared().newNote().setTitle("hello").setBody("...").tryToPost()
 */
(class WebBrowserNotifications extends ProtoClass {
    
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
        /**
         * @member {Promise} permissionPromise
         * @category State
         */
        {
            const slot = this.newSlot("permissionPromise", null);
            slot.setSlotType("Promise");
        }
        this.setIsDebugging(true);
    }

    // --- getting permission ---

    /**
     * @description Requests permission for sending notifications
     * @returns {Promise} A promise that resolves to a boolean indicating whether permission was granted
     * @category Permissions
     */
    async requestPermission () {
        if (!this.permissionPromise()) {
            const promise = Promise.clone();
            this.setPermissionPromise(promise);
            
            if (!this.isSupported()) {
                const msg = this.svType() + " sending browser notifications is not supported";
                console.warn(msg);
                promise.callResolveFunc(false);
            } else {
                const result = await Notification.requestPermission();
                this.logDebug("requestPermission:", result);
                const gotPermission = result === "granted";
                if (!gotPermission) {
                    console.warn(this.svType() + " permission denied");
                }
                promise.callResolveFunc(gotPermission);
            }
        }
        return this.permissionPromise();
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
     * @param {WebBrowserNotification} aNote - The notification to post
     * @category Notification
     */
    async postNote (aNote) {
        if (await this.requestPermission()) {
            aNote.justPost();
        }
    }

    /**
     * @description Creates a new notification
     * @returns {WebBrowserNotification} A new WebBrowserNotification instance
     * @category Notification
     */
    newNote () {
        return WebBrowserNotification.clone();
    }
    
}.initThisClass());

//WebBrowserNotifications.shared();

//WebBrowserNotifications.shared().newNote().setTitle("hello").setBody("world!").tryToPost();