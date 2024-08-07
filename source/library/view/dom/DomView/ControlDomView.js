"use strict";

/*
    ControlDomView

    Target / action state and behavior.

*/

(class ControlDomView extends ResponderDomView {
    
    initPrototypeSlots () {
        // Targetable - target / action
        {
            const slot = this.newSlot("target", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }
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

    hasTargetAndAction () {
        return (this.target() !== null) && (this.action() !== null)
    }

    setTarget (anObject) {
        this._target = anObject
        this.setIsRegisteredForClicks(this.hasTargetAndAction())
        return this
    }

    setAction (anActionString) {
        this._action = anActionString
        this.setIsRegisteredForClicks(this.hasTargetAndAction())
        return this
    }

    // ---

    onClick (event) {
        debugger;
        this.debugLog(".onClick()")
        this.sendActionToTarget()
        event.stopPropagation()
        return false
    }

    onTapComplete (aGesture) {
        this.debugLog(".onTapComplete()")
        this.sendActionToTarget()
        return this
    }

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

    onDoubleClick (event) {
        return true
    }
    
}.initThisClass());
