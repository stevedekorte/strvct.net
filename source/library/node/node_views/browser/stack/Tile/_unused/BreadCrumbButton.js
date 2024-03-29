"use strict";

/*
    
    BreadCrumbButton

    A button view that can get (and keep up to date) it's title from
    a node is helpful for breadcrumbs as node names can change.
    
*/

(class BreadCrumbButton extends NodeView {
    
    // --- copied from ButtonView ---


    initPrototypeSlots () {
        this.newSlot("titleView", null)
        this.newSlot("isEnabled", true)
        this.newSlot("iconView", null)
        this.newSlot("info", null)
    }

    init () {
        super.init()
        this.setDisplay("flex")
        this.flexCenterContent()
        this.setHeight("fit-content")
        this.setWidth("100%")
        this.setMinHeight("1em")

        this.setPaddingTop("0.75em")
        this.setPaddingBottom("0.85em")

        this.setPaddingLeft("1em")
        this.setPaddingRight("1em")

        this.turnOffUserSelect()
        this.setBorderRadiusPx(1)
        
        {
            const tv = TextField.clone()
            this.setTitleView(tv)
            this.addSubview(tv)
            tv.fillParentView()
            tv.setPaddingTop("0.1em").setPaddingBottom("0.1em")
            tv.setPaddingLeft("1em").setPaddingRight("1em")
            tv.flexCenterContent()
            tv.setTextAlign("center")
            tv.setMinHeight("1em")
            tv.setWhiteSpace("nowrap")
            tv.setTextOverflow("ellipsis")

            
        }

        this.setTitle("")

        const icon = SvgIconView.clone() //.setElementClassName("RightActionView")
        icon.setMinAndMaxWidth(12)
        icon.setMinAndMaxHeight(15)
        icon.setFillColor("white")
        icon.setStrokeColor("white")
        icon.setOpacity(1)
        icon.hideDisplay()
        this.setIconView(this.addSubview(icon))

        this.addDefaultTapGesture()

        return this
    }

    setIconName (aName) {
        this.iconView().setIconName(aName)
        return this
    }

    setTitle (s) {
        if (s === "" || Type.isNullOrUndefined(s)) { 
            s = " "; //"&nbsp;" // to avoid weird html layout issues
        }

        this.titleView().setValue(s)
        //this.titleView().setDisplayIsHidden(!s)
        return this
    }

    title () {
        return this.titleView().value()
    }

    setHasOutline (aBool) {
        if (aBool) {
            this.setBoxShadow("0px 0px 1px 1px rgba(255, 255, 255, 0.2)")
        } else {
            this.setBoxShadow("none")
        }
        return this
    }

    setTitleIsVisible (aBool) {
        this.titleView().setDisplayIsHidden(!aBool)
        return this
    }

    setIsEditable (aBool) {
        this.titleView().setIsEditable(aBool)
        return this
    }

    isEditable () {
        return this.titleView().isEditable()
    }

    sendActionToTarget () {
        if (!this.isEditable()) {
            super.sendActionToTarget()
        }
        return this
    }

    onTapComplete (aGesture) {
        //this.debugLog(".onTapComplete()")
        this.sendActionToTarget()
        return false
    }

    // --- not in ButtonView ---

    /*
    syncFromNode () {
        super.syncFromNode()
        if (this.node()) {
            this.setTitle(this.node().title())
        } else {
            this.setTitle("")
        }
        return this
    }
    */
    
}.initThisClass());
