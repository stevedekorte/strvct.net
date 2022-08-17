
"use strict";

/*

    BMInbox

*/

(class BMInbox extends BMStorableNode {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
 		this.setShouldStore(true)
 		this.setShouldStoreSubnodes(false)
        this.setNoteIsSubnodeCount(true)
        this.setTitle("inbox")
    }
    
}.initThisClass());