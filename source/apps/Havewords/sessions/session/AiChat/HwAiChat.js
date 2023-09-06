"use strict";

/*

    HwAiChat

*/

(class HwAiChat extends OpenAiConversation /*BMSummaryNode*/ {
    
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

    session () {
        return this.parentNode()
    }

    service () {
        //return this.session().sessions().app().services().openAiService()
        return HavewordsApp.shared().services().openAiService()
    }
	
}.initThisClass());
