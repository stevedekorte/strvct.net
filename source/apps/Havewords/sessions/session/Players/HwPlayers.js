"use strict";

/*
    
HwPlayers

*/

(class HwPlayers extends BMSummaryNode {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setTitle("Players");
        this.addNodeAction("add")
        this.setNodeCanReorderSubnodes(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setSubnodeClasses([HwPlayer])
        return this
    }

    finalInit () {
        super.finalInit();
    }
	
}.initThisClass());
