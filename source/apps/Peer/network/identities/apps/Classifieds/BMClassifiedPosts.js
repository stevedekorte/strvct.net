"use strict";

/*

    BMClassifiedPosts

*/


getGlobalThis().BMClassifiedPosts = class BMClassifiedPosts extends BMStorableNode {
    
    initPrototype () {

    }

    init () {
        super.init()
        this.setTitle("My Posts")
        this.setSubnodeProto(BMClassifiedPost)
        this.setNoteIsSubnodeCount(true)
    }

}.initThisClass()
