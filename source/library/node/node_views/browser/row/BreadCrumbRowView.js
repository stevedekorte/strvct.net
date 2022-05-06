"use strict";

/*
    
    BreadCrumbRowView
    
*/

(class BreadCrumbRowView extends BrowserRow {
    
    initPrototype () {
        this.newSlot("path", null)
        this.newSlot("textView", null)
        this.newSlot("separatorString", ">")
        this.newSlot("onStackViewPathChangeObs", null)
    }

    init () {
        super.init()

        this.setOnStackViewPathChangeObs(BMNotificationCenter.shared().newObservation().setName("onStackViewPathChange").setObserver(this))

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

        return this
    }

    didChangeParentView () {
        super.didChangeParentView()
        const obs = this.onStackViewPathChangeObs()
        obs.stopWatching()
        if (this.parentView()) {
            obs.setTarget(this.topStackView())
            obs.watch()
        }
        this.syncPathToStack()
        return this
    }

    topStackView () {
        return this.parentView().stackView().topStackView()
    }

    onStackViewPathChange (aNote) {
        this.syncPathToStack()
    }

    pathNodes () {
        if (this.topStackView()) {
            const nodes = this.topStackView().selectedNodePathArray()
            nodes.shift()
            return nodes
        }
        return []
    }

    syncPathToStack () {
        const nodes = this.pathNodes()
        const path = nodes.map(node => node.title()).join(" > ")
        console.log("BreadCrumbRowView.onStackViewPathChange path = '" + path + "'")
        this.textView().setString(path)
        console.log("--------------------")
    }

    buttonForName (aName) {
        const v = DomFlexView.clone()
        v.setDisplay("inline-block")
        v.setInnerHtml(name)
        v.setTarget(this)
        v.setAction("onClickPathComponent")
        return sv
    }

    newSeparatorView () {
        const v = DomFlexView.clone()
        v.setDisplay("inline-block")
        v.setPaddingLeft("1em")
        v.setPaddingRight("1em")
        v.setInnerHtml(this.separatorString())
        return v
    }

    setupForPathArray (pathArray) {
        this.removeAllSubviews()
        for (i = 0; i < pathArray.length; i++) {
            const name = pathArray[i]
            this.addSubview(this.buttonForName(name))
            if (i <= pathArray.length - 1) {
                this.addSubview(this.newSeparatorView())
            }
        }
    }

    onClickPathComponent (aPathComponentView) {

    }
    
    // ---

    desiredWidth () {
        return Number.MAX_VALUE //this.calcWidth()
    }

    
}.initThisClass());
