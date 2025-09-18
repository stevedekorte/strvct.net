"use strict";

/**
 * @module library.view.dom.DomView
 * @class SubviewsDomView
 * @extends CssDomView
 * @classdesc Manages subviews and parent views.
 */


(class SubviewsDomView extends CssDomView {
    
    initPrototypeSlots () {
        /**
         * @member {DomView} parentView - The parent view.
         */
        {
            const slot = this.newSlot("parentView", null);
            slot.setSlotType("DomView");
        }

        /**
         * @member {Array} subviews - The subviews.
         */
        {
            const slot = this.newSlot("subviews", null);
            slot.setSlotType("Array");
        }
    }

    init () {
        super.init();
        this.setSubviews([]);
        return this;
    }

    // --- parentView ---

    /**
     * @description Checks if the view has a parent view.
     * @returns {boolean} True if the view has a parent view, false otherwise.
     */
    hasParentView () {
        return Type.isNullOrUndefined(this.parentView()) === false;
    }
    
    /**
     * @description Updates the parent view slot.
     * @param {DomView} oldValue - The old parent view.
     * @param {DomView} newValue - The new parent view.
     * @returns {SubviewsDomView} The updated view.
     */
    didUpdateSlotParentView (/*oldValue, newValue*/) {
        return this;
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

    /**
     * @description Checks if the view has a parent view ancestor.
     * @param {DomView} aView - The view to check.
     * @returns {boolean} True if the view has a parent view ancestor, false otherwise.
     */
    hasParentViewAncestor (aView) {
        const pv = this.parentView();
        
        if (!pv) {
            return false;
        }

        if (pv === aView) {
            return true;
        }

        return pv.hasParentViewAncestor(aView);
    }

    /**
     * @description Checks if the view has a subview descendant.
     * @param {DomView} aView - The view to check.
     * @returns {boolean} True if the view has a subview descendant, false otherwise.
     */
    hasSubviewDescendant (aView) {
        if (aView == this) {
            return true
        }
        return this.subviews().canDetect(sv => sv.hasSubviewDescendant(aView))
    }

    /**
     * @description Recursively collects all subviews.
     * @param {Set} allViews - The set to collect all subviews.
     * @returns {Set} The set of all subviews.
     */
    allSubviewsRecursively (allViews = new Set()) {
        allViews.add(this)
        this.subviews().forEach(view => {
            view.allSubviewsRecursively(allViews)
        })
        return allViews
    }
    
    // view chains

    /**
     * @description Iterates over all ancestor views.
     * @param {function} fn - The function to apply to each ancestor view.
     */
    forEachAncestorView (fn) { // should we call this ancestorViews?
        // returned list in order of very top parent first
        let p = this.parentView()
        while (p) {
            fn(p)
            p = p.parentView()
        }
    }

    /**
     * @description Returns the parent view chain.
     * @returns {Array} The parent view chain.
     */
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

    /**
     * @description Returns the parent views of a given class.
     * @param {Function} aClass - The class to filter by.
     * @returns {Array} The parent views of the given class.
     */
    parentViewsOfClass (aClass) {
        return this.parentViewChain().filter(v => v.thisClass().isSubclassOf(aClass))
    }

    // --- subviews ---

    /**
     * @description Returns the number of subviews.
     * @returns {number} The number of subviews.
     */
    subviewCount () {
        return this.subviews().length
    }

    /**
     * @description Checks if the view has a subview.
     * @param {DomView} aSubview - The subview to check.
     * @returns {boolean} True if the view has the subview, false otherwise.
     */
    hasSubview (aSubview) {
        return this.subviews().contains(aSubview)
    }

    /**
     * @description Adds a subview if it is not already present.
     * @param {DomView} aSubview - The subview to add.
     * @returns {SubviewsDomView} The updated view.
     */
    addSubviewIfAbsent (aSubview) {
        if (!this.hasSubview(aSubview)) {
            this.addSubview(aSubview)
        }
        return this
    }

    /**
     * @description Adds a subview.
     * @param {DomView} aSubview - The subview to add.
     * @returns {SubviewsDomView} The updated view.
     */
    addSubview (aSubview) {
        assert(!Type.isNullOrUndefined(aSubview)) 
        assert(aSubview.hasElement()) 

        if (this.hasSubview(aSubview)) {
            throw new Error(this.svType() + ".addSubview(" + aSubview.svType() + ") attempt to add duplicate subview ")
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

    /**
     * @description Adds multiple subviews.
     * @param {Array} someSubviews - The subviews to add.
     * @returns {SubviewsDomView} The updated view.
     */
    addSubviews (someSubviews) {
        someSubviews.forEach(sv => this.addSubview(sv))
        return this
    }

    /**
     * @description Swaps two subviews.
     * @param {DomView} sv1 - The first subview.
     * @param {DomView} sv2 - The second subview.
     * @returns {SubviewsDomView} The updated view.
     */
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

    /**
     * @description Moves a subview to the front.
     * @param {DomView} aSubview - The subview to move to the front.
     * @returns {SubviewsDomView} The updated view.
     */
    orderSubviewFront (aSubview) {
        if (this.subviews().last() !== aSubview) {
            this.removeSubview(aSubview)
            this.addSubview(aSubview)
        }
        return this
    }

    /**
     * @description Moves the view to the front of its parent.
     * @returns {SubviewsDomView} The updated view.
     */
    orderFront () {
        const pv = this.parentView()
        if (pv) {
            pv.orderSubviewFront(this)
        }
        return this
    }

    /**
     * @description Moves a subview to the back.
     * @param {DomView} aSubview - The subview to move to the back.
     * @returns {SubviewsDomView} The updated view.
     */
    orderSubviewBack (aSubview) {
        this.removeSubview(aSubview)
        this.atInsertSubview(0, aSubview)
        return this
    }

    /**
     * @description Moves the view to the back of its parent.
     * @returns {SubviewsDomView} The updated view.
     */
    orderBack () {
        const pv = this.parentView()
        if (pv) {
            pv.orderSubviewBack(this)
        }
        return this
    }

    /**
     * @description Replaces one subview with another.
     * @param {DomView} oldSubview - The subview to replace.
     * @param {DomView} newSubview - The new subview.
     * @returns {SubviewsDomView} The updated view.
     */
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

    /**
     * @description Inserts a subview at a specific index.
     * @param {number} anIndex - The index at which to insert the subview.
     * @param {DomView} aSubview - The subview to insert.
     * @returns {SubviewsDomView} The updated view.
     */
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

    /**
     * @description Moves a subview to a specific index.
     * @param {DomView} aSubview - The subview to move.
     * @param {number} i - The index to move the subview to.
     * @returns {SubviewsDomView} The updated view.
     */
    moveSubviewToIndex (aSubview, i) {
        assert(i < this.subviews().length)
        assert(this.subviews().contains(aSubview))

        if (this.subviews()[i] !== aSubview) {
            this.removeSubview(aSubview)
            this.atInsertSubview(i, aSubview)
        }
        return this
    }

    /**
     * @description Updates the subviews to match the order of a given list.
     * @param {Array} orderedSubviews - The list of subviews in the desired order.
     * @returns {SubviewsDomView} The updated view.
     */
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

    /**
     * @description Calculates the sum of the heights of all subviews.
     * @returns {number} The sum of the heights of all subviews.
     */
    sumOfSubviewHeights () {
        return this.subviews().sum(subview => subview.clientHeight())
    }

    /**
     * @description Performs an action on all subviews except the specified one.
     * @param {string} methodName - The name of the method to perform.
     * @param {DomView} exceptedSubview - The subview to exclude from the action.
     * @returns {SubviewsDomView} The updated view.
     */
    performOnSubviewsExcept (methodName, exceptedSubview) {
        this.subviews().forEach(subview => {
            if (subview !== exceptedSubview) {
                subview[methodName].apply(subview)
            }
        })

        return this
    }

    // -----------------------

    /**
     * @description Removes the view from its parent view.
     * @returns {SubviewsDomView} The updated view.
     */
    removeFromParentView () {
        if (this.parentView()) {
            this.parentView().removeSubview(this); // will set parentView to null
        }
        return this
    }

    /**
     * @description Removes the view after a specified delay.
     * @param {number} delayInSeconds - The delay in seconds before removal.
     * @returns {SubviewsDomView} The updated view.
     */
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

    /**
     * @description Called before the view is removed.
     * @returns {SubviewsDomView} The updated view.
     */
    willRemove () {
    }

    /**
     * @description Called when the subview list changes.
     * @returns {SubviewsDomView} The updated view.
     */
    didChangeSubviewList () {
    }

    /**
     * @description Checks if the view has a child element.
     * @param {Element} anElement - The element to check.
     * @returns {boolean} True if the view has the element, false otherwise.
     */
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

    /**
     * @description Called before adding a subview.
     * @param {DomView} aSubview - The subview to add.
     * @returns {SubviewsDomView} The updated view.
     */
    willAddSubview (/*aSubview*/) {
        // for subclasses to over-ride
    }

    /**
     * @description Called before removing a subview.
     * @param {DomView} aSubview - The subview to remove.
     * @returns {SubviewsDomView} The updated view.
     */
    willRemoveSubview (/*aSubview*/) {
        // for subclasses to over-ride
    }

    /**
     * @description Removes a subview if it is present.
     * @param {DomView} aSubview - The subview to remove.
     * @returns {SubviewsDomView} The updated view.
     */
    removeSubviewIfPresent (aSubview) {
        if (this.hasSubview(aSubview)) {
            this.removeSubview(aSubview)
        }
        return this
    }

    /**
     * @description Removes a subview.
     * @param {DomView} aSubview - The subview to remove.
     * @returns {SubviewsDomView} The updated view.
     */
    removeSubview (aSubview) {
        //console.warn("WARNING: " + this.svType() + " removeSubview " + aSubview.svType())

        // sanity check - make sure it's in our subview list
        if (!this.hasSubview(aSubview)) {
            const msg = this.svType() + " removeSubview " + aSubview.typeId() + " failed - no child found among: " + this.subviews().map(view => view.typeId())
            //Error.showCurrentStack()
            throw new Error(msg)
            //return aSubview
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

    /**
     * @description Removes a subview from the subview list.
     * @param {DomView} aSubview - The subview to remove.
     * @returns {SubviewsDomView} The updated view.
     */
    justRemoveSubview (aSubview) { // PRIVATE
        this.subviews().remove(aSubview)

        const e = aSubview.element()
        if (this.hasChildElement(e)) { // sanity check - make we have child element 
            //ThrashDetector.shared().didWrite("removeChild", this)
            this.element().removeChild(e); // WARNING: this will trigger an immediate onBlur window event, which may cause sync actions

            // sanity check - make sure element was removed
            if (this.hasChildElement(e)) {
                const msg = "WARNING: " + this.svType() + " removeSubview " + aSubview.svType() + " failed - still has element after remove"
                //console.warn(msg)
                //Error.showCurrentStack()
                throw new Error(msg)
            }
        } else {
            const msg = "WARNING: " + this.svType() + " removeSubview " + aSubview.svType() + " parent element is missing this child element"
            throw new Error(msg)
        }

        aSubview.setParentView(null)
        return this
    }

    /**
     * @description Removes all subviews.
     * @returns {SubviewsDomView} The updated view.
     */
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

    /**
     * @description Finds the index of a subview.
     * @param {DomView} aSubview - The subview to find.
     * @returns {number} The index of the subview, or -1 if not found.
     */
    indexOfSubview (aSubview) {
        return this.subviews().indexOf(aSubview)
    }

    /**
     * @description Finds the subview after a given subview.
     * @param {DomView} aSubview - The subview to find the next subview after.
     * @returns {DomView} The next subview, or null if not found.
     */
    subviewAfter (aSubview) {
        const index = this.indexOfSubview(aSubview)
        const nextIndex = index + 1
        if (nextIndex < this.subviews().length) {
            return this.subviews()[nextIndex]
        }
        return null
    }

    /**
     * @description Sends a method to all view decendants.
     * @param {string} methodName - The name of the method to send.
     * @param {Array} argList - The arguments to pass to the method.
     * @returns {SubviewsDomView} The updated view.
     */
    sendAllViewDecendants (methodName, argList) {
        this.subviews().forEach((v) => {
            v[methodName].apply(v, argList)
            v.sendAllViewDecendants(methodName, argList)
        })
        return this
    }

    // --- updates ---

    /**
     * @description Tells parent views a message.
     * @param {string} msg - The message to tell.
     * @param {DomView} aView - The view to tell.
     * @returns {SubviewsDomView} The updated view.
     */
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

    /**
     * @description Asks parent views a message.
     * @param {string} msg - The message to ask.
     * @param {DomView} aView - The view to ask.
     * @returns {SubviewsDomView} The updated view.
     */
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

    /**
     * @description Finds the first parent view with a given ancestor class.
     * @param {string} aClass - The class to check.
     * @returns {DomView} The first parent view with the ancestor class, or null if not found.
     */
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

    /**
     * @description Fills the parent view.
     * @returns {SubviewsDomView} The updated view.
     */
    fillParentView () {
        this.setWidthPercentage(100)
        this.setHeightPercentage(100)
        return this
    }

    /**
     * @description Centers the view in the parent view.
     * @returns {SubviewsDomView} The updated view.
     */
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

    /**
     * @description Finds the root view.
     * @returns {DomView} The root view.
     */
    rootView () {
        const pv = this.parentView()
        if (pv) {
            return pv.rootView()
        }
        return this
    }

    /**
     * @description Checks if the view is in the document.
     * @returns {boolean} True if the view is in the document, false otherwise.
     */
    isInDocument () {
        return this.rootView() === DocumentBody.shared()
    }

    /**
     * @description Containerizes the view.
     * @returns {SubviewsDomView} The updated view.
     */
    containerize () {
        // create a subview of same size as parent and put all other subviews in it
        const container = DomView.clone()
        container.setMinAndMaxHeight(this.clientHeight())
        container.setMinAndMaxWidth(this.clientWidth())
        this.moveAllSubviewsToView(container)
        this.addSubview(container)
        return container
    }

    /**
     * @description Uncontainerizes the view.
     * @returns {SubviewsDomView} The updated view.
     */
    uncontainerize () {
        assert(this.subviewCount() === 1)
        const container = this.subviews().first()
        this.removeSubview(container)
        container.moveAllSubviewsToView(this)
        return this
    }

    /**
     * @description Moves all subviews to a view.
     * @param {DomView} aView - The view to move the subviews to.
     * @returns {SubviewsDomView} The updated view.
     */
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

    /**
     * @description Checks if the view has an absolute position child.
     * @returns {boolean} True if the view has an absolute position child, false otherwise.
     */
    hasAbsolutePositionChild () {
        return this.subviews().canDetect(sv => sv.position() === "absolute")
    }

    // auto fit width

    /**
     * @description Auto fits the parent width.
     * @returns {SubviewsDomView} The updated view.
     */
    autoFitParentWidth () {
        this.setDisplay("block")
        this.setWidth("-webkit-fill-available")
        //this.setHeight("-webkit-fill-available")
        return this
    }

    /**
     * @description Auto fits the child width.
     * @returns {SubviewsDomView} The updated view.
     */
    autoFitChildWidth () {
        //assert(!this.hasAbsolutePositionChild()) // won't be able to autofit!
        this.setDisplay("inline-block")
        this.setWidth("auto")
        this.setOverflow("auto")
        return this
    }

    // auto fit height

    /**
     * @description Auto fits the parent height.
     * @returns {SubviewsDomView} The updated view.
     */
    autoFitParentHeight () {
        this.setPosition("absolute")
        //this.setHeightPercentage(100)
        this.setHeight("-webkit-fill-available")
        //this.setHeight("-webkit-fill-available")
        return this
    }

    /**
     * @description Auto fits the child height.
     * @returns {SubviewsDomView} The updated view.
     */
    autoFitChildHeight () {
        //assert(!this.hasAbsolutePositionChild()) // won't be able to autofit!
        this.setPosition("relative") // or static? but can't be absolute
        this.setHeight("fit-content")
        return this
    }

    // organizing

    /**
     * @description Moves the view to the absolute document body.
     * @returns {SubviewsDomView} The updated view.
     */
    moveToAbsoluteDocumentBody () {
        const f = this.frameInDocument()
        this.setFrameInDocument(f)
        this.removeFromParentView()
        DocumentBody.shared().addSubview(this)
        return this
    }

    // organizing

    /**
     * @description Organizes subviews vertically.
     * @returns {SubviewsDomView} The updated view.
     */
    absoluteOrganizeSubviewsVertically () {
        let top = 0
        this.subviews().shallowCopy().forEach((sv) => {
            const h = sv.clientHeight()
            sv.setLeftPx(0)
            sv.setTopPx(top)
            top += h
        })
    }

    /**
     * @description Organizes subviews horizontally.
     * @returns {SubviewsDomView} The updated view.
     */
    absoluteOrganizeSubviewsHorizontally () {
        let left = 0;
        this.subviews().shallowCopy().forEach((sv) => {
            const w = sv.clientWidth();
            sv.setLeftPx(left);
            sv.setTopPx(0);
            left += w;
        });
    }

    // html duplicates

    /**
     * @description Duplicates the view.
     * @returns {DomView} The duplicated view.
     */
    htmlDuplicateView () {
        const v = DomView.clone()
        v.setFrameInParent(this.frameInParentView())
        v.setInnerHtml(this.innerHtml())
        return v
    }

    /**
     * @description Duplicates the view and its selected subviews.
     * @param {Array} selectedSubviews - The selected subviews to duplicate.
     * @returns {DomView} The duplicated view.
     */
    htmlDuplicateViewAndSubviews (selectedSubviews) {
        selectedSubviews.forEach(sv => asset(sv.parentView() === this))

        const v = DomView.clone()
        v.setFrameInParent(this.frameInParentView())
        selectedSubviews.forEach(sv => v.addSubview(sv.htmlDuplicateView()))
        return v
    }

    /**
     * @description Duplicates the view and its subviews.
     * @returns {DomView} The duplicated view.
     */
    htmlDuplicateViewWithSubviews () {
        const v = DomView.clone()
        v.setFrameInParent(this.frameInParentView())
        this.subviews().forEach(sv => v.addSubview(sv.htmlDuplicateView()))
        return v
    }

    // fitting

    /**
     * @description Fits the subviews in the parent.
     * @returns {SubviewsDomView} The updated view.
     */
    fitSubviews () {
        const f = this.frameFittingSubviewsInParent()
        this.setFrameInParent(f)
        return this
    }

    /**
     * @description Fits the subviews in the parent.
     * @returns {Rect} The frame of the subviews.
     */
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

    /**
     * @description Fits the subviews in the parent.
     * @returns {Rect} The frame of the subviews.
     */
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

    /**
     * @description Converts a frame to the document.
     * @param {Rect} aRect - The frame to convert.
     * @returns {Rect} The converted frame.
     */
    convertFrameToDocument (aRect) {
        const p = this.positionInDocument()
        const newOrigin = aRect.origin().add(p)
        return aRect.copy().setOrigin(newOrigin)
    }

    // ----

    /**
     * @description Updates the subviews.
     * @returns {SubviewsDomView} The updated view.
     */
    updateSubviews () {

    }

    /**
     * @description Resynchronizes all views.
     * @returns {SubviewsDomView} The updated view.
     */
    resyncAllViews () {
        this.updateSubviews() // NodeView already does this when it schedules syncFromNode, so don't call from NodeView
        this.subviews().forEach(sv => sv.resyncAllViews())
        return this
    }

    // ---- adding and removing a view to enable/disable it ---

    /**
     * @description Sets the parent view if the condition is true.
     * @param {DomView} parentView - The parent view.
     * @param {boolean} aBool - The condition.
     * @returns {SubviewsDomView} The updated view.
     */
    setParentViewIfTrue (parentView, aBool) {
        /*
         This is a helper method to easily add/remove view instead of using setDisplay("none"),
         which useful to avoid an excessively larger DOM tree, especially in repeated elements like Tiles in a ScrollView.

         NOTES:
         The problem is that layout is dependent on ordering and adding a subview to the end of the subviews
         may change layout. So it's usually better to use setIsDisplayHidden() instead.
        */

        if (aBool) {
            this.addToParentViewIfNeeded(parentView);
        } else {
            this.removeFromParentView();
        }
        return this;
    }

    /**
     * @description Adds the view to the parent view if needed.
     * @param {DomView} parentView - The parent view.
     * @returns {SubviewsDomView} The updated view.
     */
    addToParentViewIfNeeded (parentView) {
        if (this.parentView() !== parentView) {
            parentView.addSubview(this);
        }
        return this;
    }

}.initThisClass());
