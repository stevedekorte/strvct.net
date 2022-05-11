"use strict";

/*
    
    BrowserView

    A StackView with the top node used as a horizontal breadcrumb path node.

    To do this, we create a top wrapper node, which has one subnode which is the actual root node.
    Somehow we will set the root node row view to display the path selected in the UI...
    
*/

(class BrowserView extends StackView {
    
    initPrototype () {
        this.newSlot("baseNode", null)
    }

    init () {
        super.init()
        const top = BMNode.clone()
        top.setNodeMinRowHeight(55)
        top.setTitle("browser")
        top.setNodeIsVertical(false) // not setting BrowserView to down direction - why?
        this.setNode(top)
        //this.syncFromNode()
        //assert(this.direction() === "down")
        //console.log("browser direction: ", this.direction())
        return this
    }

    setBaseNode (aNode) {
        this._baseNode = aNode
        aNode.setNodeRowViewClassName("BreadCrumbRowView")
        aNode.setTitle("test")
        this.node().addSubnode(aNode)
        this.syncFromNode()
        this.scheduleMethod("moveToBase")
        return this
    }

    moveToBase () {
        this.selectNodePathArray([this.node(), this.baseNode()])
        return this
    }

}.initThisClass());
