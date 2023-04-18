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
        this.newSlot("headerNode", null)
    }

    init () {
        super.init()
        this.setTitle("Root Content Node")
        this.setNodeCanReorderSubnodes(true)
        //this.addAction("add")
        this.setNodeMinTileHeight(55)
        this.setNodeIsVertical(false) // not setting BrowserView to down direction - why?

        if (!this.isDeserializing()) {
            this.setupSubnodes()
        }
        return this
    }

    // header

    setupSubnodes () { // setup header node
        //debugger;
        if (this.subnodes().length > 1) {
            debugger;
            this.removeAllSubnodes()
        }

        let node = this.subnodes().first()

        if (!node) {
            node = this.newHeaderNode()
            this.addSubnode(node)
        }

        this.setHeaderNode(node)

        this.setNodeCanReorderSubnodes(false)
        node.setNodeCanReorderSubnodes(false)
    }

    newHeaderNode () {
        //debugger;
        const node = HeaderNode.clone() // FolderNode?
        node.setNodeTileClassName("HeaderTile")
        node.setNodeMinTileHeight(55)
        node.setTitle("my header")
        node.setNodeCanEditTitle(true)
        node.setNodeIsVertical(false) 
        node.setCanDelete(false)
        return node
    }


}.initThisClass());