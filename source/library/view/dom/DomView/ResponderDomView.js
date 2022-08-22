"use strict";

/*
    ResponderDomView

    Dealing with controlling focus and handling focus events,
    manaing firstResponder, tabbing between key views
    
*/

(class ResponderDomView extends GesturableDomView {
    
    static initClass () {
        this.newClassSlot("tabCount", 0)
    }

    initPrototypeSlots () {
        this.newSlot("acceptsFirstResponder", false)

        // browser looks at element.tabindex to find next element 
        // to focus on tab press, but we may want more behavior
        //this.newSlot("interceptsTab", true)
        this.newSlot("nextKeyView", null)
        //this.newSlot("canMakeKey", true)
    }

    /*
    init () {
        super.init()
        return this
    }
    */

    // --- focus ---

    scheduleRegisterForFocus () {
        this.addTimeout(() => { this.setIsRegisteredForFocus(true); }, 0) 
    }


    hasFocusedDecendantView () {
        const focusedView = WebBrowserWindow.shared().activeDomView()
        if (focusedView) {
            return this.hasSubviewDescendant(focusedView)
        }
        return false
    }

    focus () {
        if (!this.isActiveElement()) {
            //console.log(this.typeId() + " focus <<<<<<<<<<<<<<<<<<")
            /*
            const focusedView = WebBrowserWindow.shared().activeDomView()

            // TODO: need a better solution to this problem
            if (focusedView && !this.hasFocusedDecendantView()) {
                
                if (focusedView && focusedView.type() === "TextField") {
                    console.log("  -- taking focus from " + focusedView.typeId())
                }
                
                //this.debugLog(".focus() " + document.activeElement.domView())
                this.addTimeout(() => { this.element().focus() }, 0)
            }
            */
            //this.addTimeout(() => { this.element().focus() }, 0)

            this.element().focus()
        }
        return this
    }

    focusAfterDelay (seconds) {
        this.addTimeout(() => {
            const e = this.element()
            if (e) {
                // in case element has retired during the timeout
                e.focus()
            }
        }, seconds * 1000)
        return this
    }

    hasFocus () {
        return this.isActiveElement()
    }

    blur () { 
        // i.e. unfocus
        this.element().blur()
        return this
    }

    // --- active element ---

    isActiveElement () {
        return document.activeElement === this.element()
    }

    isActiveElementAndEditable () {
        return this.isActiveElement() && this.contentEditable()
    }

    isFocused () {
        return this.isActiveElement()
    }

    // --- inner html ---

    setInnerHtml (v) {
        const oldValue = this.element().innerHTML

        if (v === null) {
            v = ""
        }

        v = "" + v

        if (v === oldValue) {
            return this
        }

        const isFocused = this.isActiveElementAndEditable()

        if (isFocused) {
            this.blur()
            const savedSelection = this.saveSelection()
            this.element().innerHTML = v
            savedSelection.collapse()
            this.restoreSelection(savedSelection)
            this.focus()
        } else {
            this.element().innerHTML = v
        }

        return this
    }

    forceRedisplay () {
        // NOTE: not sure this works
        const p = this.parentView()
        if (p) {
            const d = p.display()
            p.setDisplay("none")
            p.setDisplay(d)  
        }
        return this
    }

    /*
    onKeyPress (event) { // no longer used or registered
        console.log("onKeyPress")
        return true
    }
    */

    onKeyUp (event) {
        let shouldPropogate = true
        //this.debugLog(" onKeyUp ", event._id)
        const methodName = BMKeyboard.shared().upMethodNameForEvent(event)
        //console.log("methodName: ", methodName)
        this.invokeMethodNameForEvent(methodName, event)
        return shouldPropogate
    }

    didEdit () {
        this.debugLog("didEdit")
        this.tellParentViews("onDidEdit", this)
        return this
    }

    onEnterKeyUp (event) {
        return true
    }

    // --- tabs and next key view ----

    onTabKeyDown (event) {
        // need to implement this on key down to prevent browser from handling tab?
        //this.debugLog(" onTabKeyDown ", event._id)

        if (this.selectNextKeyView()) {
            //event.stopImmediatePropagation() // prevent other listeners from getting this event
            //console.log("stopImmediatePropagation ")
        }
        return false
    }

    onTabKeyUp (event) {
        //this.debugLog(" onTabKeyUp ", event._id)
        return false
    }

    becomeKeyView () { 
        // use this method instead of focus() in order to give the receiver 
        // a chance to give focus to one of it's decendant views
        this.focus()
        return this
    }

    selectNextKeyView () {
        // returns true if something is selected, false otherwise

        //this.debugLog(" selectNextKeyView")
        const nkv = this.nextKeyView()
        if (nkv) {
            nkv.becomeKeyView()
            return true
        } else {
            const p = this.parentView()
            if (p) {
                return p.selectNextKeyView()
            }
        }
        return false
    }

    // --- error checking ---

    isValid () {
        return true
    }

    // --- focus and blur event handling ---

    willAcceptFirstResponder () {
        //this.debugLog(".willAcceptFirstResponder()")
        return this
    }

    didReleaseFirstResponder () {
        // called on blur event from browser?
        return this
    }

    // --- firstResponder --- 

    isFirstResponder () {
        return document.activeElement === this.element()
    }

    willBecomeFirstResponder () {
        // called if becomeFirstResponder accepts
    }

    becomeFirstResponder () {
        if (this.acceptsFirstResponder()) {
            this.willBecomeFirstResponder()
            this.focus()
        } else if (this.parentView()) {
            this.parentView().becomeFirstResponder()
        }
        return this
    }

    releaseFirstResponder () {
        // walk up parent view chain and focus on the first view to 
        // answer true for the acceptsFirstResponder message
        //this.debugLog(".releaseFirstResponder()")

        if (this.isFocused()) { 
            this.blur()
        }

        this.tellParentViews("decendantReleasedFocus", this)
        /*
        if (this.parentView()) {
            this.parentView().becomeFirstResponder()
        }
        */
        return this
    }



    // helpers

    /*
    mouseUpPos () { 
        return this.viewPosForWindowPos(Mouse.shared().upPos())
    }

    mouseCurrentPos () { 
        return this.viewPosForWindowPos(Mouse.shared().currentPos())
    }
    */

    /*
    mouseDownPos () {
        return this.viewPosForWindowPos(Mouse.shared().downPos())
    }
    */


    // ------------------------------------------------

    disablePointerEventsUntilTimeout (ms) {
        // typically used to disbale view until an animation is complete

        this.setPointerEvents("none")
        this.debugLog(" disabling pointer events")

        this.addTimeout(() => {
            this.debugLog(" enabling pointer events")
            this.setPointerEvents("inherit")
        }, ms)

        return this
    }

}.initThisClass());
