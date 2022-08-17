"use strict";

/*

    ActionableNode

    BMNode -> TitledNode -> ActionableNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode

    Handles a list of actions the node can perform from the user interface (or other APIs).

*/

(class ActionableNode extends TitledNode {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("actions", null)
            slot.setInitProto(Array)
        }
    }

    /*
    init () {
        super.init()
        return this
    }
    */
    
    // --- standard actions -----------------------------
    
    addAction (actionString) {
        if (!this.actions().contains(actionString)) {
	        this.actions().push(actionString)
            this.didUpdateNode()
        }
        return this
    }

    removeAction (actionString) {
        if (this.actions().contains(actionString)) {
        	this.actions().remove(actionString)
            this.didUpdateNode()
        }
        return this
    }
    
    addActions (actionStringList) {
        actionStringList.forEach( (action) => {
            this.addAction(action)
        })
        return this
    }
    
    hasAction (actionName) {
        return this.actions().contains(actionName)
    }
    
    performAction (actionName) {
        return this[actionName].apply(this)
    }

   
    /*
    nodeParentHasDeleteAction () {
        const p = this.parentNode()
        return p && p.hasAction("delete")
    }
    */

    /*
    canDelete () {
        if (this._canDelete) {
            return true
        }

        return this.nodeParentHasDeleteAction()
    }
    */

    canSelfAddSubnode () {
        return this.hasAction("add")
    }

}.initThisClass());




