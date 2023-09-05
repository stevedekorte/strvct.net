"use strict";

/*

    HwAiChat

*/

(class HwAiChat extends BMSummaryNode {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        this.setTitle("AI Chat");
        this.addNodeAction("add")
        this.setNodeCanReorderSubnodes(true)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setSubnodeClasses([HwAiChatMessage])
        return this
    }

    finalInit () {
        super.finalInit();
    }
	
}.initThisClass());
