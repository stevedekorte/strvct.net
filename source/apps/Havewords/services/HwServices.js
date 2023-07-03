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

        {
            const slot = this.newSlot("azureService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(AzureService);
            slot.setIsSubnode(true);
        }

        {
            const slot = this.newSlot("youtubeService", null)
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(YouTubeService);
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
