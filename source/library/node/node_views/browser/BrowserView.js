"use strict";

/*
    
    BrowserView

    A StackView with the top node used as a horizontal breadcrumb path node.

    To do this, we create a top wrapper node, which has one subnode which is the actual root node.
    Somehow we will set the root node row view to display the path selected in the UI...
    
*/

(class BrowserView extends StackView {
    
    initPrototype () {
        
    }

    init () {
        super.init()

        const top = BMNode.clone()
        top.setTitle("browser root node")
        top.setNodeIsVertical(false) // not setting BrowserView to down direction - why?
        this.setNode(top)
        //this.syncFromNode()
        //assert(this.direction() === "down")
        //console.log("browser direction: ", this.direction())
        return this
    }

    setRootNode (aNode) {
        aNode.setNodeRowViewClassName("BreadCrumbRowView")
        aNode.setTitle("test")

        this.node().addSubnode(aNode)
        return this
    }

}.initThisClass());
