"use strict";

/*

    HwPlayersChat

*/

(class HwPlayersChat extends BMSummaryNode {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        this.setTitle("Players Chat");
        this.addNodeAction("add")
        this.setNodeCanReorderSubnodes(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setSubnodeClasses([HwPlayersChatMessage])
        return this
    }

    finalInit () {
        super.finalInit();
    }
	
}.initThisClass());
