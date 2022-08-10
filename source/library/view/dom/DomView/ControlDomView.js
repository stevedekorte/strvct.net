"use strict";

/*
    ControlDomView

    Target / action state and behavior.

*/

(class ControlDomView extends ResponderDomView {
    
    initPrototype () {
        // Targetable - target / action
        this.newSlot("target", null)
        this.newSlot("action", null)
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

        return method.apply(t, [this])
    }

    onDoubleClick (event) {
        return true
    }
    
}.initThisClass());
