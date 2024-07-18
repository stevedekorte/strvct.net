"use strict";


/* 

    CloseButton

    TODO: make subclass of ButtonView?

*/

(class CloseButton extends FlexDomView {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("isEnabled", true);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("iconView", null);
            slot.setSlotType("SvgIconView");
        }
    }

    init () {
        super.init()
        this.makeFlexAndCenterContent()
        this.setPadding("0em")
        this.turnOffUserSelect()
        //this.setDisplay("table") // to center svg

        const iv = SvgIconView.clone().setIconName("close")
        iv.setColor("white")

        iv.setMinAndMaxWidth(10)
        iv.setMinAndMaxHeight(10)
                
        //iv.setWidth("fit-content")
        //iv.setHeight("fit-content")

        iv.makeFlexAndCenterContent()
        //iv.setTopPx(0)
        //iv.setLeftPx(0)
        //iv.setMarginBottom("1px") // TODO: fix the SVG for this icon so this isn't needed?


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
        //this.setIsDisplayHidden(!this.isEnabled())
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
