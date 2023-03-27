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
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
        }

        {
            const slot = this.newSlot("themes", null)
            slot.setShouldStoreSlot(true)
            slot.setCanInspect(true)
        }        
        
        {
            const slot = this.newSlot("prototypes", null)
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

        this.newSlot("breadCrumbsNode", null)

    }

    // ---

    init () {
        super.init()
        this.setNodeCanReorderSubnodes(true)
        //this.addAction("add")
        const node = BMFolderNode.clone() // FolderNode?
        this.setNodeTileClassName("HeaderTile")
        this.setNodeMinTileHeight(55)
        this.setTitle("my app header")
        this.setNodeCanEditTitle(true)
        this.setNodeIsVertical(false) 
        this.setCanDelete(false)
        return this
    }

    didInit () {
        super.didInit()
        // This didInit *may not execute before* the didInit of other nodes such as the header and breadcrumbs.
        //debugger;

        if (!this.blobs()) {
            //debugger;
            //this.setBlobs(BMBlobs.shared())
        }

        if (!this.themes()) {
            debugger;
            this.setThemes(BMThemeResources.shared())
        }

        if (!this.prototypes()) {
       //     debugger;
            //this.setPrototypes(BMPrototypesNode.shared())
        }        

        // subnodes
        this.setupBreadCrumbsNode()
        return this
    }

    // bread crumbs

    setupBreadCrumbsNode () {
        //debugger

        if (this.subnodes().length > 1) {
            this.removeAllSubnodes()
        }

        let node = this.subnodes().first()

        if (!node) {
            node = this.newBreadCrumbsNode()
            this.addSubnode(node)
        }
        node.setNodeIsVertical(true) 

        this.setBreadCrumbsNode(node)
    }

    newBreadCrumbsNode () {
        const node = BMFolderNode.clone()
        node.setNodeTileClassName("BreadCrumbsTile")
        node.setCanDelete(false)
        return node
    }

}.initThisClass());