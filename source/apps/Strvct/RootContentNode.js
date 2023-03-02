"use strict";

/*
    
    RootContentNode

    Root node to use for app persistent store.
    The app is responsible for loading this from the store or creating it if it doesn't exist.

    The BrowserView node should be this node.
    The app header node is a subnode of this one, and the breadcrumbs node would be a subnode of the header.
    
    This singleton sets up: 

    - themes (inspectable) slot
    - blobs (inspectable) slot
    - breadcrumb subnode

    (if not already set up after loading from store)

*/

(class RootContentNode extends BMFolderNode {
    
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

        {
            const slot = this.newSlot("settings", null)
            slot.setShouldStoreSlot(false)
            slot.setCanInspect(true)
        }

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

        this.newSlot("headerNode", null)
        this.newSlot("breadCrumbsNode", null)

    }

    // ---

    init () {
        super.init()
        this.setTitle("Root Content Node")
        this.setNodeCanReorderSubnodes(true)
        //this.addAction("add")
        this.setNodeMinTileHeight(55)
        this.setNodeIsVertical(false) // not setting BrowserView to down direction - why?
        return this
    }

    didInit () {
        super.didInit()
        // This didInit *may not execute before* the didInit of other nodes such as the header and breadcrumbs.
        //debugger;

        if (!this.blobs()) {
            this.setBlobs(BMBlobs.shared())
        }

        if (!this.themes()) {
            this.setThemes(BMThemeResources.shared())
        }

        if (!this.prototypes()) {
            this.setPrototypes(BMPrototypesNode.shared())
        }        

        // subnodes
        this.setupHeaderNode()
        this.setupBreadCrumbsNode()
        return this
    }

    // header

    setupHeaderNode () {
       // this.removeAllSubnodes()
        //debugger;

        if (this.subnodes().length > 1) {
            this.removeAllSubnodes()
        }

        let node = this.subnodes().first()

        if (!node) {
            node = this.newHeaderNode()
            this.addSubnode(node)
        }

        node.setNodeCanEditTitle(true)

        this.setHeaderNode(node)
    }

    newHeaderNode () {
        const node = BMFolderNode.clone() // FolderNode?
        node.setNodeTileClassName("HeaderTile")
        node.setNodeMinTileHeight(55)
        node.setTitle("my header")
        node.setNodeCanEditTitle(true)
        node.setNodeIsVertical(false) 
        node.setCanDelete(false)
        return node
    }

    // bread crumbs

    setupBreadCrumbsNode () {
        //debugger
        const root = this.headerNode()

        if (root.subnodes().length > 1) {
            this.removeAllSubnodes()
        }

        let node = root.subnodes().first()

        if (!node) {
            node = this.newBreadCrumbsNode()
            root.addSubnode(node)
        }
        node.setNodeIsVertical(true) 

        //debugger;
        this.setBreadCrumbsNode(node)
    }

    newBreadCrumbsNode () {
        const node = BMFolderNode.clone()
        node.setNodeTileClassName("BreadCrumbsTile")
        node.setCanDelete(false)
        return node
    }

}.initThisClass());