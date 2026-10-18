"use strict";

/**
 * @module library.node.app.notices
 */

/**
 * @class SvNotice
 * @extends ProtoClass
 * @classdesc A short message for the user, with a few buttons: "A new version
 * is ready — Refresh", "Get a nudge when it's your turn — Enable / Not now".
 * Model code shows one with SvApp.shared().notices().show(notice) and never
 * touches the UI; the web UI renders the current notice as a bar
 * (SvNoticeBarView), a headless UI ignores them. One notice per id: showing
 * a notice replaces any other with the same id.
 */
(class SvNotice extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("noticeId", "");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("message", "");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("actions", null); // Array<SvNoticeAction>
            slot.setSlotType("Array");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("isDismissible", true); // shows a close button
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("dismissAction", null); // called when closed by the close button
            slot.setSlotType("SvNoticeAction");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("notices", null); // the list showing it
            slot.setSlotType("SvNotices");
            slot.setAllowsNullValue(true);
        }
    }

    init () {
        super.init();
        this.setActions([]);
        return this;
    }

    /**
     * @description A notice with an id and a message.
     * @param {String} noticeId
     * @param {String} message
     * @returns {SvNotice}
     * @category Construction
     */
    static idMessage (noticeId, message) {
        return this.clone().setNoticeId(noticeId).setMessage(message);
    }

    /**
     * @description Adds a button.
     * @param {String} label
     * @param {Object} target
     * @param {String} methodName - called on target with this notice
     * @returns {SvNotice}
     * @category Construction
     */
    addAction (label, target, methodName) {
        this.actions().push(SvNoticeAction.labelTargetMethod(label, target, methodName));
        return this;
    }

    /**
     * @description The close button was pressed.
     * @category Action
     */
    dismiss () {
        const action = this.dismissAction();
        if (action) {
            action.performFor(this);
        }
        this.close();
    }

    /**
     * @description Takes the notice away.
     * @category Action
     */
    close () {
        if (this.notices()) {
            this.notices().removeNotice(this);
        }
    }

}.initThisClass());
