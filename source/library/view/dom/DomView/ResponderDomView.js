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
        if (this.element().parentElement) {
            this.setIsRegisteredForFocus(true);
        } else {
            // only need timeout when create dom element in same event?
            this.addTimeout(() => { 
                this.setIsRegisteredForFocus(true); 
            }, 0) 
        }
    }

    hasFocusedDecendantView () {
        const focusedView = WebBrowserWindow.shared().activeDomView()
        if (focusedView) {
            return this.hasSubviewDescendant(focusedView)
        }
        return false
    }

    focus () {
        //console.log(this.typeId() + " focus")
        if (!this.isActiveElement()) { // document.activeElement might have browser specific behaviors
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

            //ThrashDetector.shared().didWrite("focus", this)
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
        //console.log(this.typeId() + ".blur()");
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
        const oldValue = this.element().innerHTML;

        if (Type.isNullOrUndefined(v)) {
            v = "";
        }
        if (!Type.isString(v)) {
            v = "" + v; // coerce to string
        }

        const newValue = v.asNormalizedHtml();

        if (newValue === oldValue) {
            return this;
        }

        /*
        //WebBrowserWindow.shared().storeSelectionRange();
        //this.storeSelectionRange();
        const isNumber = !Number.isNaN(parseInt(v, 10));
        if (v.length && isNumber) {
            const diff = oldValue.diff(v);
            console.log("DIFF: ", JSON.stringify(diff, 2, 2));
        }

        console.log("'" + v.substring(0, 10) + "...' SET");
        */


        if (this.isActiveElementAndEditable()) {
            //debugger;
        }

        //assert(this.element().innerHTML === v, "innerHTML was not set"); // doesn't work as it may reformat the html
        //WebBrowserWindow.shared().restoreSelectionRange();

        updateElementHTML(this.element(), newValue);

        /*
        if (newValue !== "" && 
            this.isActiveElementAndEditable() && 
            this.containsSelection()) {

                console.log("oldValue: [", oldValue, "]");
                console.log("newValue: [", newValue, "]");

                //const diff = oldValue.diff(newValue);
                //console.log("DIFF: ", JSON.stringify(diff, 2, 2));

                //assert(this.storeSelectionRange());
                updateElementHTML(this.element(), newValue);
                //this.element().innerHTML = newValue;
                //assert(this.restoreSelectionRange());
                console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>> restored selection");


            //this.focus();
        } else {
            this.element().innerHTML = newValue;
        }
        */

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
    onInput (event) {
        // sent after the content is changed
    }
    */

    didInput () {
        this.debugLog("didInput")
        this.tellParentViews("onDidInput", this)
        return this
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



function updateElementHTML(element, htmlContent) {
    // Check if the element is currently focused
    let isFocused = (document.activeElement === element);

    // Save the current scrolling position to restore later if needed
    //let scrollTop = element.scrollTop;
    //let scrollLeft = element.scrollLeft;

    // Check if the element is contenteditable or an input/textarea
    let isEditable = element.contentEditable === 'true' || element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';

    if (isEditable && isFocused) {
        // Save the selection or cursor position
        let selectionStart = element.selectionStart;
        let selectionEnd = element.selectionEnd;

        // Set the innerHTML or value
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.value = htmlContent;
        } else {
            element.innerHTML = htmlContent;
        }

        // Restore the selection or cursor position
        element.selectionStart = selectionStart;
        element.selectionEnd = selectionEnd;
    } else {
        // Set the innerHTML or value
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.value = htmlContent;
        } else {
            element.innerHTML = htmlContent;
        }
    }

    // Restore the original focus state if it was focused before
    if (isFocused) {
        element.focus();
        //element.scrollTop = scrollTop;
        //element.scrollLeft = scrollLeft;
    }
}