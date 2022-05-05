"use strict";

/*
    
    BreadCrumbRowView
    
*/

(class BreadCrumbRowView extends BrowserRow {
    
    initPrototype () {
        this.newSlot("path", null)
        this.newSlot("textView", null)
    }

    init () {
        super.init()

        const cv = this.contentView()
        cv.setMinHeight("3em")
        cv.setPadding("1em")

        
        const tv = TextField.clone()
        this.setTextView(tv)
        this.contentView().addSubview(tv)

        tv.setDisplay("flex")
        //tv.setFlex("10")
        tv.setAlignItems("flex-start") // alignment in direction of flex
        tv.setJustifyContent("center") // alignment perpendicutal to flex
        tv.setFlexDirection("column")
        tv.setWidth("100%")
        tv.setHeight("100%")

        tv.setUsesDoubleTapToEdit(true)
        tv.setOverflow("visible")
        tv.setPaddingLeft("0em")
        tv.setString("io / about / test")
        //tv.setFontSize("2em")

        this.setWidth("100%")
        /*
        this.setWidth = (w) => {
            debugger;
            return super.setWidth(w)
        }
        */

        this.updateSubviews()
        this.setIsSelectable(true)

        this._obs = BMNotificationCenter.shared().newObservation().setName("onStackViewPathChange").setObserver(this).watch()

        return this
    }

    onStackViewPathChange (aNote) {
        const stackView = aNote.sender()
        const nodes = stackView.selectedNodePathArray()
        nodes.shift()
        const path = nodes.map(node => node.title()).join(" / ")
        this.textView().setString(path)
    }

    updateSubviews () {
        super.updateSubviews()
        return this
    }
    
    // ---

    desiredWidth () {
        return 10000 //this.calcWidth()
    }

    
}.initThisClass());
