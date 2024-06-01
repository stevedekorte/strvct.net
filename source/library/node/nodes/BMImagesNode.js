"use strict";

/*
    
    BMImageResourcesNode 

*/  

(class BMImageResourcesNode extends BMStorableNode {
    
    initPrototypeSlots () {
    }

    initPrototype () {
        this.setNodeViewClassName("ImageView")
        this.setSubnodeProto("ImageNode")
        
        this.setNodeCanEditTitle(true)
        this.setNodeCanEditSubtitle(false)
        this.setTitle(null)
        this.setSubtitle(null)
        
        //this.setNodeCanAddSubnode(true);
        //this.setCanDelete(true)
    }
    
}.initThisClass());
