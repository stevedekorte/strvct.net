"use strict";

/*

    HwSessions

*/

(class HwSessions extends BMSummaryNode {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setTitle("Sessions");
        this.setNodeCanReorderSubnodes(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setSubnodeClasses([HwSession])
        return this
    }

    finalInit () {
        super.finalInit();
        
        this.addNodeAction("add")
        this.setTitle("Sessions");
        this.setNodeCanReorderSubnodes(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setSubnodeClasses([HwSession])
        this.setNoteIsSubnodeCount(true);
    }
	
}.initThisClass());
