"use strict";

/*

    BMBuy

*/

(class BMBuy extends BMStorableNode {
    
    initPrototypeSlots () {
        this.newSlot("post", null)
    }

    init () {
        super.init()
        this.setTitle("Buy")
        this.setCanDelete(true)
        this.setSubtitle(Math.floor(Math.random()*10000))
    }
    
    setPost (aPost) {
        if (this.post()) {
            this.removeSubnode(this.post())
        }
        
        this._post = aPost
        this.addSubnode(aPost)
        return this
    }

}.initThisClass());
