"use strict";

/*

    BMClassifiedPosts

*/


(class BMClassifiedPosts extends BMStorableNode {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setTitle("My Posts")
        this.setSubnodeProto(BMClassifiedPost)
        this.setNoteIsSubnodeCount(true)
    }

}.initThisClass());
