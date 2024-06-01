"use strict";

/*
    
    HeaderNode
    
    This singleton sets up: 

    - themes (inspectable) slot
    - blobs (inspectable) slot
    - breadcrumb subnode

    (if not already set up after loading from store)

*/

(class HeaderNode extends BMFolderNode {
    
    initPrototypeSlots () {

        {
            const slot = this.newSlot("blobs", null)
            slot.setFinalInitProto(BMBlobs)
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
        }

        {
            const slot = this.newSlot("themes", null)
            slot.setFinalInitProto(BMThemeResources)
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
        }        
        
        {
            const slot = this.newSlot("prototypes", null)
            slot.setFinalInitProto(BMPrototypesNode)
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
        }

        /*
        {
            const slot = this.newSlot("settings", null)
            slot.setShouldStoreSlot(false)
            slot.setCanInspect(true)
        }
        */

        /*
        {
            const slot = this.newSlot("settings", true)
            slot.setShouldStoreSlot(false)
            //slot.setSlotType("Boolean")
            slot.setCanInspect(true)
        }


        {
            const slot = this.newSlot("breadCrumbs", true)
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
        }
        */

        {
            const slot = this.newSlot("breadCrumbsNode", null);
            slot.setFinalInitProto(BreadCrumbsNode)
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
            slot.setIsSubnode(true)
        }
    }
  
    initPrototype () {
        this.setNodeCanReorderSubnodes(true);
        //this.setNodeCanAddSubnode(true);
        //const node = BMFolderNode.clone(); // FolderNode?
        this.setNodeTileClassName("HeaderTile");
        this.setNodeMinTileHeight(100);
        this.setTitle("my app header");
        this.setNodeCanEditTitle(true);
        this.setNodeIsVertical(false);
        this.setCanDelete(false);
        this.setNodeCanAddSubnode(false);
        this.setShouldStoreSubnodes(false);
    }

    onTapOfNode () {
        super.onTapOfNode()
        setTimeout(() => this.postShouldFocusAndExpandSubnode(this.breadCrumbsNode()), 0)
    }

}.initThisClass());