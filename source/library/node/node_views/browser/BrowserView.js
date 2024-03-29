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

    - Should browserHeaderNode be the AppNode, so we can option click it to inspect it and map app name to header?
    - Which node should be root node of storage pool?
    -- does App own the pool, or does pool own the app?
    -- should there be a RootPoolNode class that helps manage the pool or help expose management and info to the UI? 

    Todo:

        Make moveToBase() more generic
*/

(class BrowserView extends StackView {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        this.scheduleMethod("moveToBase")
        //this.scheduleMethod("pullPathFromUrlHash")
        return this
    }

    /*
    pullPathFromUrlHash () {
        const path = App.shared().mainWindow().urlHash()
        if (path.length) {
            this.setSelectedPathTitlesString(path)
        }
    }

    pushUrlHashFromPath () {
        App.shared().mainWindow().setUrlHash(this.selectedPathTitlesString())
    }

    topDidChangeNavSelection () {
        console.log("topDidChangeNavSelection to '" + this.selectedPathTitlesString() + "'")
        //debugger
        super.topDidChangeNavSelection()
        this.scheduleMethod("pushUrlHashFromPath")
    }
    */

    browserHeaderNode () {
        return this.node().subnodes().first()
    }

    breadCrumbsNode () {
        return this.browserHeaderNode().subnodes().first()
    }

    moveToBase () {
        assert(this.browserHeaderNode())
        assert(this.breadCrumbsNode())
        this.selectNodePathArray([this.browserHeaderNode(), this.breadCrumbsNode()])
        return this
    }

}.initThisClass());
