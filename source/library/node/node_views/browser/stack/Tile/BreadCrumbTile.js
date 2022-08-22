"use strict";

/*
    
    BreadCrumbTile
    
*/

(class BreadCrumbTile extends Tile {
    
    initPrototypeSlots () {
        this.newSlot("path", null)
        this.newSlot("separatorString", "/")
        this.newSlot("onStackViewPathChangeObs", null)
    }

    init () {
        super.init()
        this.setOnStackViewPathChangeObs(BMNotificationCenter.shared().newObservation().setName("onStackViewPathChange").setObserver(this))
        this.contentView().setPaddingLeft("1.5em") // TitledTile.titleLeftPadding()
        this.setWidth("100%")
        //this.updateSubviews()
        this.setIsSelectable(true)
        this.setIsRegisteredForWindowResize(true)
        //this.setBorder("1px dashed rgba(255, 255, 0, .1)")
        return this
    }

    makeOrientationDown () { // this is a special case where the item is full width
        super.makeOrientationDown()
        this.setMinAndMaxWidth(null)
        this.setWidth("100%")
        return this
    }

    rootStackView () { // move to Tile class?
        return this.parentView() ? this.parentView().stackView().rootStackView() : null
    }

    targetStackView () {
        const nc = this.column().nextColumn()
        if (nc) {
            //debugger;
            const sv = nc.stackView()
            return sv
        }
        return null
    }

    watchRootStackView () {
        const obs = this.onStackViewPathChangeObs()
        if (!obs.isWatching()) {
            const target = this.rootStackView()
            if (target) {
                obs.setSender(target)
                obs.startWatching()
            } else {
                //debugger;
                obs.stopWatching() // needed?
            }
        }
    }
  
    pathNodes () {
        if (this.targetStackView()) {
            const nodes = this.targetStackView().selectedNodePathArray()
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

    didUpdateSlotParentView (oldValue, newValue) {  // hook this to do the initial setup
        super.didUpdateSlotParentView(oldValue, newValue)
        if (this.parentView()) {
            this.watchRootStackView()
            this.syncPathToStack()
        }
        return this
    }

    onStackViewPathChange (aNote) {
        //debugger;
        this.syncPathToStack()
    }

    onClickPathComponent (aPathComponentView) {
        const nodePathArray = aPathComponentView.info()
        if (nodePathArray.length === 0) {
            debugger;
        }
        //console.log("select path: " + nodePathArray.map(n => n.title()).join("/"))
        //const ourPath = this.node().nodePath()
        //console.log("our path: " + ourPath.map(n => n.title()).join("/"))
        //debugger;

        const t = this.targetStackView()
        t.selectNodePathArray(nodePathArray)
    //    debugger;
        this.setupPathViews() // needed or does the StackView send a note?
        return this
    }

    onWindowResize (event) {
        this.updateCompaction()
        return this
    }

    onClickBackButton (backButton) {
        const crumb = this.lastHiddenCrumb()
        if (crumb) {
            crumb.sendActionToTarget()
        }
    }

    lastHiddenCrumb () {
        return this.subviews().reversed().detect(sv => sv._isCrumb && sv.isDisplayHidden())
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
        //v.debugTypeId = function () { return "crumbView" }
        return v

    }

    buttonForName (aName) {
        const v = this.newUnpaddedButton()
        v.setTitle(aName)
        v.setTarget(this)
        v.setAction("onClickPathComponent")
        v._isCrumb = true
        return v
    }

    newBackButton () {
        const v = this.newUnpaddedButton()
        //v.setTitle("&lt;")
        v.setTitle("&#8592;")
        v.titleView().setPaddingLeft("0em")
        v.titleView().setPaddingRight("0.5em")
        v.setTarget(this)
        v.setAction("onClickBackButton")
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
        // not efficient to get pathNodes
        // just get the path to the crumb node itself
        //console.log("pathNodes: " + pathNodes.map(n => n.title()).join("/"))
        const crumbNodePath = pathNodes.slice(0, i+1) // we WANT our own crumbview node to be the first in this path
        //console.log("crumbNodePath [" + i + "]: " + crumbNodePath.map(n => n.title()).join("/"))

        //debugger;
        crumb.setInfo(crumbNodePath)
        return crumb
    }

    newPathComponentViews () {
        const pathNodes = this.pathNodes()
        pathNodes.shift() // remove self from list
        const views = pathNodes.map((node, i, pathNodes) => this.crumbViewForNode(node, i, pathNodes))
        return views
    }

    setupPathViews () {
        const views = this.newPathComponentViews()
        const separatedViews = views.joinWithFunc((view, index) => this.newSeparatorView())
        separatedViews.unshift(this.newBackButton())
        this.contentView().removeAllSubviews()
        this.contentView().addSubviews(separatedViews)
        this.updateCompaction()
        return this
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
        const padding = 20
        const maxWidth =  this.frameInDocument().width()
        //console.log("maxWidth: ", maxWidth)
        const views = this.contentView().subviews()
        views.forEach(view => view.unhideDisplay())

        let didHide = false // to track if we need back button
        for (let i = 1; i < views.length -1; i++) {
            const view = views[i]
            const sum = this.sumOfPathWidths() + padding
            //console.log("sum: ", this.sumOfPathWidths())
            const isSeparator = view.title() === "/"
            if (isSeparator && views[i-1].isDisplayHidden()) {
                view.hideDisplay()
            }
            if (sum > maxWidth) {
                view.hideDisplay()
                didHide = true
            } else {
                break;
            }
        }

        if (!didHide) {
            // if we hid anything, we need a back button
            const backButton = views.first()
            backButton.hideDisplay()
        }
    }

    // ---

    desiredWidth () {
        return Number.MAX_VALUE
    }

}.initThisClass());
