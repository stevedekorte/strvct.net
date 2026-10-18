"use strict";

/**
 * @module library.node.app.notices
 */

/**
 * @class SvNoticeAction
 * @extends ProtoClass
 * @classdesc One button on a notice: a label, and the method it calls on its
 * target when pressed ("Refresh" → releaseChecker.reloadApp()). The view
 * calls perform(); the model decides what happens.
 */
(class SvNoticeAction extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("label", "");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("target", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("methodName", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("closesNotice", true); // pressing it also takes the notice away
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description An action with a label that calls target[methodName]().
     * @param {String} label
     * @param {Object} target
     * @param {String} methodName
     * @returns {SvNoticeAction}
     * @category Construction
     */
    static labelTargetMethod (label, target, methodName) {
        return this.clone().setLabel(label).setTarget(target).setMethodName(methodName);
    }

    /**
     * @description Pressed: calls the method, then closes the notice unless told not to.
     * @param {SvNotice} notice
     * @category Action
     */
    performFor (notice) {
        const target = this.target();
        const name = this.methodName();
        if (target && name && typeof target[name] === "function") {
            target[name](notice);
        }
        if (this.closesNotice()) {
            notice.close();
        }
    }

}.initThisClass());
