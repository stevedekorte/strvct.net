"use strict";

/*
    
    BreadCrumbsTile

    View for a typical bread crumbs path e.g.:

        a / b / c / d

    Supports compacting path to fit in view size (using back arrow) as needed.

    Registers for onStackViewPathChange notifications (sent by top StackView) to auto update path.
    TODO: register *only* for our own top stack view.
    
*/

(class BreadCrumbsTile extends Tile {
    
    initPrototypeSlots () {
        this.newSlot("path", null)
        this.newSlot("separatorString", "/")
        this.newSlot("onStackViewPathChangeObs", null)
        this.newSlot("crumbObservations", null)
    }

    init () {
        super.init()
        this.setThemeClassName("BreadCrumbsTile")
        this.setOnStackViewPathChangeObs(BMNotificationCenter.shared().newObservation().setName("onStackViewPathChange").setObserver(this))
        //this.contentView().setPaddingLeft("1.5em") // TitledTile.titleLeftPadding()
        this.setWidth("100%")

        //this.updateSubviews()
        this.setIsSelectable(true)
        this.setIsRegisteredForWindowResize(true)

        this.setCrumbObservations([])
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
        const col = this.column()
        if (col) {
            const nc = col.nextColumn()
            if (nc) {
                //debugger;
                const sv = nc.stackView()
                return sv
            }
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

    /*
    onMouseDown (event) {
        const result = super.onMouseDown(event)
        const t = this.targetStackView()
        t.selectNodePathArray([])
        this.setupPathViews() // needed or does the StackView send a note?
        return result
    }
    */

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
        console.log("select path: " + nodePathArray.map(n => n.title()).join("/"))
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
        //const crumb = this.lastHiddenCrumb()
        const crumb = this.previousCrumb()
        if (crumb) {
            //console.log("select crumb: ", crumb.title())
            crumb.sendActionToTarget()
        }
    }

    // crumb buttons

    previousCrumb () {
        const crumbs = this.crumbs().select(crumb => crumb.title() !== "/") // previous crumb
        if (crumbs.length > 1) {
            return crumbs[crumbs.length - 2]
        }
        return null
    }

    crumbs () {
        return this.subviews().first().subviews()
    }

    hiddenCrumbs () {
        return this.crumbs().detect(sv => sv._isCrumb && sv.isDisplayHidden())
    }

    lastHiddenCrumb () {
        return this.hiddenCrumbs().last()
    }
    
    // --- path component views --- 

    newUnpaddedButton () {
        const v = ButtonView.clone()
        //const v = BreadCrumbButton.clone()
        v.setDisplay("inline-block")
        v.titleView().setOverflow("visible")
        v.setHeightPercentage(100)
        v.setWidth("fit-content")
        v.setPaddingLeft("0em")
        v.setPaddingRight("0em")
        v.titleView().setPaddingLeft("0em")
        v.titleView().setPaddingRight("0em")
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
        v.setTitle("←")
        //v.setTitle("&#8592;")
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
        if (crumb.setNode) {
            crumb.setNode(node)
        }
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
        separatedViews.unshift(this.newSeparatorView())
        separatedViews.unshift(this.newBackButton())
        this.contentView().removeAllSubviews()
        this.contentView().addSubviews(separatedViews)
        this.updateCompaction()

        this.watchPathNodes()
        return this
    }

    widthOfViews (views) {
        return views.sum(v => v.calcWidth())
    }

    // --- 

    crumbViews () {
        return this.contentView().subviews()
    }

    sumOfPathWidths () { // private - IMPORTANT: uses cachedSize
        const rightMargin = 15
        return this.crumbViews().sum(view => { 
            //const w = view.calcWidth()
            const w = view.cachedSize().width()
            if (Type.isNaN(w)) { 
                debugger; 
                throw new Error("invalid width value")
            }
            return w + rightMargin
        })
    }

    updateCompaction () {
        const padding = 20
        //const maxWidth =  this.calcSize().width() //this.frameInDocument().width()
        const maxWidth = this.frameInDocument().width()
        //console.log("maxWidth: ", maxWidth)
        const views = this.crumbViews()
        views.forEach(view => view.unhideDisplay())
        views.forEach(view => view.cacheClientSize())

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

    onUpdatedNode (aNote) {
        this.scheduleMethod("setupPathViews")
    }

    watchPathNodes () {
        this.unwatchPathNodes()
        this.pathNodes().forEach(node => {
            const obs = this.watchSender(node)
            this.crumbObservations().push(obs)
        })
        return this
    }

    unwatchPathNodes () {
        this.crumbObservations().forEach(obs => {
            obs.stopWatching()
        })
        this.setCrumbObservations([])
        return this
    }

}.initThisClass());
