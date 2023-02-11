"use strict";

/*

    BMPostDraft

*/

(class BMPostDraft extends BMStorableNode {
    
    initPrototypeSlots () {
        this.newSlot("content", null).setShouldStoreSlot(true)
    }

    initPrototype () {
        this.setCanDelete(true)
        //this.setContent("...".loremIpsum(40, 100))	
        this.setShouldStore(true)	
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

    localIdentity () {
        return this.parentNodeOfType("BMLocalIdentity")
    }
    
    avatarImageDataUrl () {
        return this.localIdentity().profile().profileImageDataUrl()
    }
	
    post () {
        const msg = BMPostMessage.clone()
        msg.setContent(this.content())
        msg.postFromSender(this.localIdentity())
        this.delete()
        //this.addMessage(msg)
    }
    
}.initThisClass());

