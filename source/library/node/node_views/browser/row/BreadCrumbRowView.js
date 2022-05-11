"use strict";

/*
    
    BreadCrumbRowView
    
*/

(class BreadCrumbRowView extends BrowserRow {
    
    initPrototype () {
        this.newSlot("path", null)
        this.newSlot("textView", null)
        this.newSlot("separatorString", "/")
        this.newSlot("onStackViewPathChangeObs", null)
    }

    init () {
        super.init()
        this.setOnStackViewPathChangeObs(BMNotificationCenter.shared().newObservation().setName("onStackViewPathChange").setObserver(this))
        this.setPaddingLeft("1.5em") // BrowserTitledRow.titleLeftPadding()
        this.setWidth("100%")
        this.updateSubviews()
        this.setIsSelectable(true)
        this.setIsRegisteredForDocumentResize(true)
        //this.setBorder("1px dashed rgba(255, 255, 0, .1)")
        return this
    }

/*
    onTapComplete (aGesture) {
        console.log(this.type() + " onTapComplete")
        //debugger;
        return super.onTapComplete(aGesture)
    }
*/
    watchTopStackView () {
        const obs = this.onStackViewPathChangeObs()
        if (!obs.isWatching()) {
            //obs.stopWatching()
            if (this.parentView()) {
                obs.setTarget(this.topStackView())
                //debugger;
                obs.watch()
            }
        }
    }

    makeOrientationDown () { // this is a special case where the item is full width
        super.makeOrientationDown()
        this.setMinAndMaxWidth(null)
        this.setWidth("100%")
        return this
    }

    didChangeParentView () {  // hook this to do the initial setup
        super.didChangeParentView()
        this.watchTopStackView()
        this.syncPathToStack()
        return this
    }
    
    topStackView () {
        return this.parentView() ? this.parentView().stackView().topStackView() : null
    }

    onStackViewPathChange (aNote) {
        //debugger;
        this.syncPathToStack()
    }

    pathNodes () {
        if (this.topStackView()) {
            const nodes = this.topStackView().selectedNodePathArray()
            return nodes
        }
        return []
    }

    syncPathToStack () {
        this.scheduleMethod("setupPathViews")
    }

    setHeight (v) {
        if (v === "100%") {
            debugger;
        }
        return super.setHeight(v)
    }

    // --- events ---

    onClickPathComponent (aPathComponentView) {
        const nodePathArray = aPathComponentView.info()
        if (nodePathArray.length === 0) {
            debugger;
        }
        this.topStackView().selectNodePathArray(nodePathArray)
        this.setupPathViews() // needed or does the StackView send a note?
        return this
    }

    onDocumentResize (event) {
        this.updateCompaction()
        return this
    }
    
    // --- path component views --- 

    newUnpaddedButton () {
        const v = ButtonView.clone()
        v.setDisplay("inline-block")
        v.setHeightPercentage(100)
        v.setWidth("fit-content")
        v.setPaddingLeft("0em")
        v.setPaddingRight("0em")
        v.titleView().setPaddingLeft("0em")
        v.titleView().setPaddingRight("0em")
        //v.setBorder("1px dashed rgba(255, 255, 255, .1)")
        return v

    }

    buttonForName (aName) {
        const v = this.newUnpaddedButton()
        v.setTitle(aName)
        v.setTarget(this)
        v.setAction("onClickPathComponent")
        return v
    }

    newSeparatorView () {
        const v = this.newUnpaddedButton()
        v.titleView().setPaddingLeft("0.5em")
        v.titleView().setPaddingRight("0.5em")
        v.setTitle(this.separatorString())
        return v
    }

    crumbViewForNode (node, i, pathNodes) {
        const name = node.title()
        const crumb = this.buttonForName(name)
        const crumbNodePath = this.pathNodes().slice(0, i+1) // not efficient to get pathNodes
        crumb.setInfo(crumbNodePath)
        return crumb
    }

    newPathComponentViews () {
        const pathNodes = this.pathNodes()
        return pathNodes.map((node, i, pathNodes) => this.crumbViewForNode(node, i, pathNodes))
    }

    setupPathViews () {
        const views = this.newPathComponentViews()
        const separatedViews = views.joinWithFunc((view, index) => this.newSeparatorView())
        this.removeAllSubviews()
        this.addSubviews(separatedViews)
        this.updateCompaction()
    }

    widthOfViews (views) {
        return views.sum(v => v.calcCssWidth())
    }

    // --- 

    sumOfPathWidths () {
        return this.subviews().sum(view => { 
            const w = view.display() === "none" ? 0 : view.calcCssWidth()
            if (Type.isNaN(w)) { debugger; }
            return w
        })
    }

    updateCompaction () {
        const maxWidth =  this.frameInDocument().width()
        //console.log("maxWidth: ", maxWidth)
        const views = this.subviews()
        views.forEach(view => view.unhideDisplay())

        for (let i = 0; i < views.length; i++) {
            const view = views[i]
            const sum = this.sumOfPathWidths()
            //console.log("sum: ", this.sumOfPathWidths())
            if (sum > maxWidth) {
                view.hideDisplay()
            }
        }
    }

    // ---

    desiredWidth () {
        return Number.MAX_VALUE //this.calcWidth()
    }

}.initThisClass());
