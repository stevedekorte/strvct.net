/**
 * @module library.view.webbrowser
 */

/**
 * @class WebBrowserNotification
 * @extends ProtoClass
 * @classdesc WebBrowserNotification
 * 
 * Don't instantiate these directly. 
 * See WebBrowserNotifications example code.
 * 
 * Example actions:
 * 
 * [{action: 'reply', title: 'Reply'}, ...]
 */
"use strict";

(class WebBrowserNotification extends ProtoClass {
    
    initPrototypeSlots () {
        /**
         * @member {String} title
         */
        {
            const slot = this.newSlot("title", "");
            slot.setSlotType("String");
        }

        /**
         * @member {String} body
         */
        {
            const slot = this.newSlot("body", null);
            slot.setSlotType("String");
        }

        /**
         * @member {String} icon - a url to an image
         */
        {
            const slot = this.newSlot("icon", null);
            slot.setComment("a url to an image");
            slot.setSlotType("String");
        }

        /**
         * @member {Array} actions
         */
        {
            const slot = this.newSlot("actions", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {BMNotification} notificationRef
         */
        {
            const slot = this.newSlot("notificationRef", null);
            slot.setSlotType("BMNotification");
        }

        /**
         * @member {Error} error
         */
        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
        }

        /**
         * @member {String} choice - Event.action
         */
        {
            const slot = this.newSlot("choice", null); // Event.action
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the WebBrowserNotification instance
     * @returns {WebBrowserNotification}
     */
    init () {
        super.init();
        this.setActions([]);
        this.setIsDebugging(true);
        return this
    }

    /**
     * @description Attempts to post the notification
     * @returns {WebBrowserNotification}
     */
    tryToPost () {
        WebBrowserNotifications.shared().postNote(this);
        return this;
    }

    /**
     * @description Posts the notification (private - only WebBrowserNotifications should call this)
     * @returns {WebBrowserNotification}
     * @private
     */
    justPost () {
        const ref = new Notification(this.title(), { 
            body: this.body(), 
            icon: this.icon(),
            actions: this.actions()
        });

        ref.onshow = () => { this.onShow(); };
        ref.onclick = () => { this.onClick(); };
        ref.onclose = () => { this.onClose(); };
        ref.onerror = (error) => { this.onError(error); };
        ref.onaction = (event) => { this.onAction(event); };
        
        this.setNotificationRef(ref);
        //debugger;
        return this
    }

    /**
     * @description Handler for the show event
     */
    onShow () {
        this.debugLog("onShow");
    }

    /**
     * @description Handler for the click event
     */
    onClick () {
        this.debugLog("onClick");
    }

    /**
     * @description Handler for the close event
     */
    onClose () {
        this.debugLog("onClose");
    }

    /**
     * @description Handler for the error event
     * @param {Error} error - The error object
     */
    onError (error) {
        this.debugLog("onError " + error);
        this.setError(error);
    }

    /**
     * @description Handler for the action event
     * @param {Event} event - The action event
     */
    onAction (event) {
        this.debugLog("onAction '" + event.action + "'");
        this.setChoice(event.action);
    }

}.initThisClass());