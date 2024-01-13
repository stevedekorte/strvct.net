"use strict";

/*
    SubviewsDomView

    Deals with subviews and parents.

*/

(class SubviewsDomView extends CssDomView {
    
    initPrototypeSlots () {
        this.newSlot("parentView", null)
        this.newSlot("subviews", null)
    }

    init () {
        super.init()
        this.setSubviews([])
        return this
    }

    // --- parentView ---

    hasParentView () {
        return Type.isNullOrUndefined(this.parentView()) === false
    }
    
    didUpdateSlotParentView (oldValue, newValue) {
        return this
    }
    
    /*
    didUpdateSlotParentView (oldValue, newValue) {
        const parentless = this.thisClass().viewsWithoutParents()

        assert(oldValue !== newValue);

        if (newValue) {
            if (parentless.has(newValue)) {
                console.log("removing " + this.typeId() + " from parentless")
            }
            parentless.delete(this)
        } else if (Type.isNullOrUndefined(oldValue) && !Type.isNullOrUndefined(newValue)) {
            if (parentless.size === 0) { // is this always correct?
                this.scheduleMethod("retireParentlessViews")
            }
            console.log("adding " + this.typeId() + " to parentless")
            parentless.add(this)
        }

        return this
    }

    retireParentlessViews () {
        this.thisClass().retireParentlessViews()
    }

    */

    // --- subviews ---

    hasParentViewAncestor (aView) {
        const pv = this.parentView()
        
        if (!pv) {
            return false
        }

        if (pv === aView) {
            return true
        }

        return pv.hasParentViewAncestor(aView)
    }

    hasSubviewDescendant (aView) {
        if (aView == this) {
            return true
        }
        return this.subviews().canDetect(sv => sv.hasSubviewDescendant(aView))
    }

    allSubviewsRecursively (allViews = new Set()) {
        allViews.add(this)
        this.subviews().forEach(view => {
            view.allSubviewsRecursively(allViews)
        })
        return allViews
    }
    
    // view chains

    forEachAncestorView (fn) { // should we call this ancestorViews?
        // returned list in order of very top parent first
        let p = this.parentView()
        while (p) {
            fn(p)
            p = p.parentView()
        }
    }

    parentViewChain () { // should we call this ancestorViews?
        // returned list in order of very top parent first
        const chain = []
        let p = this.parentView()
        while (p) {
            chain.push(p)
            p = p.parentView()
        }
        return chain.reversed()
    }

    parentViewsOfClass (aClass) {
        return this.parentViewChain().filter(v => v.thisClass().isSubclassOf(aClass))
    }

    // --- subviews ---

    subviewCount () {
        return this.subviews().length
    }

    hasSubview (aSubview) {
        return this.subviews().contains(aSubview)
    }

    addSubviewIfAbsent (aSubview) {
        if (!this.hasSubview(aSubview)) {
            this.addSubview(aSubview)
        }
        return this
    }

    addSubview (aSubview) {
        assert(!Type.isNullOrUndefined(aSubview)) 
        assert(aSubview.hasElement()) 

        if (this.hasSubview(aSubview)) {
            throw new Error(this.type() + ".addSubview(" + aSubview.type() + ") attempt to add duplicate subview ")
        }

        assert(Type.isNullOrUndefined(aSubview.parentView()))
        /*
        if (aSubview.parentView()) {
            aSubview.removeFromParent()
        }
        */

        this.willAddSubview(aSubview)

        this.subviews().append(aSubview)
        //.shared().didWrite("appendChild", this)
        this.element().appendChild(aSubview.element());
        aSubview.setParentView(this)

        this.didChangeSubviewList()
        return aSubview
    }

    addSubviews (someSubviews) {
        someSubviews.forEach(sv => this.addSubview(sv))
        return this
    }

    swapSubviews (sv1, sv2) {
        assert(sv1 !== sv2)
        assert(this.hasSubview(sv1))
        assert(this.hasSubview(sv2))
        
        const i1 = this.indexOfSubview(sv1)
        const i2 = this.indexOfSubview(sv2)

        this.removeSubview(sv1)
        this.removeSubview(sv2)

        if (i1 < i2) {
            this.atInsertSubview(i1, sv2) // i1 is smaller, so do it first
            this.atInsertSubview(i2, sv1)
        } else {
            this.atInsertSubview(i2, sv1) // i2 is smaller, so do it first          
            this.atInsertSubview(i1, sv2)
        }

        assert(this.indexOfSubview(sv1) === i2)
        assert(this.indexOfSubview(sv2) === i1)

        return this
    }

    orderSubviewFront (aSubview) {
        if (this.subviews().last() !== aSubview) {
            this.removeSubview(aSubview)
            this.addSubview(aSubview)
        }
        return this
    }

    orderFront () {
        const pv = this.parentView()
        if (pv) {
            pv.orderSubviewFront(this)
        }
        return this
    }

    orderSubviewBack (aSubview) {
        this.removeSubview(aSubview)
        this.atInsertSubview(0, aSubview)
        return this
    }

    orderBack () {
        const pv = this.parentView()
        if (pv) {
            pv.orderSubviewBack(this)
        }
        return this
    }

    replaceSubviewWith (oldSubview, newSubview) {
        assert(this.hasSubview(oldSubview))
        assert(!this.hasSubview(newSubview))
        
        const index = this.indexOfSubview(oldSubview)
        this.removeSubview(oldSubview)
        this.atInsertSubview(index, newSubview)

        // TODO: remove this sanity check
        assert(this.indexOfSubview(newSubview) === index)
        assert(this.hasSubview(newSubview))
        assert(!this.hasSubview(oldSubview))
        return this
    }

    atInsertSubview (anIndex, aSubview) {
        this.subviews().atInsert(anIndex, aSubview)
        assert(this.subviews()[anIndex] === aSubview)

        //ThrashDetector.shared().didWrite("atInsertElement", this)
        this.element().atInsertElement(anIndex, aSubview.element())
        assert(this.element().childNodes[anIndex] === aSubview.element())

        aSubview.setParentView(this) // TODO: unify with addSubview
        this.didChangeSubviewList() // TODO:  unify with addSubview
        return aSubview
    }

    moveSubviewToIndex (aSubview, i) {
        assert(i < this.subviews().length)
        assert(this.subviews().contains(aSubview))

        if (this.subviews()[i] !== aSubview) {
            this.removeSubview(aSubview)
            this.atInsertSubview(i, aSubview)
        }
        return this
    }

    updateSubviewsToOrder (orderedSubviews) {
        assert(this.subviews() !== orderedSubviews)
        assert(this.subviews().length === orderedSubviews.length)

        for (let i = 0; i < this.subviews().length; i ++) {
            const v2 = orderedSubviews[i]
            this.moveSubviewToIndex(v2, i)
        }
        
        return this
    }

    // --- subview utilities ---

    sumOfSubviewHeights () {
        return this.subviews().sum(subview => subview.clientHeight())
    }

    performOnSubviewsExcept (methodName, exceptedSubview) {
        this.subviews().forEach(subview => {
            if (subview !== exceptedSubview) {
                subview[methodName].apply(subview)
            }
        })

        return this
    }

    // -----------------------

    removeFromParentView () {
        if (this.parentView()) {
            this.parentView().removeSubview(this); // will set parentView to null
        }
        return this
    }

    removeAfterFadeDelay (delayInSeconds) {
        // call removeSubview for a direct actions
        // use justRemoteSubview for internal changes

        this.setTransition("all " + delayInSeconds + "s")

        this.addTimeout(() => {
            this.setOpacity(0)
        }, 0)

        this.addTimeout(() => {
            this.parentView().removeSubview(this)
        }, delayInSeconds * 1000)

        return this
    }

    willRemove () {
    }

    didChangeSubviewList () {
    }

    hasSubview (aSubview) {
        return this.subviews().indexOf(aSubview) !== -1;
    }

    hasChildElement (anElement) {
        const children = this.element().childNodes
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (anElement === child) {
                return true
            }
        }
        return false
    }

    willAddSubview (aSubview) {
        // for subclasses to over-ride
    }

    willRemoveSubview (aSubview) {
        // for subclasses to over-ride
    }

    removeSubviewIfPresent (aSubview) {
        if (this.hasSubview(aSubview)) {
            this.removeSubview(aSubview)
        }
        return this
    }

    removeSubview (aSubview) {
        //console.warn("WARNING: " + this.type() + " removeSubview " + aSubview.type())

        // sanity check - make sure it's in our subview list
        if (!this.hasSubview(aSubview)) {
            const msg = this.type() + " removeSubview " + aSubview.typeId() + " failed - no child found among: " + this.subviews().map(view => view.typeId())
            //Error.showCurrentStack()
            throw new Error(msg)
            return aSubview
        }

        if (aSubview.parentView() !== this) {
            throw new Error("attempt to remove subview by a non parent")
        }

        // remove from subview list -  give subview a chance to deal with change
        this.willRemoveSubview(aSubview)
        aSubview.willRemove()

        this.justRemoveSubview(aSubview)

        this.didChangeSubviewList()

        return aSubview
    }

    justRemoveSubview (aSubview) { // PRIVATE
        this.subviews().remove(aSubview)

        const e = aSubview.element()
        if (this.hasChildElement(e)) { // sanity check - make we have child element 
            //ThrashDetector.shared().didWrite("removeChild", this)
            this.element().removeChild(e); // WARNING: this will trigger an immediate onBlur window event, which may cause sync actions

            // sanity check - make sure element was removed
            if (this.hasChildElement(e)) {
                const msg = "WARNING: " + this.type() + " removeSubview " + aSubview.type() + " failed - still has element after remove"
                //console.warn(msg)
                //Error.showCurrentStack()
                throw new Error(msg)
            }
        } else {
            const msg = "WARNING: " + this.type() + " removeSubview " + aSubview.type() + " parent element is missing this child element"
            throw new Error(msg)
        }

        aSubview.setParentView(null)
        return this
    }

    removeAllSubviews () {
        //const sv = this.subviews().shallowCopy()
        //sv.forEach(subview => this.removeSubview(subview))
        while(this.subviews().length) {
            const sv = this.subviews().last()
            this.removeSubview(sv)
        }
        assert(this.subviews().length === 0) // temp sanity check
        return this
    }

    indexOfSubview (aSubview) {
        return this.subviews().indexOf(aSubview)
    }

    subviewAfter (aSubview) {
        const index = this.indexOfSubview(aSubview)
        const nextIndex = index + 1
        if (nextIndex < this.subviews().length) {
            return this.subviews()[nextIndex]
        }
        return null
    }

    sendAllViewDecendants (methodName, argList) {
        this.subviews().forEach((v) => {
            v[methodName].apply(v, argList)
            v.sendAllViewDecendants(methodName, argList)
        })
        return this
    }

    // --- updates ---

    tellParentViews (msg, aView) {
        const f = this[msg]
        if (f) {
            const r = f.call(this, aView) 
            if (r === true) {
                return // stop propogation on first view returning non-false
            }
        }

        const p = this.parentView()
        if (p) {
            p.tellParentViews(msg, aView)
        }
    }

    askParentViews (msg, aView) {
        const f = this[msg]
        if (f) {
            const r = f.call(this, aView)
            return r
        }

        const p = this.parentView()
        if (p) {
            return p.getParentViewMethod(msg, aView)
        }

        return undefined
    }

    firstParentViewWithAncestorClass (aClass) {
        const p = this.parentView()
        if (p) {
            if (p.isSubclassOf(aClass)) {
                return p
            }
            return p.firstParentViewWithAncestorClass(aClass)
        }
        return undefined
    }


    // centering

    fillParentView () {
        this.setWidthPercentage(100)
        this.setHeightPercentage(100)
        return this
    }

    centerInParentView () {
        this.setMinAndMaxWidth(null)
        this.setMinAndMaxHeight(null)
        //this.setWidth("100%")
        //this.setHeight("100%")
        this.setOverflow("auto")
        this.setMarginString("auto")
        this.setPosition("absolute")
        this.setTopPx(0).setLeftPx(0).setRightPx(0).setBottomPx(0)
    }

    /*
    verticallyCenterFromTopNow () {
        if (this.parentView() === null) {
            console.warn("verticallyCenterFromTopNow called on view with no superview")
            return this
        }

        this.setPosition("absolute")
        this.setDisplay("inline-block")

        // timeout used to make sure div is placed and laid out first
        // TODO: consider ordering issue
        this.addTimeout(() => { 
            let sh = this.parentView().clientHeight()
            let h = this.clientHeight()
            this.setTopPx(sh/2 - h/2)
        }, 1)

        return this
    }

    horiontallyCenterFromLeftNow () {
        if (this.parentView() === null) {
            console.warn("horiontallyCenterFromLeftNow called on view with no superview")
            return this
        }

        this.setPosition("absolute")
        this.setDisplay("inline-block")

        // timeout used to make sure div is placed and laid out first
        // TODO: consider ordering issue
        this.addTimeout(() => { 
            let sw = this.parentView().clientWidth()
            let w = this.clientWidth()
            this.setTopPx(sw/2 - w/2)
        }, 1)

        return this
    }
    */

    rootView () {
        const pv = this.parentView()
        if (pv) {
            return pv.rootView()
        }
        return this
    }

    isInDocument () {
        return this.rootView() === DocumentBody.shared()
    }

    containerize () {
        // create a subview of same size as parent and put all other subviews in it
        const container = DomView.clone()
        container.setMinAndMaxHeight(this.clientHeight())
        container.setMinAndMaxWidth(this.clientWidth())
        this.moveAllSubviewsToView(container)
        this.addSubview(container)
        return container
    }

    uncontainerize () {
        assert(this.subviewCount() === 1)
        const container = this.subviews().first()
        this.removeSubview(container)
        container.moveAllSubviewsToView(this)
        return this
    }

    moveAllSubviewsToView (aView) {
        this.subviews().shallowCopy().forEach((sv) => {
            this.remove(sv)
            aView.addSubview(sv)
        })
        return this
    }

    // auto fit 
    // need to be careful about interactions as some of these change 
    // display and position attributes
    // NOTE: when we ask parent to fit child, should we make sure child position attribute allows this?

    hasAbsolutePositionChild () {
        return this.subviews().canDetect(sv => sv.position() === "absolute")
    }

    // auto fit width

    autoFitParentWidth () {
        this.setDisplay("block")
        this.setWidth("-webkit-fill-available")
        //this.setHeight("fill-available")
        return this
    }

    autoFitChildWidth () {
        //assert(!this.hasAbsolutePositionChild()) // won't be able to autofit!
        this.setDisplay("inline-block")
        this.setWidth("auto")
        this.setOverflow("auto")
        return this
    }

    // auto fit height

    autoFitParentHeight () {
        this.setPosition("absolute")
        //this.setHeightPercentage(100)
        this.setHeight("-webkit-fill-available")
        //this.setHeight("fill-available")
        return this
    }

    autoFitChildHeight () {
        //assert(!this.hasAbsolutePositionChild()) // won't be able to autofit!
        this.setPosition("relative") // or static? but can't be absolute
        this.setHeight("fit-content")
        return this
    }

    // organizing

    moveToAbsoluteDocumentBody () {
        const f = this.frameInDocument()
        this.setFrameInDocument(f)
        this.removeFromParentView()
        DocumentBody.shared().addSubview(this)
        return this
    }

    // organizing

    absoluteOrganizeSubviewsVertically () {
        let top = 0
        this.subviews().shallowCopy().forEach((sv) => {
            const h = sv.clientHeight()
            sv.setLeftPx(0)
            sv.setTopPx(top)
            top += h
        })
    }

    absoluteOrganizeSubviewsHorizontally () {
        let left = 0
        this.subviews().shallowCopy().forEach((sv) => {
            const w = sv.clientWidth()
            sv.setLeftPx(left)
            sv.setTopPx(0)
            left += x
        })
    }

    // html duplicates

    htmlDuplicateView () {
        const v = DomView.clone()
        v.setFrameInParent(this.frameInParentView())
        v.setInnerHtml(this.innerHtml())
        return v
    }

    htmlDuplicateViewAndSubviews (selectedSubviews) {
        selectedSubviews.forEach(sv => asset(sv.parentView() === this))

        const v = DomView.clone()
        v.setFrameInParent(this.frameInParentView())
        selectedSubviews.forEach(sv => v.addSubview(sv.htmlDuplicateView()))
        return v
    }

    htmlDuplicateViewWithSubviews () {
        const v = DomView.clone()
        v.setFrameInParent(this.frameInParentView())
        this.subviews().forEach(sv => v.addSubview(sv.htmlDuplicateView()))
        return v
    }

    // fitting

    fitSubviews () {
        const f = this.frameFittingSubviewsInParent()
        this.setFrameInParent(f)
        return this
    }

    frameFittingSubviewsInParent () {
        let u = null

        this.subviews().forEach(sv => {
            const f = sv.frameInParent()
            if (u === null) {
                u = f
            } else {
                u = u.unionWith(f)
            }
        })

        return u
    }

    fixedFrameFittingSubviews () {
        let u = null

        this.subviews().forEach(sv => {
            const f = sv.fixedFrame()
            if (u === null) {
                u = f
            } else {
                u = u.unionWith(f)
            }
        })

        return u
    }

    convertFrameToDocument (aRect) {
        const p = this.positionInDocument()
        const newOrigin = aRect.origin().add(p)
        return aRect.copy().setOrigin(newOrigin)
    }

    // ----

    updateSubviews () {

    }

    resyncAllViews () {
        this.updateSubviews() // NodeView already does this when it schedules syncFromNode, so don't call from NodeView
        this.subviews().forEach(sv => sv.resyncAllViews())
        return this
    }

    // ---- adding and removing a view to enable/disable it ---

    setParentViewIfTrue (parentView, aBool) {
        /*
         This is a helper method to easily add/remove view instead of using setDisplay("none"),
         which useful to avoid an excessively larger DOM tree, especially in repeated elements like Tiles in a ScrollView.

         NOTES:
         The problem is that layout is dependent on ordering and adding a subview to the end of the subviews
         may change layout. So it's usually better to use setIsDisplayHidden() instead. But 
        */

        if (aBool) {
            this.addToParentViewIfNeeded(parentView);
        } else {
            this.removeFromParentView();
        }
        return this;
    }

    addToParentViewIfNeeded (parentView) {
        if (this.parentView() !== parentView) {
            parentView.addSubview(this);
        }
        return this;
    }


}.initThisClass());
