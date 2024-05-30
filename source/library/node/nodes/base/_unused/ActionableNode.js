"use strict";

/*

    ActionableNode

    BMNode -> TitledNode -> InspectableNode -> ViewableNode -> StyledNode -> BaseNode -> StorableNode

    Handles a list of actions the node can perform from the user interface (or other APIs).

*/

(class ActionableNode extends TitledNode {
    /*
    initPrototypeSlots () {

        {
            const slot = this.newSlot("nodeActions", null);
            slot.setInitProto(Array);
        }


    }

    // --- standard actions -----------------------------

    setCanAdd (aBool) {
        if (aBool) {
            this.addNodeAction("add")
        } else {
            this.removeNodeAction("add")
        }
        return this
    }
    
    addNodeAction (actionString) {
        if (!this.nodeActions().contains(actionString)) {
	        this.nodeActions().push(actionString)
            this.didUpdateNodeIfInitialized()
        }
        return this
    }

    removeNodeAction (actionString) {
        if (this.nodeActions().contains(actionString)) {
        	this.nodeActions().remove(actionString)
            this.didUpdateNodeIfInitialized()
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

    canSelfAddSubnode () {
        return this.hasNodeAction("add")
    }
    */

}.initThisClass());




