"use strict"

/*

    BrowserHeaderAction

    Merge with ButtonView?
    
*/

 
window.BrowserHeaderAction = class BrowserHeaderAction extends NodeView {
    
    initPrototype () {
        this.newSlot("canClick", true)
    }

    init () {
        super.init()
        return this
    } 
    
    updateCanClick () {
        if (this.canClick()) {
            this.setOpacity(1)
            //this.setIsRegisteredForClicks(true) // will update cursor
            this.addDefaultTapGesture()

        } else {
            this.setOpacity(0.5)
            //this.setIsRegisteredForClicks(false) 
            this.removeDefaultTapGesture()

        }
    }
    
    updateTooltip () {
        this.setToolTip(this.action())
        return this
    }
	
    updateImage () {
        this.setBackgroundImageUrlPath(this.pathForIconName(this.action()))
        this.setBackgroundSizeWH(10, 10) // use "contain" instead?
        this.setBackgroundPosition("center")
        this.setOpacity(0.6)
        return this
    }

    syncFromNode () {
        this.updateCanClick()
        this.updateImage()
        this.updateTooltip()
        return this
    }

    onTapComplete (aGesture) {
        //this.debugLog(".onTapComplete()")
        this.sendActionToTarget()
        return false
    }
    
}.initThisClass()
