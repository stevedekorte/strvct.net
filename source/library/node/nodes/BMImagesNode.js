"use strict";

/*
    
    BMImageResourcesNode 

*/  

(class BMImageResourcesNode extends BMStorableNode {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()

        this.setNodeViewClassName("ImageView")
        this.setSubnodeProto("ImageNode")
        
        this.setNodeCanEditTitle(true)
        this.setNodeCanEditSubtitle(false)
        this.setTitle(null)
        this.setSubtitle(null)
        
        //this.addNodeActions(["add"])
        //this.setCanDelete(true)

    }
    
}.initThisClass());
