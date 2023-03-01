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

(class RootContentNode extends App {
    
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
        this.setName("Root Content Node")
        this.setNodeCanReorderSubnodes(true)
        //this.addAction("add")

        this.setNodeMinTileHeight(55)
        this.setTitle("browser")
        this.setNodeIsVertical(false) // not setting BrowserView to down direction - why?
        return this
    }

    didInit () {
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
        const node = this.subnodeWithTitleIfAbsentInsertClosure("HeaderNode", () => {
            return this.newHeaderNode()
        })

        node.setNodeTileClassName("HeaderTile")
        node.setNodeMinTileHeight(55)
        node.setTitle("HeaderNode")
        node.setNodeIsVertical(false) 
        
        this.setHeaderNode(node)
    }

    newHeaderNode () {
        const node = BaseNode.clone() // FolderNode?
        node.setNodeTileClassName("HeaderTile")
        node.setNodeMinTileHeight(55)
        node.setTitle("HeaderNode")
        node.setNodeIsVertical(false) 
        return node
    }

    // bread crumbs

    setupBreadCrumbsNode () {
        const node = this.headerNode().subnodeWithTitleIfAbsentInsertClosure("BreadCrumbsNode", () => {
            return this.newBreadCrumbsNode()
        })
        assert(node.nodeTileClassName() === "BreadCrumbsTile")

        //debugger;
        //console.log("1 node.nodeTileClassName(): ", node.nodeTileClassName())
        node.setNodeTileClassName("BreadCrumbsTile")
        //console.log("2 node.nodeTileClassName(): ", node.nodeTileClassName())
        node.setNodeTileClassName = function () {
            throw new Error("why is this changing?")
        }

        assert(node.nodeTileClassName() === "BreadCrumbsTile")
        this.setBreadCrumbsNode(node)
    }

    newBreadCrumbsNode () {
        const node = BMFolderNode.clone()
        node.setNodeTileClassName("BreadCrumbsTile")
        return node
    }

}.initThisClass());