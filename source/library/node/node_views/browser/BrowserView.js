"use strict";

/*
    
    BrowserView

    A StackView with the 2nd level node used as a horizontal breadcrumb path node.

    To do this, we create a top wrapper node, which has one subnode which is the actual root node.
    Somehow we will set the root node tile view to display the path selected in the UI...
    

    AppLauncher - sets up database, may read App object from database or create if db is empty?


    Nodes: ---------------> Views:

    browserNode             BrowserView
      appRootNode             HeaderTile 
        settingsNode (OPTION hidden) 
        topContentNode          BreadCrumbsTile
            about
            guide
               index
               content
                 intro
                   overview
                   perspectiv
                   goals
            tuturial
            reference
            binaries
            source
            twitter
            links
            repl
            

    Ideas:

        - need way to read/write local changes (with permission) to server
        
    Questions:

    - Should headerNode be the AppNode, so we can option click it to inspect it and map app name to header?
    - Which node should be root node of storage pool?
    -- does App own the pool, or does pool own the app?
    -- should there be a RootPoolNode class that helps manage the pool or help expose management and info to the UI? 

    Todo:

        Make moveToBase() more generic
*/

(class BrowserView extends StackView {
    
    initPrototypeSlots () {
        // broswerNode is this view's node()
        //this.newSlot("headerNode", null) // top header
        //this.newSlot("breadCrumbsNode", null) // breadcrumbs
    }

    init () {
        super.init()
        //this.setupBrowserNode()
        //this.setupHeaderNode()
        return this
    }

    /*
    setupBrowserNode () {
        const node = BaseNode.clone()
        node.setNodeMinTileHeight(55)
        node.setTitle("browser")
        node.setNodeIsVertical(false) // not setting BrowserView to down direction - why?
        this.setNode(node)
        return this
    }

    setupHeaderNode () {
        const node = BaseNode.clone()
        node.setNodeTileClassName("HeaderTile")
        node.setNodeMinTileHeight(55)
        node.setTitle("Header Tile")
        node.setNodeIsVertical(false) 
        this.setHeaderNode(node)
        this.node().addSubnode(node)
        return this
    }

    didUpdateSlotBreadCrumbsNode (oldValue, newValue) {
        //debugger;

        // tell the node to hint to UI to use BreadCrumbsTile view to display itself
        newValue.setNodeTileClassName("BreadCrumbsTile")
        newValue.setTitle("BreadCrumbsTile")

        // make sure it's the only thing under the header
        this.headerNode().removeAllSubnodes()
        this.headerNode().addSubnode(newValue)
        //this.headerNode().addSubnode(this.newSettingsNode())

        // this should set up header view (and bread crumb view?)
        this.syncFromNode()
        
        // select the bread crumb tile
        // this should cause it's child stack view to get rendered (Notes, Settings, Resources)
        this.scheduleMethod("moveToBase")
        return this
    }
    */

    moveToBase () {
        //this.selectNodePathArray([this.headerNode(), this.breadCrumbsNode()])
       // debugger;
        return this
    }

}.initThisClass());
