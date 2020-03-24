"use strict"

/*
    
    StackItemView
    
*/

window.StackItemView = class StackItemView extends NodeView {
    
    init () {
        super.init()
        this.setDisplay("block")
        this.setPosition("relative") // so absolute position on close button works
        this.setWidth("100%")
        this.setHeight("auto")
        //this.setColor("rbga(255, 255, 255, 0.5)")
        this.setTransition("all 0s, top 0.3s, background-color .3s ease-out")
        this.setOverflow("hidden")
        this.setWhiteSpace("nowrap")
        
        /*
        this.setBorderStyle("solid")
        this.setBorderColor("transparent")
        this.setBorderLeft("0px")
        this.setBorderRight("0px")
        this.setBorderTop("1px")
        this.setBorderBottom("1px")
        */
        this.setTextAlign("left")
        this.setWebkitOverflowScrolling("touch")

        this.turnOffUserSelect()
        this.setAcceptsFirstResponder(false)
        this.setPadding("1em")

        this.setColor("white")
        //this.setBorder("1px solid rgba(255, 255, 255, 0.3")
        this.setFontFamily("Helvetica")

        this.addGestureRecognizer(TapGestureRecognizer.clone()) // for selection, and tap-longpress
    }

    stackItemSetView () {
        return this.firstParentViewWithAncestorClass(StackItemSetView)
    }

    stackView () {
        return this.firstParentViewWithAncestorClass(StackView)
    }

    // ---

    stackView () {
        return this.parentView().stackView()
    }

    // ---

    /*
    syncOrientation () {
        const d = this.stackView().direction()
        if (d === "right") {
            this.makeOrientationRight()
        } else if (d === "down") {
            this.makeOrientationDown() 
        }
        return this
    }

    makeOrientationRight () {
        //this.setBorderRight("1px solid rgba(255, 0, 0, 1)")
    }

    makeOrientationDown () {   
        //this.setBorderBottom("1px solid rgba(255, 255, 255, 0.3)")
    }
    */

    // ---

    acceptsTapBegin (aGesture) {
        return true
    }

    onTapComplete (aGesture) {
        this.tellParentViews("tappedStackItemView", this)
        this.select()
    }

    select () {
        this.setBackgroundColor("rgba(255, 255, 255, 0.15)")
    }

    unselect () {
        this.setBackgroundColor("transparent")
    }
    
    // ---

    syncFromNode () {
        //this.syncOrientation()
        this.setInnerHTML(this.node().title())
        return this
    }

    collapseParentsAsNeeded (direction) {

    }

}.initThisClass()
