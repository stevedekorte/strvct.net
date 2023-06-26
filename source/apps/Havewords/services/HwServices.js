"use strict";

/*

    HwServices

*/

(class HwServices extends BMSummaryNode {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("openAiService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(OpenAiService);
            slot.setIsSubnode(true);
        }

        
        {
            const slot = this.newSlot("midjourneyService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(MJService);
            slot.setIsSubnode(true);
        }
        
    }

    init () {
        super.init()
        this.setTitle("Services");
        this.setNodeCanReorderSubnodes(false)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        return this
    }
	
}.initThisClass());
