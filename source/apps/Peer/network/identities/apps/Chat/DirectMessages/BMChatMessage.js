
"use strict";

/*

    BMChatMessage

*/

(class BMChatMessage extends BMAppMessage {
    
    initPrototypeSlots () {
        this.newSlot("content", null).setShouldStoreSlot(true)
    }

    initPrototype () {
        this.setCanDelete(true)
    }

    init () {
        super.init()
    }
	
    nodeTileLink () {
        return null
    }
	
    title () {
	    return this.content()
    }
	
    wasSentByMe () {
        return this.senderId() === this.localIdentity()
    }
	
    contentDict () {
        const contentDict = {}
        contentDict.content = this.content()
        return contentDict
    }
	
    setContentDict (contentDict) {
        this.setContent(contentDict.content)
        //this.scheduleSyncToView()
        return this
    }
	
    description () {
        return this.typeId() + "-" + this.hash() + "'" + this.content() + "'"
    }

    localIdentity () {
        return this.parentNodeOfType("BMLocalIdentity")
    }
    
    localIdentityIsSender () {
        return this.senderId().equals(this.localIdentity())
    }
    
}.initThisClass());

