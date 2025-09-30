"use strict";

/*

    TextField
    
    A view for a single line of text. 
    For multi-line text, use TextArea.
    
    Behavior:
    (CURRENTLY DISABLED) On Return/Enter key, it passes focus to the nextResponder/parent. 

    Notes:

*/

(class TextField extends StyledDomView {
    
    initPrototypeSlots () {

        this.newSlot("lastMergeValue", ""); // for merge support
        this.newSlot("isMergeable", false); // for merge support
        this.newSlot("htmlStreamReader", null); // for merge support
        
        this.newSlot("selectedColor", null)
        this.newSlot("unselectedColor", null)
        this.newSlot("doesClearOnReturn", false)
        this.newSlot("doesHoldFocusOnReturn", false)
        this.newSlot("doesTrim", false)
        //this.newSlot("didTextInputNote", null)
        //this.newSlot("didTextEditNote", null)
        this.newSlot("doesInput", false) // if true, enter key does not add return character but does report enter key to delegate
        this.newSlot("allowsHtml", false) // 
        this.newSlot("allowsSetStringWhileFocused", false)

        // has to start false for proper state setup
        this.newSlot("usesDoubleTapToEdit", false) 

        // need to separate from contentEditable since we want to override when usesDoubleTapToEdit is true.
        {
            const slot = this.newSlot("isEditable", false);
            slot.setOwnsSetter(true);
            slot.setDoesHookSetter(true);
        }

        this.newSlot("editableBorder", "1px solid rgba(255, 255, 255, 0.2)")
        this.newSlot("uneditableBorder", "none")
        this.newSlot("showsBorderWhenEditable", false)
        this.newSlot("mutationObserver", null)
        this.newSlot("isMultiline", false)
    }

    init () {
        super.init()
        this.setDisplay("flex")
        this.setJustifyContent("flex-start")
        this.setAlignItems("flex-start")
        this.turnOffUserSelect()
        this.setWhiteSpace("pre-wrap")
        this.setWordWrap("normal")
        this.setOverflow("hidden")
        this.setOverflowWrap("normal")
        this.setTextOverflow("ellipsis")
        this.setWordBreak("keep-all")
        this.setSpellCheck(false)
        this.setMinWidth(10)
        this.setPaddingLeft("0.5em")
        this.setPaddingRight("0.5em")
        this.setPaddingTop("0.3em")
        this.setPaddingBottom("0.3em")
        this.setLineHeight("1.15em")
        //this.setMinHeight("2.07em")
        this.setMinHeight("1em");
        this.setCssProperty("outline", "none");
		
        this.setIsRegisteredForFocus(true) // need this to call unpauseGestures when editing ends

        //this.setUnfocusOnEnterKey(true)
        //this.setIsRegisteredForKeyboard(true) // gets set by setContentEditable()
        //this.formatValue()

        //this.setDidTextInputNote(this.newNoteNamed("didTextInput"))
        //this.setDidTextEditNote(this.newNoteNamed("didTextEdit"))

        this.setIsDebugging(false)
        //this.lockedStyleAttributeSet().add("backgroundColor")
        return this
    }

    setupElement () {
        super.setupElement()
        //this.scheduleRegisterForFocus() // TODO: make this lazy
        return this
    }

    // --- sub-element mutation observer ---

    startMutationObserver () {
        debugger;
        if (!this.mutationObserver()) {
            const config = { 
                subtree: true,
                childList: true, 
                attributes: true, 
                attributeOldValue: true, 
                //characterDataOldValue: true,
                characterData: true
            };

            const obs = new MutationObserver((mutationList, observer) => this.onDomMutation(mutationList, observer));
            obs.observe(this.element(), config);
            this.setMutationObserver(obs)
        }
        return this
    }

    stopMutationObserver () {
        const obs = this.mutationObserver()
        if (obs) {
            obs.disconnect()
            this.setMutationObserver(null)
        }
        return this
    }

    onDomMutation (mutationList, observer) {
     //   console.log("onDomMutation --------------> ", mutationList)

        for(const mutation of mutationList) {
            if (mutation.type === 'characterData') {
                this.onCharacterDataMutation(mutation)
            }
            /*
            if (mutation.type === 'childList') {
                console.log('A child node has been added or removed.');
            }
            else if (mutation.type === 'attributes') {
                console.log('The ' + mutation.attributeName + ' attribute was modified.');
            }
            */
        }
    }

    onCharacterDataMutation (mutation) {
        console.log("onCharacterDataMutation --------------> ", mutation)
    }

    setContentEditable (aBool) {
        super.setContentEditable(aBool)

        /*
        if (aBool) {
            this.startMutationObserver()
        } else {
            this.stopMutationObserver()
        }
        */

        //this.debugLog(".setContentEditable(" + aBool + ") = ", this.contentEditable())
        //this.setIsRegisteredForClicks(this.contentEditable())  // is this needed after move to tap?

        return this
    }

    // ---

    // editing control

    /*
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
    */
    
    didUpdateSlotIsEditable () {
        this.syncEditingControl()
    }

    setUsesDoubleTapToEdit (aBool) {
        if (this._usesDoubleTapToEdit !== aBool) {
            this._usesDoubleTapToEdit = aBool
            this.syncEditingControl()
        }
        return this
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
                //debugger;
                this.addDefaultDoubleTapGesture()
                this.setContentEditable(false)
            } else {
                this.setContentEditable(true)
            }
        } else {
            if (this.usesDoubleTapToEdit()) {
                this.removeDefaultDoubleTapGesture()
            }
            this.setContentEditable(false)
        }

        return this
    }

    onDoubleTapCancelled (aGesture) {
        //console.log(this.value() + " onDoubleTapCancelled")
    }

    onDoubleTapComplete (aGesture) {
        //debugger;
        //console.log(this.value() + " onDoubleTapComplete")
        // make content editable and select text
        //this.debugLog(".onDoubleTapComplete()")
        if (this.contentEditable()) {
            return this
        }

        
        this.setContentEditable(true)
        this.focus()
        this.selectAll()
        this.pauseGestures()

        //this.setBorder("1px dashed white")
        return this
    }

    pauseGestures () {
        GestureManager.shared().pause() // so things like text selection don't trigger gestures
    }

    unpauseGestures () {
        GestureManager.shared().unpause() // so things like text selection don't trigger gestures
    }

    onFocusIn () {
        super.onFocusIn()
        //console.log(this.typeId() + " '" + this.string() + "' onFocusIn")
        if (this.contentEditable()) {
            this.pauseGestures()
        }
    }

    onFocusOut () {
        super.onFocusOut()
        //console.log(this.typeId() + " '" + this.string() + "' onFocusOut")
        this.unpauseGestures() // do we need to check for (!this.contentEditable())?
    }

    blur () {
        //debugger
        //console.log(this.value() + " blur")
        return super.blur()
    }

    onBlur () {
        //console.log(this.value() + " onBlur")
        super.onBlur()
        if (this.usesDoubleTapToEdit()) {
            this.setContentEditable(false)
            this.setBorder("none")
            this.turnOffUserSelect()
        }
        this.unpauseGestures()
    }

    setPxFontSize (aNumber) {
        super.setPxFontSize(aNumber)
        this.setMinAndMaxHeight(aNumber + 2) // make sure TextfField can fit font size
        this.didEdit()
        return this
    }
	
    returnStrings () {
        return ["<div><br></div>", "<br><br>"]
    }
	
    containsReturns () {
        const value = this.value() // correct?
        return returnStrings.canDetect(returnString => value.contains(returnString))		
    }
	
    // ------------------

    setInnerHtml (s) {
        return super.setInnerHtml(s)
    }

    setInnerText (s) {
        return super.setInnerText(s)
    }

    setValue (newValue) {
        if (this.isMergeable()) {
            return this.setValueWithMerge(newValue);
        } else {
            return this.setString(newValue);
        }
    }

    /*
    setValue (newValue) {
        const oldValue = this.string();
        if (newValue !== oldValue) {
            return this.setString(newValue);
        }
    }
    */

    setupHtmlReader () {
        const newReader = HtmlStreamReader.clone();
        newReader.beginHtmlStream();
        this.element().innerHTML = "";
        newReader.beginHtmlStream();
        newReader.rootNode().setDomNode(this.element()); // has to be after begin
        this.setHtmlStreamReader(newReader);
        return this;
    }

    setValueWithMerge (newValue) {

        //const oldValue = this.element().innerHTML;
        const oldValue = this.lastMergeValue();
        if (newValue !== oldValue) {

            if (!this.htmlStreamReader()) {
                this.setupHtmlReader();
            }
            const reader = this.htmlStreamReader();

            debugger;


            const shouldMerge = newValue.length > oldValue.length && newValue.beginsWith(oldValue);
            if (shouldMerge) {
                //console.log("oldValue: [" + oldValue + "]");
                //console.log("newValue: [" + newValue + "]");

                const reader = this.htmlStreamReader();
                const newContent = newValue.after(oldValue);
                reader.onStreamHtml(newContent);
                //console.log("merged: [" + this.element().innerHTML + "]");
            } else {
                // it's incompatible, restart the stream
                reader.endHtmlStream();
                this.element().innerHTML = "";
                reader.onStreamHtml(newValue);
            }
            this.setLastMergeValue(newValue);
        }
        return this;
    }

    value () {
        // this.element().text ?
        return this.string()
    }

    // allowsHtml

    setNewValue (v) { // private method
        if (this.allowsHtml()) {
            this.setInnerHtml(v)
        } else {
            super.setString(v)
        }
        this.setLastMergeValue(v);
        return this
    }
    
    setString (newValue) {
        if (Type.isNullOrUndefined(newValue)) {
            newValue = ""
        }

        if (!Type.isString(newValue)) {
            newValue = newValue.toString()
        }

        const oldValue = this.string()
        //let oldValue = this.visibleValue()
        if (oldValue !== newValue) {

            if (this.isFocused()) {
                if (this.allowsSetStringWhileFocused()) {
                    this.setNewValue(newValue)
                } 
                //throw new Error("attempt to call TextField.setString while it's focused")
            } else {
                //this.isFocused()
                this.setNewValue(newValue)
            }
            
            /*
            console.log(" setString(")
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

    onAlternateEnterKeyUp (event) {
        console.log(this.typeId() + " onAlternateEnterKeyDown")
        //this.insertEnterAtCursor()
        //this.afterEnter()
    }

    insertEnterAtCursor (event) {
        if (this.isFocused()) {
            //this.insertTextAtCursor("\n")
            this.insertTextAtCursorSimple("\n")
            this.placeCaretAtEnd()
        }   
    }

    onKeyDown (event) {
        let result = super.onKeyDown(event)
        const returnKeyCode = 13 // return key
        //const keyName = BMKeyboard.shared().keyForEvent(event)
        //console.log(this.debugTypeId() + " onKeyDown event.keyCode = ", event.keyCode)

        //if (this.isMultiline() && this.doesInput())


        if (event.keyCode === returnKeyCode) {
            const isSingleLine = !this.isMultiline()
            // block return key down if it's a single line text field (or if in input mode aka send onInput note on enter key up)
            // this still allows return up key event
            if (isSingleLine || this.doesInput()) {
                event.preventDefault()
            }
        }

        return true
    }
    
    onKeyUp (event) {
        let result = super.onKeyUp(event)
        this.didEdit()

        //event.preventDefault()
       // return result

        //console.log(this.debugTypeId() + " onKeyUp event.keyCode = ", event.keyCode)
        //this.debugLog(" onKeyUp value: [" + this.value() + "]")

        /*
        if (this.isContentEditable()) {
            return false // stop propogation
        }
        */
        if (this.doesInput()) {
            //this.insertEnterAtCursor()
            return true // prevent default
        }

        return false
    }
    
    
    onEnterKeyDown (event) {    
        // insert 2 returns as cursor won't go to the second line with 1
        // document.execCommand('insertHTML', false, "\n\n");
        // prevent the default behaviour of return key pressed
        return false;
    }

    onEnterKeyUp (event) {
        if (!this.isContentEditable()) {
            return 
        }
        
	    //this.debugLog(".onEnterKeyUp()")
	    //this.didEdit()

        this.formatValue()
        this.afterEnter()

        if (this.doesInput()) {
            //this.insertEnterAtCursor()
            return false
        }
    }

    // Alt Enter

    onAlternateEnterKeyDown (event) {
        if (this.doesInput() && this.isMultiline()) {
            this.insertTextAtCursorAndConsolidate("\n")
            //this.formatValue()
        }
    }

    onEscapeKeyDown (event) {
        this.releaseFirstResponder()
        event.stopPropagation()
        return false
    }

    afterEnter (event) {
        this.tellParentViews("didInput", this) 
            
        if (!this.doesHoldFocusOnReturn()) {
            this.releaseFirstResponder()
        }
        
        if (this.doesClearOnReturn()) {
            this.setTextContent("")
            //this.setInnerHtml("")
            //this.focusAfterDelay(.125) // hack to get focus back after chat view scrolling - TODO: fix this
        }

        /*
        if (this.didTextInputNote()) {
            this.didTextInputNote().post()
        }
        */
        
        if (event) {
            event.stopPropagation()
        }

        return false
    }
	
    formatValue () {
        this.setTextContent(this.textContent()) // removes formatting?
        /*
	    const oldValue = this.innerHtml()
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
            this.setInnerHtml(newValue)
            this.didEdit()
        }
        */
	    //console.trace(this.svType() + " formatValue '" + oldValue + "' -> '" + this.innerHtml() + "'")
        //this.debugLog(" after formatValue: '" + this.innerHtml() + "'")
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

    setThemeClassName (aName) {
        if (this.themeClassName() === "FieldKey") {
            debugger;
        }

        super.setThemeClassName(aName)
        if (aName === "FieldKey") {
            assert(this.themeClassName() === "FieldKey")
        }
         return this
    }

    applyStyles () {
        /*
        if (this.themeClassName() === "FieldKey") {
            debugger;
        }
        */
        super.applyStyles()
        return this
    }

    activate () {
        if (this.usesDoubleTapToEdit()) {
            this.onDoubleTapComplete()
        } else {
            this.focus()
        }
        return this
    }
    
    onClick (event) {
        // needed to prevent click-to-edit event from selecting the background row
        //this.debugLog(".onClick()")

        if (this.contentEditable()) {
            this.sendActionToTarget()
            event.stopPropagation()
            return false
        }

        return super.onClick(event)
    }
    
    setBorder (v) {
        /*
        if (this.value() === "a") {
            console.log("break")
        }
        */
        return super.setBorder(v)
    }

    setBackgroundColor (aColor) {
        super.setBackgroundColor(aColor)
        return this
    }

    // --- speech to text input -----------------------------------------------------------------------

    onAlternate_l_KeyDown (event) {
        if (this.hasFocus()) {
            if (!event.repeat) {
                this.startSpeechToText()
            }
            event.stopPropagation();
            event.preventDefault();
            //return true
        }
    }

    onAlternate_l_KeyUp (event) {
        if (this.hasFocus()) {
            this.stopSpeechToText()
            event.stopPropagation();
        } else {
            debugger;
        }
    }

    startSpeechToText () {
        console.log("=== start speech to text ===")
        if (this._speechSession) {
            this._speechSession.stop()
            this._speechSession = null
        }

        // TODO: add visual indicator?
        if (!this._speechSession) {
            if (SvGlobals.globals()["SpeechToTextSession"]) {
                this._speechSession = SpeechToTextSession.clone().setDelegate(this)
                //debugger
                this._speechSession.start()
            } else {
                console.warn("no SpeechToTextSession class available")
            }
        }
    }

    onSpeechInterimResult (speechSession) {
        //const s = speechSession.intermFullTranscript()
        const s = speechSession.fullTranscript()
        //console.log("onSpeechInterimResult intermFullTranscript: '" + s + "'")
        //this.insertTextAtCursorSimple(s)
    }

    onSpeechEnd (speechSession) {
        const s = speechSession.fullTranscript()
        console.log("onSpeechEnd full: '" + s + "'")
        this.insertTextAtCursorSimple(s)
        this._speechSession = null
    }

    stopSpeechToText () {
        console.log("==== stop speech to text ====") 
        // TODO: add visual indicator?
        const speech = this._speechSession
        if (speech) {
            speech.stop()
        }
    }

    // --- arrow key defaults disabled while editing ---

    onUpArrowKeyDown (event) { // why down and not up?
        if (this.isFocused()) { 
            return false
        }
        
        return super.onUpArrowKeyDown(event)
    }
	
    onDownArrowKeyDown (event) { // why down and not up?
        if (this.isFocused()) { 
            return false
        }

        return super.onDownArrowKeyDown(event)
    }
	
    onLeftArrowKeyUp (event) {
        if (this.isFocused()) { 
            return false
        }
        
        return super.onLeftArrowKeyUp(event)
    }
	
    onRightArrowKeyUp (event) {
        if (this.isFocused()) { 
            return false
        }
        
        return super.onRightArrowKeyUp(event)
    }

}.initThisClass());



// --- experimental DOM merge support ----
// TODO: move to ideal if useful

/*
    nodeTypes:

{
  "1": "ELEMENT_NODE",
  "2": "ATTRIBUTE_NODE",
  "3": "TEXT_NODE",
  "4": "CDATA_SECTION_NODE",
  "5": "ENTITY_REFERENCE_NODE",
  "6": "ENTITY_NODE",
  "7": "PROCESSING_INSTRUCTION_NODE",
  "8": "COMMENT_NODE",
  "9": "DOCUMENT_NODE",
  "10": "DOCUMENT_TYPE_NODE",
  "11": "DOCUMENT_FRAGMENT_NODE",
  "12": "NOTATION_NODE"
}

*/

assert(HTMLElement.prototype.clone === undefined);

HTMLElement.prototype.clone = function () {
    const newNode = document.createElement(this.tagName);
    Array.from(this.attributes).forEach(attr => {
        newNode.setAttribute(attr.name, attr.value);
    });
    newNode.innerHTML = this.innerHTML;
    return newNode
};

HTMLElement.prototype.mergeFrom = function (remoteElement) {
    if (this.innerHTML === remoteElement.innerHTML) {
        return;
    }

    if (!(remoteElement instanceof HTMLElement)) {
        throw new Error('remoteElement must be an instance of HTMLElement');
    }

    //console.log("         this.innerHTML: " + this.innerHTML);
    //console.log("remoteElement.innerHTML: " + remoteElement.innerHTML);

    const localChildNodes = Array.from(this.childNodes);
    const remoteChildNodes = Array.from(remoteElement.childNodes);

    // walk through the source
    assert(localChildNodes.length <= remoteChildNodes.length);

    for (let i = 0; i < remoteChildNodes.length; i++) {
        //debugger;

        const remoteChildNode = remoteChildNodes[i];
        
        if (i < localChildNodes.length) {
            let localChildNode = localChildNodes[i];

            // special case for cut of tags
            if (i === localChildNodes.length -1 && localChildNode.nodeType === Node.TEXT_NODE && remoteChildNode.nodeType !== Node.TEXT_NODE) {
                // this can happen if last string ended on an incomplete tag e.g. "...<"
                this.removeChild(localChildNode);
                assert(remoteChildNode.nodeType === Node.ELEMENT_NODE);
                localChildNode = remoteChildNode.clone();
                this.appendChild(localChildNode);
            }

            assert(localChildNode.nodeType === remoteChildNode.nodeType);

            // handle children already present
            switch (localChildNode.nodeType) {
                case Node.ELEMENT_NODE:
                    assert(localChildNode.tagName === remoteChildNode.tagName);
                    assert(localChildNode.className === remoteChildNode.className);
                    localChildNode.mergeFrom(remoteChildNode);
                    break;
                case Node.TEXT_NODE:
                    localChildNode.textContent = remoteChildNode.textContent;
                    break;
                default:
                    throw new Error("unhandled node type " + localChildNode.nodeType);
            }

        } else {
            // handle new children
            switch (remoteChildNode.nodeType) {
                case Node.ELEMENT_NODE:
                    this.appendChild(remoteChildNode.clone());
                    break;
                case Node.TEXT_NODE:
                    const newTextNode = document.createTextNode(remoteChildNode.textContent);
                    this.appendChild(newTextNode);
                    break;
                default:
                    throw new Error("unhandled node type " + localChildNode.nodeType);
            }
        }
    }
};

HTMLElement.prototype.findElementWithTextContent = function (textContent) {
    const children = Array.from(this.childNodes);

    for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (child.textContent === textContent) {
            return child;
        }

        if (child.textContent.trim() === textContent) {
            console.warn("WARNING: findElementWithTextContent non exact match for [" + textContent.clipWithEllipse(15) + "]");
            return child;
        }

        if (child.nodeType === Node.ELEMENT_NODE) {
            const match = child.findElementWithTextContent(textContent);
            if (match) {
                return match;
            }
        }
    }

    return null;
}