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
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the BrowserView instance.
     * @returns {BrowserView} The initialized BrowserView instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.scheduleMethod("moveToBase");
        //this.scheduleMethod("pullPathFromUrlHash")
        this.setIsRegisteredForKeyboard(true); // to get special keys like Option shift D
        return this;
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
     * @category Node Access
     */
    /*
    browserHeaderNode () {
        return this.node().subnodes().first();
    }
    */

    /**
     * @description Returns the breadcrumbs node.
     * @returns {Node} The breadcrumbs node.
     * @category Node Access
     */
    /*
    breadCrumbsNode () {
        return this.browserHeaderNode().subnodes().first();
    }
    */

    /**
     * @description Navigates to the specified node.
     * @param {Node} aNode - The node to navigate to.
     * @returns {BrowserView} The current BrowserView instance.
     * @category Navigation
     */
    navigateToNode (aNode) {
        const pathArray = aNode.nodePathArray();
        pathArray.shift(); // remove first component
        this.selectNodePathArray(pathArray);
        return this;
    }

    selectNodePathString (aPath) {
        assert(Type.isString(aPath), "aPath must be a string");
        const components = aPath.split("/");

        if (components.length === 1 && components[0] === "") {
            this.moveToBase();
            return this;
        }

        //components.shift(); // remove first component
        const selectedNode = this.node().nodeAtSubpathArray(components);
        if (selectedNode) {
            const pathArray = selectedNode.nodePathArray();
            pathArray.shift(); // remove first component

            if (pathArray.length > 1) {
                this.selectNodePathArray(pathArray);
            }
        } else {
            console.warn("no node found for path: '" + aPath + "'");
        }
        return this;
    }

    /**
     * @description Moves the view to the base state.
     * @returns {BrowserView} The current BrowserView instance.
     * @category Navigation
     */
    moveToBase () {
        //assert(this.browserHeaderNode());
        //assert(this.breadCrumbsNode());
        //this.selectNodePathArray([this.browserHeaderNode(), this.breadCrumbsNode()]);
        this.selectNodePathArray([this.node().firstVisibleSubnode()]);
        return this;
    }

    onAlternate_D_KeyUp (/*event*/) {
        return true;
    }

    onAlternate_D_KeyDown (/*event*/) {
        SvApp.shared().toggleDeveloperMode();
        //this.logDebug(" onOptionShift_d_KeyDown ", event._id, " developerMode: ", SvApp.shared().developerMode());
        return true;
    }

}.initThisClass());
