"use strict";

/**
 * @module library.view.dom.DomView
 */

/**
 * @class ControlDomView
 * @extends ResponderDomView
 * @classdesc ControlDomView handles target / action state and behavior.
 */
(class ControlDomView extends ResponderDomView {
    
    initPrototypeSlots () {
        // Targetable - target / action
        /**
         * @member {Object|null} target
         */
        {
            const slot = this.newSlot("target", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }
        /**
         * @member {string|null} action
         */
        {
            const slot = this.newSlot("action", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
    }

    /*
    init () {
        super.init()
        return this
    }
    */

    // --- target/action ---

    /**
     * @description Checks if both target and action are set
     * @returns {boolean}
     */
    hasTargetAndAction () {
        return (this.target() !== null) && (this.action() !== null)
    }

    /**
     * @description Sets the target and updates click registration
     * @param {Object} anObject - The target object
     * @returns {ControlDomView}
     */
    setTarget (anObject) {
        this._target = anObject
        this.setIsRegisteredForClicks(this.hasTargetAndAction())
        return this
    }

    /**
     * @description Sets the action and updates click registration
     * @param {string} anActionString - The action string
     * @returns {ControlDomView}
     */
    setAction (anActionString) {
        this._action = anActionString
        this.setIsRegisteredForClicks(this.hasTargetAndAction())
        return this
    }

    // ---

    /**
     * @description Handles click event
     * @param {Event} event - The click event
     * @returns {boolean}
     */
    onClick (event) {
        debugger;
        this.debugLog(".onClick()")
        this.sendActionToTarget()
        event.stopPropagation()
        return false
    }

    /**
     * @description Handles tap complete gesture
     * @param {Object} aGesture - The tap gesture object
     * @returns {ControlDomView}
     */
    onTapComplete (aGesture) {
        this.debugLog(".onTapComplete()")
        this.sendActionToTarget()
        return this
    }

    /**
     * @description Sends the action to the target
     * @returns {*}
     */
    sendActionToTarget () {
        if (!this.action()) {
            return null
        }

        const t = this.target()
        if (!t) {
            throw new Error("no target for action " + this.action())
        }

        const method = t[this.action()]
        if (!method) {
            throw new Error("no target for action " + this.action())
        }

        return method.call(t, this)
    }

    /**
     * @description Handles double click event
     * @param {Event} event - The double click event
     * @returns {boolean}
     */
    onDoubleClick (event) {
        return true
    }
    
}.initThisClass());