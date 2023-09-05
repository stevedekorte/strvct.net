"use strict";

/*

    ActionableNode

    BMNode -> TitledNode -> ActionableNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode

    Handles a list of actions the node can perform from the user interface (or other APIs).

*/

(class ActionableNode extends TitledNode {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("nodeActions", null)
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
    
    addNodeAction (actionString) {
        if (!this.nodeActions().contains(actionString)) {
	        this.nodeActions().push(actionString)
            this.didUpdateNode()
        }
        return this
    }

    removeNodeAction (actionString) {
        if (this.nodeActions().contains(actionString)) {
        	this.nodeActions().remove(actionString)
            this.didUpdateNode()
        }
        return this
    }
    
    addNodeActions (actionStringList) {
        actionStringList.forEach( (action) => {
            this.addNodeAction(action)
        })
        return this
    }
    
    hasNodeAction (actionName) {
        return this.nodeActions().contains(actionName)
    }
    
    performNodeAction (actionName) {
        return this[actionName].apply(this)
    }

   
    /*
    nodeParentHasDeleteAction () {
        const p = this.parentNode()
        return p && p.hasNodeAction("delete")
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
        return this.hasNodeAction("add")
    }

}.initThisClass());




