"use strict";

/*

    BMGroupChat

*/

(class BMGroupChat extends BMApplet {
    
    initPrototypeSlots () {
        this.newSlot("channels", null)
        this.newSlot("directMessages", null)
        this.newSlot("profile", null)
    }

    init () {
        super.init()
        this.setTitle("Slack")
        
        this.setChannels(BaseNode.clone().setTitle("channels"))
        this.addSubnode(this.channels())

        this.setDirectMessages(BaseNode.clone().setTitle("direct messages"))
        this.addSubnode(this.directMessages())
    }

}.initThisClass());

