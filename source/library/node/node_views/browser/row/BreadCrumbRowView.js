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

        //debugger;
        //this.setBorder("1px dashed rgba(255, 255, 0, .1)")
        return this
    }


    onTapComplete (aGesture) {
        console.log(this.type() + " onTapComplete")
        //debugger;
        return super.onTapComplete(aGesture)
    }

    watchTopStackView () {
        //debugger;
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

    makeOrientationDown () {
        super.makeOrientationDown()
        this.setMinAndMaxWidth(null)
        this.setWidth("100%")
        return this
    }

    /*
    didChangeNode () {
        super.didChangeNode()
        this.watchTopStackView()
        this.syncPathToStack()
    }
    */

    
    didChangeParentView () {
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
            //nodes.shift()
            return nodes
        }
        return []
    }

    syncPathToStack () {
        //debugger;
        /*
        const nodes = this.pathNodes()
        const path = nodes.map(node => node.title()).join(" > ")
        //console.log("BreadCrumbRowView.onStackViewPathChange path = '" + path + "'")
        //console.log("--------------------")
        this.textView().setString(path)
        */
        //debugger;
        this.scheduleMethod("setupPathViews")
    }

    setHeight (v) {
        if (v === "100%") {
            debugger;
        }
        return super.setHeight(v)
    }

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

    setupPathViews () {
        const pathNodes = this.pathNodes()
        this.removeAllSubviews()
        //console.log("BreadCrumbRowView.setupPathViews:")
        for (let i = 0; i < pathNodes.length; i++) {
            const node = pathNodes[i]
            const name = node.title()
            const crumb = this.buttonForName(name)
            const crumbNodePath = pathNodes.slice(0, i+1)
            const path = crumbNodePath.map(node => node.title()).join("/")
            //console.log("    '" + name + "' path: '" + path + "'")
            if (crumbNodePath.length === 0) {
                debugger;
            }
            crumb.setInfo(crumbNodePath)
            this.addSubview(crumb)
            if (i <= pathNodes.length - 2) {
                this.addSubview(this.newSeparatorView())
            }
        }
    }

    onClickPathComponent (aPathComponentView) {
        const nodePathArray = aPathComponentView.info()
        if (nodePathArray.length === 0) {
            debugger;
        }
        this.topStackView().requestSelectedNodePathArray(nodePathArray)
        this.setupPathViews() // needed or does the StackView send a note?
        return this
    }
    
    // ---

    desiredWidth () {
        return Number.MAX_VALUE //this.calcWidth()
    }

}.initThisClass());
