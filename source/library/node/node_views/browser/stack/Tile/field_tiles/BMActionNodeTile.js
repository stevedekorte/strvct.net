"use strict";

/*

    BMActionNodeTile

*/

(class BMActionNodeTile extends Tile {
    
    initPrototypeSlots () {
        this.newSlot("buttonView", null)
    }

    init () {
        super.init()

        const cv = this.contentView()
        cv.flexCenterContent()
        cv.setPaddingTop("0.5em")
        cv.setPaddingBottom("0.5em")
        cv.setPaddingLeft("1em")
        cv.setPaddingRight("1em")
		
        const bv = ButtonView.clone().setElementClassName("BMActionNodeView")
        this.setButtonView(bv)
	    bv.setTarget(this).setAction("didClickButton")
	    bv.setBorder("1px solid rgba(128, 128, 128, 0.5)")

        this.addContentSubview(this.buttonView())
        //this.setMinHeightPx(64)
        return this
    }

    updateSubviews () {	
        super.updateSubviews()
		
        const node = this.node()
        const bv = this.buttonView()
        bv.setTitle(node.title())
        bv.setIsEditable(node.nodeCanEditTitle())

        if (node.isEnabled()) {
            bv.setOpacity(1)	
        } else {
            bv.setOpacity(0.5)	
        }
		
        return this
    }
    
    onEnterKeyUp (event) {
        this.doAction()
        return false
    }
    
    doAction () {
        if (this.node().isEnabled()) { // check in node field?
            this.node().doAction()
        }
        return this     
    }
    
    didClickButton () {
        this.doAction()
        return this
    }

    syncToNode () {
        this.node().setTitle(this.buttonView().title()) 
        super.syncToNode()
        return this
    }

    onDidEdit (changedView) {     
        this.scheduleSyncToNode()
        //this.node().didUpdateView(this)
        //this.scheduleSyncFromNode() // needed for validation?
        return true
    }
    
}.initThisClass());
