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
        this.setSubtitle("")
        return this
    }

    finalInit () {
        super.finalInit();
        this.setNoteIsSubnodeCount(true);
    }

    session () {
        return this.parentNode()
    }

    service () {
        //return this.session().sessions().app().services().openAiService()
        return HavewordsApp.shared().services().openAiService()
    }

    onUpdateMessage (aMsg) {
        // sent for things like streaming updates
        // can be useful for sharing the changes with other clients
        //this.session().onUpdateAiChatMessage(aMsg) ?
        //this.session().players().shareUpdate(aMsg) ?
    }

}.initThisClass());
