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
         * @category Content
         */
        {
            const slot = this.newSlot("title", "");
            slot.setSlotType("String");
        }

        /**
         * @member {String} body
         * @category Content
         */
        {
            const slot = this.newSlot("body", null);
            slot.setSlotType("String");
        }

        /**
         * @member {String} icon - a url to an image
         * @category Content
         */
        {
            const slot = this.newSlot("icon", null);
            slot.setComment("a url to an image");
            slot.setSlotType("String");
        }

        /**
         * @member {Array} actions
         * @category Interaction
         */
        {
            const slot = this.newSlot("actions", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {SvNotification} notificationRef
         * @category System
         */
        {
            const slot = this.newSlot("notificationRef", null);
            slot.setSlotType("SvNotification");
        }

        /**
         * @member {Error} error
         * @category Error Handling
         */
        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
        }

        /**
         * @member {String} choice - Event.action
         * @category Interaction
         */
        {
            const slot = this.newSlot("choice", null); // Event.action
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the WebBrowserNotification instance
     * @returns {WebBrowserNotification}
     * @category Initialization
     */
    init () {
        super.init();
        this.setActions([]);
        this.setIsDebugging(true);
        return this;
    }

    /**
     * @description Attempts to post the notification
     * @returns {WebBrowserNotification}
     * @category Notification Management
     */
    tryToPost () {
        WebBrowserNotifications.shared().postNote(this);
        return this;
    }

    /**
     * @description Posts the notification (private - only WebBrowserNotifications should call this)
     * @returns {WebBrowserNotification}
     * @private
     * @category Notification Management
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

        return this;
    }

    /**
     * @description Handler for the show event
     * @category Event Handling
     */
    onShow () {
        this.logDebug("onShow");
    }

    /**
     * @description Handler for the click event
     * @category Event Handling
     */
    onClick () {
        this.logDebug("onClick");
    }

    /**
     * @description Handler for the close event
     * @category Event Handling
     */
    onClose () {
        this.logDebug("onClose");
    }

    /**
     * @description Handler for the error event
     * @param {Error} error - The error object
     * @category Error Handling
     */
    onError (error) {
        this.logDebug("onError " + error);
        this.setError(error);
    }

    /**
     * @description Handler for the action event
     * @param {Event} event - The action event
     * @category Event Handling
     */
    onAction (event) {
        this.logDebug("onAction '" + event.action + "'");
        this.setChoice(event.action);
    }

}.initThisClass());
