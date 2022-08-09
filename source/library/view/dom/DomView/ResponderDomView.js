"use strict";

/*
    ResponderDomView

    Event handling related state and behavior.
    
*/

(class ResponderDomView extends GesturableDomView {
    
    initPrototype () {
        this.newSlot("acceptsFirstResponder", false)
    }

    /*
    init () {
        super.init()
        return this
    }
    */

    // --- focus ---

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

        //this.didEdit() // TODO: should this be conditional?
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

    // ----

    innerText () {
        const e = this.element()
        return e.textContent || e.innerText || "";
    }

    // --- set caret ----

    insertTextAtCursor(text) {
        const savedSelection = this.saveSelection()

        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode( document.createTextNode(text) );
            }
        } else if (document.selection && document.selection.createRange) {
            document.selection.createRange().text = text;
        }
        savedSelection.collapse()
        this.restoreSelection(savedSelection)

        return this
    }

    saveSelection () {
        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                return sel.getRangeAt(0);
            }
        } else if (document.selection && document.selection.createRange) {
            return document.selection.createRange();
        }
        return null;
    }
    
    restoreSelection (range) {
        if (range) {
            if (window.getSelection) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (document.selection && range.select) {
                range.select();
            }
        }
    }

    // --- set caret ----

    moveCaretToEnd () {
        const contentEditableElement = this.element()
        let range, selection;

        if (document.createRange) {
            //Firefox, Chrome, Opera, Safari, IE 9+
            range = document.createRange(); //Create a range (a range is a like the selection but invisible)
            range.selectNodeContents(contentEditableElement); //Select the entire contents of the element with the range
            range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
            selection = window.getSelection(); //get the selection object (allows you to change selection)
            selection.removeAllRanges(); //remove any selections already made
            selection.addRange(range); //make the range you have just created the visible selection
        }
        else if (document.selection) {
            //IE 8 and lower
            range = document.body.createTextRange(); //Create a range (a range is a like the selection but invisible)
            range.moveToElementText(contentEditableElement); //Select the entire contents of the element with the range
            range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
            range.select();//Select the range (make it the visible selection
        }
        return this
    }

    // --- text selection ------------------

    selectAll () {
        if (document.selection) {
            const range = document.body.createTextRange();
            range.moveToElementText(this.element());
            range.select();
        } else if (window.getSelection) {
            const selection = window.getSelection(); 
            const range = document.createRange();
            range.selectNodeContents(this.element());
            selection.removeAllRanges();
            selection.addRange(range);  
        }
    }

    // --- paste from clipboardListener ---

    onPaste (e) {
        // prevent pasting text by default after event
        e.preventDefault();

        const clipboardData = e.clipboardData;
        const rDataHTML = clipboardData.getData("text/html");
        const rDataPText = clipboardData.getData("text/plain");

        const htmlToPlainTextFunc = function (html) {
            const tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || "";
        }

        if (rDataHTML && rDataHTML.trim().length !== 0) {
            this.replaceSelectedText(htmlToPlainTextFunc(rDataHTML))
            return false; // prevent returning text in clipboard
        }

        if (rDataPText && rDataPText.trim().length !== 0) {
            this.replaceSelectedText(htmlToPlainTextFunc(rDataPText))
            return false; // prevent returning text in clipboard
        }
        return true
    }

    // ------------

    replaceSelectedText (replacementText) {
        let range;
        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(replacementText));
            }

            console.log("inserted node")
        } else if (document.selection && document.selection.createRange) {
            range = document.selection.createRange();
            range.text = replacementText;
            console.log("set range.text")
        }

        if (range) {
            // now move the selection to just the end of the range
            range.setStart(range.endContainer, range.endOffset);
        }

        return this
    }

    // untested

    getCaretPosition () {
        const editableElement = this.element()
        let caretPos = 0
        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.rangeCount) {
                const range = sel.getRangeAt(0);
                if (range.commonAncestorContainer.parentNode == editableElement) {
                    caretPos = range.endOffset;
                }
            }
        } else if (document.selection && document.selection.createRange) {
            const range = document.selection.createRange();
            if (range.parentElement() == editableElement) {
                const tempEl = document.createElement("span");
                editableElement.insertBefore(tempEl, editableElement.firstChild);
                const tempRange = range.duplicate();
                tempRange.moveToElementText(tempEl);
                tempRange.setEndPoint("EndToEnd", range);
                caretPos = tempRange.text.length;
            }
        }
        return caretPos;
    }

    setCaretPosition (caretPos) {
        const e = this.element();

        if (e != null) {
            if (e.createTextRange) {
                const range = e.createTextRange();
                range.move("character", caretPos);
                range.select();
            }
            else {
                if (e.selectionStart) {
                    e.focus();
                    e.setSelectionRange(caretPos, caretPos);
                } else {
                    e.focus();
                }
            }
        }
    }

    // ---------------

    clearSelection () {
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        } else if (document.selection) {
            document.selection.empty();
        }
        return this
    }

    // --- css :after :before ---

    setContentAfterOrBeforeString (aString, afterOrBefore) {
        const uniqueClassName = "UniqueClass_" + this.puuid()
        const e = this.element()
        if (e.className.indexOf(uniqueClassName) === -1) {
            const newRuleKey = "DomView" + uniqueClassName + ":" + afterOrBefore
            const newRuleValue = "content: \"" + aString + "\;"
            //console.log("newRule '" + newRuleKey + "', '" + newRuleValue + "'")
            document.styleSheets[0].addRule(newRuleKey, newRuleValue);
            e.className += " " + uniqueClassName
        }
        return this
    }

    setContentAfterString (s) {
        this.setContentAfterOrBeforeString(s, "after")
        return this
    }

    setContentBeforeString (s) {
        this.setContentAfterOrBeforeString(s, "before")
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
