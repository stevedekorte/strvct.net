
"use strict";

/*

    BMDrafts

*/

(class BMDrafts extends BMStorableNode {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
 		this.setShouldStore(true)
        this.setNoteIsSubnodeCount(true)
        this.setSubnodeProto(BMMailMessage)
        this.addAction("add")
        this.setTitle("drafts")
    }
    
    localIdentity () {
        return this.parentNodeOfType("BMLocalIdentity")
    }
    
    add () {
        const newPrivateMsg = super.add()
        newPrivateMsg.setSenderPublicKeyString(this.localIdentity().publicKeyString()).setupInputsFromPubkeys()
        this.didUpdateNode()
        return newPrivateMsg
    }
    
}.initThisClass());