/**
 * @module library.node.node_views.browser
 */

"use strict";

/**
 * @class BrowserView
 * @extends StackView
 * @classdesc A StackView with the 2nd level node used as a horizontal breadcrumb path node.
 * 
 * To do this, we create a top wrapper node, which has one subnode which is the actual root node.
 * Somehow we will set the root node tile view to display the path selected in the UI...
 * 
 * AppLauncher - sets up database, may read App object from database or create if db is empty?
 * 
 * Nodes: ---------------> Views:
 * 
 * browserNode             BrowserView
 *   appRootNode             HeaderTile 
 *     settingsNode (OPTION hidden) 
 *     topContentNode          BreadCrumbsTile
 *         about
 *         guide
 *            index
 *            content
 *              intro
 *                overview
 *                perspectiv
 *                goals
 *         tuturial
 *         reference
 *         binaries
 *         source
 *         twitter
 *         links
 *         repl
 * 
 * Ideas:
 *     - need way to read/write local changes (with permission) to server
 *     
 * Questions:
 * - Should browserHeaderNode be the AppNode, so we can option click it to inspect it and map app name to header?
 * - Which node should be root node of storage pool?
 * -- does App own the pool, or does pool own the app?
 * -- should there be a RootPoolNode class that helps manage the pool or help expose management and info to the UI? 
 * 
 * Todo:
 *     Make moveToBase() more generic
 */

(class BrowserView extends StackView {
    
    /**
     * @description Initializes prototype slots for the BrowserView class.
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the BrowserView instance.
     * @returns {BrowserView} The initialized BrowserView instance.
     */
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

    /**
     * @description Returns the browser header node.
     * @returns {Node} The browser header node.
     */
    browserHeaderNode () {
        return this.node().subnodes().first()
    }

    /**
     * @description Returns the breadcrumbs node.
     * @returns {Node} The breadcrumbs node.
     */
    breadCrumbsNode () {
        return this.browserHeaderNode().subnodes().first()
    }

    /**
     * @description Moves the view to the base state.
     * @returns {BrowserView} The current BrowserView instance.
     */
    moveToBase () {
        assert(this.browserHeaderNode())
        assert(this.breadCrumbsNode())
        this.selectNodePathArray([this.browserHeaderNode(), this.breadCrumbsNode()])
        return this
    }

}.initThisClass());