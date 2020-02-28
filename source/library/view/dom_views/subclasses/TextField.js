"use strict"

/*

    TextField
    
    A view for a single line of text. 
    For multi-line text, use TextArea.
    
    Behavior:
    On Return/Enter key, it passes focus to the nextResponder/parent.

*/

window.TextField = class TextField extends DomStyledView {
    
    initPrototype () {
        this.newSlot("selectedColor", null)
        this.newSlot("unselectedColor", null)
        this.newSlot("doesClearOnReturn", false)
        this.newSlot("doesHoldFocusOnReturn", false)
        this.newSlot("doesTrim", false)
        this.newSlot("didTextInputNote", null)
        this.newSlot("didTextEditNote", null)
        this.newSlot("doesInput", false)
        this.newSlot("allowsSetStringWhileFocused", false)

        // has to start false for proper state setup
        this.newSlot("usesDoubleTapToEdit", false) 

        this.newSlot("doubleTapGestureRecognizer", null)

        // need to separate from contentEditable since we want to override when usesDoubleTapToEdit is true.
        this.newSlot("isEditable", false)

        this.newSlot("editableBorder", "1px solid rgba(255, 255, 255, 0.2)")
        this.newSlot("uneditableBorder", "none")
        this.newSlot("showsBorderWhenEditable", false)
    }

    init () {
        super.init()
        this.setDisplay("flex")
        this.setJustifyContent("flex-start")
        this.setAlignItems("flex-start")
        this.turnOffUserSelect()
        //this.setWhiteSpace("nowrap")
        this.setWhiteSpace("pre-wrap")
        //this.setWhiteSpace("pre")
        this.setWordWrap("normal")
        this.setOverflow("hidden")
        this.setOverflowWrap("normal")
        this.setTextOverflow("ellipsis")
        this.setWordBreak("keep-all")
        this.setSpellCheck(false)
        this.setMinWidth(10)
        this.setPaddingLeft("0.5em")
        this.setPaddingRight("0.5em")
        this.setPaddingTop("0.1em")
        this.setPaddingBottom("0.1em")
        this.setLineHeight("1.15em")
		
        //this.setUnfocusOnEnterKey(true)
        //this.setIsRegisteredForKeyboard(true) // gets set by setContentEditable()
        this.formatValue()

        //this.setDidTextInputNote(BMNotificationCenter.shared().newNote().setSender(this).setName("didTextInput"))
        //this.setDidTextEditNote(BMNotificationCenter.shared().newNote().setSender(this).setName("didTextEdit"))

        //this.setIsDebugging(true)
        return this
    }

    onFocusIn () {
        super.onFocusIn()
        //console.log(this.typeId() + " '" + this.string() + "' onFocusIn")
        GestureManager.shared().setIsPaused(true)
    }

    onFocusOut () {
        super.onFocusOut()
        //console.log(this.typeId() + " '" + this.string() + "' onFocusOut")
        GestureManager.shared().setIsPaused(false)
    }

    // editing control

    setIsEditable (aBool) {
        if (this._isEditable !== aBool) {
            this._isEditable = aBool
            this.syncEditingControl()
        }
        return this
    }

    
    isEditable () {
        return this._isEditable
    }
    

    setUsesDoubleTapToEdit (aBool) {
        if (this._usesDoubleTapToEdit !== aBool) {
            this._usesDoubleTapToEdit = aBool
            this.syncEditingControl()
        }
        return this
    }

    // double tap gesture

    newDoubleTapGestureRecognizer () { // private
        const tg = TapGestureRecognizer.clone()
        tg.setNumberOfTapsRequired(2)
        tg.setNumberOfFingersRequired(1)
        tg.setCompleteMessage("onDoubleTapComplete")
        //tg.setIsDebugging(true)
        return tg
    }

    doubleTapGestureRecognizer () {
        if (!this._doubleTapGestureRecognizer) {
            this._doubleTapGestureRecognizer = this.newDoubleTapGestureRecognizer()
        }
        return this._doubleTapGestureRecognizer
    }

    syncBorder () {
        let b = this.uneditableBorder()

        if (this.isEditable()) {
            if (this.showsBorderWhenEditable()) {
                b = this.editableBorder()
            }
        }
        this.setBorder(b)
        return this
    }

    syncEditingControl () {
        this.syncBorder()

        if (this.isEditable()) {
            if (this.usesDoubleTapToEdit()) {
                //this.doubleTapGestureRecognizer().start()
                this.addGestureRecognizerIfAbsent(this.doubleTapGestureRecognizer())
                this.setContentEditable(false)
            } else {
                this.setContentEditable(true)
            }
        } else {
            if (this.usesDoubleTapToEdit()) {
                //this.doubleTapGestureRecognizer().stop()
                this.removeGestureRecognizer(this.doubleTapGestureRecognizer())
                this.setDoubleTapGestureRecognizer(null)
            }
            this.setContentEditable(false)
        }

        return this
    }

    onDoubleTapComplete (aGesture) {
        // make content editable and select text
        //this.debugLog(".onDoubleTapComplete()")
        if (this.contentEditable()) {
            //this.setBorder("1px dashed red")
            return this
        }
        this.setContentEditable(true)
        this.focus()
        this.selectAll()
        //this.focus()
        //this.setBorder("1px dashed white")
        return this
    }

    onBlur () {
        super.onBlur()
        //this.debugLog(".onBlur()")
        if (this.usesDoubleTapToEdit()) {
            this.setContentEditable(false)
            this.setBorder("none")
            this.turnOffUserSelect()
        }
    }

    setPxFontSize (aNumber) {
        super.setPxFontSize(aNumber)
        this.setMinAndMaxHeight(aNumber + 2) // make sure TextfField can fit font size
        this.didEdit()
        return this
    }

    setContentEditable (aBool) {
        super.setContentEditable(aBool)
        //this.debugLog(".setContentEditable(" + aBool + ") = ", this.contentEditable())
        //this.setIsRegisteredForClicks(this.contentEditable())  // is this needed after move to tap?
        return this
    }
	
    returnStrings () {
        return ["<div><br></div>", "<br><br>"]
    }
	
    containsReturns () {
        const value = this.value() // correct?
        return returnStrings.detect(returnString => value.contains(returnString))		
    }
	
    // ------------------

    setValue (newValue) {
        return this.setString(newValue)
    }

    value () {
        // this.element().text ?
        return this.string()
    }

    
    setString (newValue) {
        if (newValue === null) {
            newValue = ""
        }

        const oldValue = this.string()
        //let newValue = this.visibleValue()
        if (oldValue !== newValue) {

            if (this.isFocused()) {
                if (this.allowsSetStringWhileFocused()) {
                    super.setString(newValue)
                } 
                //throw new Error("attempt to call TextField.setString while it's focused")

            } else {
                //this.isFocused()
                super.setString(newValue)
            }
            
            /*
            this.debugLog(" setString(")
            console.log("    old: '" + oldValue + "'")
            console.log("    new: '" + newValue + "'")
            console.log("---")
            */
            
        }
        return this
    }
    
	
    // ------------------

    adjustFontSizeWithKeyboard () {
        const kb = BMKeyboard.shared()
        const controlDown   = kb.controlKey().isDown()
        const equalSignDown = kb.equalsSignKey().isDown()
        const minusDown     = kb.minusKey().isDown()

        // adjust font size (testing this out)
        if (controlDown) {
            const fontSize = this.computedFontSize()

            if (equalSignDown) {
                this.setPxFontSize(fontSize + 1)
            } else if (minusDown) {
                if (fontSize > 1) { 
                    this.setPxFontSize(fontSize - 1)
                }
            }
        }
        return this
    }
    
    onKeyUp (event) {
        //this.debugLog(" onKeyUp ", event)
        //this.adjustFontSizeWithKeyboard()
        super.onKeyUp(event)
        //this.debugLog(" onKeyUp value: [" + this.value() + "]")
        this.didEdit()
        return false
    }

    onAlternateEnterKeyUp (event) {
        console.log(this.typeId() + " onAlternateEnterKeyDown")
        //this.insertEnterAtCursor()
        //this.afterEnter()
    }

    insertEnterAtCursor (event) {
        if (this.isFocused()) {
            this.insertTextAtCursor("\n")
        }   
    }

    onKeyDown (event) {
        console.log("event.keyCode = ", event.keyCode)
        
        if (event.keyCode == 13) {
            // insert 2 br tags (if only one br tag is inserted the cursor won't go to the second line)
            document.execCommand('insertHTML', false, '\n\n');
            // prevent the default behaviour of return key pressed
            return false;
        }
        
        return true
    }

    onEnterKeyUp (event) {
        if (!this.doesInput()) {
            //this.insertEnterAtCursor()
            return
        }
	    //this.debugLog(".onEnterKeyUp()")
	    //this.didEdit()

        this.formatValue()
        this.afterEnter()
    }

    afterEnter (event) {
        this.tellParentViews("didInput", this) 
            
        if (!this.doesHoldFocusOnReturn()) {
            //this.debugLog(" calling releaseFirstResponder")
            this.releaseFirstResponder()
        }
        
        if (this.doesClearOnReturn()) {
            this.setInnerHTML("")
            //this.focusAfterDelay(.125) // hack to get focus back after chat view scrolling - TODO: fix this
        }

        if (this.didTextInputNote()) {
            this.didTextInputNote().post()
        }
        
        return false
    }
	
    formatValue () {
	    const oldValue = this.innerHTML()
	    let newValue = this.innerText() // removes returns
        
        if (this.doesTrim()) {
            newValue = newValue.trim()
        } 

        if (true) {
            //newValue.replaceAll("\n", "<br>")
        }
        
        
        if (newValue !== oldValue) {
            this.debugLog("formatValue newValue !== oldValue")
            this.debugLog(" newValue: [" + newValue + "]")
            this.setInnerHTML(newValue)
            this.didEdit()
        }
	    //console.trace(this.type() + " formatValue '" + oldValue + "' -> '" + this.innerHTML() + "'")
        //this.debugLog(" after formatValue: '" + this.innerHTML() + "'")
        return this
    }
    
    /*
    setInput (s) {
        const n = this.node()
        if (n) {
            const m = n.nodeInputFieldMethod()
            if (m) {
                n[m].apply(n, [s])
            }
        }
        return this
    }
    
    */

    activate () {
        this.focus()
        return this
    }

    /*
    setSelectAllOnDoubleClick (aBool) {
        this.setIsRegisteredForClicks(aBool)
        return this
    }

    onDoubleClick (event) {
        this.debugLog(".onDoubleClick()")
        //this.focus()
        this.selectAll() // looses focus!
        this.element().focus()
        //this.focusAfterDelay(.125) 
        return true
    }
    */

    
    onClick (event) {
        // to prevent click-to-edit event from selecting the background row
        //this.debugLog(".onClick()")

        if (this.contentEditable()) {
            this.sendActionToTarget()
            event.stopPropagation()
            return false
        }

        return super.onClick(event)
    }

    didEdit () {
        super.didEdit()
        return this
    }


}.initThisClass()
