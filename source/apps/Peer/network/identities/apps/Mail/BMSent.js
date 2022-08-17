
"use strict";

/*

    BMSent

*/

(class BMSent extends BMStorableNode {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
 		this.setShouldStore(true)
 		this.setShouldStoreSubnodes(false)
        this.setNoteIsSubnodeCount(true)
        this.setTitle("sent")
    }
    
}.initThisClass());