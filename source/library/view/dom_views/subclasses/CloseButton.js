"use strict";


/* 

    CloseButton

    TODO: make subclass of ButtonView?

*/

(class CloseButton extends DomFlexView {
    
    initPrototype () {
        this.newSlot("isEnabled", true)
        this.newSlot("iconView", null)
    }

    init () {
        super.init()
        this.makeFlexAndCenterContent()
        this.setPadding("0em")
        this.turnOffUserSelect()
        //this.setDisplay("table") // to center svg

        const iv = SvgIconView.clone().setIconName("close")
        iv.makeFlexAndCenterContent()
        //iv.setTopPx(0)
        //iv.setLeftPx(0)
        
        //iv.setMarginBottom("1px") // TODO: fix the SVG for this icon so this isn't needed?
        
        iv.setWidth("fit-content")
        iv.setHeight("fit-content")
        iv.setStrokeColor("white")
        iv.setFillColor("white")
        this.setIconView(iv)
        this.addSubview(iv)

        this.setAction("close")
        this.addDefaultTapGesture()
        return this
    }

    setIconName (aString) {
        this.iconView().setIconName(aString)
        return this
    }

    // --- editable ---
    
    setIsEnabled (aBool) {
        if (this._isEnabled !== aBool) {
            this._isEnabled = aBool
            this.syncEnabled()
        }

        return this
    }

    syncEnabled () {
        this.setDisplayIsHidden(!this.isEnabled())
        return this
    }

    onTapComplete (aGesture) {
        //this.debugLog(".onTapComplete()")
        if (!this.isEditable()) {
            this.sendActionToTarget()
        }
        return false
    }
    
}.initThisClass());
