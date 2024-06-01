"use strict";

/*
    
    BreadCrumbsNode
    

*/

(class BreadCrumbsNode extends BMFolderNode {
    
    initPrototypeSlots () {
        /*
        {
            const slot = this.newSlot("blobs", null)
            slot.setFinalInitProto(BMBlobs)
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
        }
        */
    }
  
    initPrototype () {
        this.setNodeTileClassName("BreadCrumbsTile");
        this.setCanDelete(false);
        this.setNodeMinTileHeight(55);
        this.setNodeCanReorderSubnodes(false);
        this.setNodeIsVertical(true);
        this.setNodeCanAddSubnode(false);
    }

}.initThisClass());