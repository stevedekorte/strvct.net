"use strict";

/**
 * @module library.view.dom.DomView.subclasses
 * @class TextField
 * @extends StyledDomView
 * @description A view for a single line of text. 
 * For multi-line text, use TextArea.
 * On input, sends didEdit up parent view chain.
 * This typically goes to a SvFieldTile.onDidEdit(changedView) which sends this.scheduleSyncToNode().
 * Behavior:
 * (CURRENTLY DISABLED) On Return/Enter key, it passes focus to the nextResponder/parent. 
 * 
 */

(class TextField extends StyledDomView {
    
    initPrototypeSlots () {

        /**
         * @member {String} lastMergeValue
         * @description The last merge value.
         */
        {
            const slot = this.newSlot("lastMergeValue", null); // for merge support
            slot.setSlotType("String");
        }
        /**
         * @member {Boolean} isMergeable
         * @description Whether the text field is mergeable.
         */
        {
            const slot = this.newSlot("isMergeable", false); // for merge support
            slot.setSlotType("Boolean");
        }

        /**
         * @member {HtmlStreamReader} htmlStreamReader
         * @description The HTML stream reader.
         */
        {
            const slot = this.newSlot("htmlStreamReader", null); // for merge support
            slot.setSlotType("HtmlStreamReader");
        }
        
        /**
         * @member {String} selectedColor
         * @description The selected color.
         */
        {
            const slot = this.newSlot("selectedColor", null);
            slot.setSlotType("String");
        }

        /**
         * @member {String} unselectedColor
         * @description The unselected color.
         */
        {
            const slot = this.newSlot("unselectedColor", null);
            slot.setSlotType("String");
        }

        /**
         * @member {Boolean} doesClearOnReturn
         * @description Whether the text field clears on return.
         */
        {
            const slot = this.newSlot("doesClearOnReturn", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} doesHoldFocusOnReturn
         * @description Whether the text field holds focus on return.
         */
        {
            const slot = this.newSlot("doesHoldFocusOnReturn", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} doesTrim
         * @description Whether the text field trims.
         */
        {
            const slot = this.newSlot("doesTrim", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} doesInput
         * @description Whether the text field does input.
         */
        {
            const slot = this.newSlot("doesInput", false);
            slot.setSlotType("Boolean");
        }

        /*
            const slot = this.newSlot("didTextInputNote", null)
            const slot = this.newSlot("didTextEditNote", null)
        */

        /**
         * @member {Boolean} canHitEnter
         * @description Whether the text field can hit enter.
         */
        {
            const slot = this.newSlot("canHitEnter", false); // if true, enter key does not add return character but does report enter key to delegate
            slot.setOwnsSetter(true);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Boolean");
        }
        
        /**
         * @member {Boolean} doesMuteEnter
         * @description Whether the text field does mute enter.
         */
        {
            const slot = this.newSlot("doesMuteEnter", false); // if true, enter key is muted and opacity is reduced
            slot.setOwnsSetter(true);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} allowsHtml
         * @description Whether the text field allows html.
         */
        {
            const slot = this.newSlot("allowsHtml", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} allowsSetStringWhileFocused
         * @description Whether the text field allows set string while focused.
         */
        {
            const slot = this.newSlot("allowsSetStringWhileFocused", false);
            slot.setSlotType("Boolean");
        }

        // has to start false for proper state setup

        /**
         * @member {Boolean} usesDoubleTapToEdit
         * @description Whether the text field uses double tap to edit.
         */
        {
            const slot = this.newSlot("usesDoubleTapToEdit", false) ;
            slot.setSlotType("Boolean");
        }

        // need to separate from contentEditable since we want to override when usesDoubleTapToEdit is true.
        /**
         * @member {Boolean} isEditable
         * @description Whether the text field is editable.
         */
        {
            const slot = this.newSlot("isEditable", false);
            slot.setOwnsSetter(true);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {String} editableBorder
         * @description The editable border.
         */
        {
            const slot = this.newSlot("editableBorder", "1px solid rgba(255, 255, 255, 0.2)");
            slot.setSlotType("String");
        }

        /**
         * @member {String} uneditableBorder
         * @description The uneditable border.
         */
        {
            const slot = this.newSlot("uneditableBorder", "none");
            slot.setSlotType("String");
        }

        /**
         * @member {Boolean} showsBorderWhenEditable
         * @description Whether the text field shows border when editable.
         */
        {
            const slot = this.newSlot("showsBorderWhenEditable", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {MutationObserver} mutationObserver
         * @description The mutation observer.
         */
        {
            const slot = this.newSlot("mutationObserver", null);
            slot.setSlotType("MutationObserver");
        }

        /**
         * @member {Boolean} isMultiline
         * @description Whether the text field is multiline.
         */
        {
            const slot = this.newSlot("isMultiline", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} onBlurSelection
         * @description Whether the text field on blur selection.
         */
        {
            const slot = this.newSlot("onBlurSelection", null);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {String} placeholderText
         * @description The placeholder text.
         */
        {
            const slot = this.newSlot("placeholderText", null);
            slot.setSlotType("String");
        }

    }

    init () {
        super.init();
        this.setDisplay("flex");
        this.setJustifyContent("flex-start");
        this.setAlignItems("flex-start");
        this.turnOffUserSelect();
        this.setWhiteSpace("pre-wrap");
        this.setWordWrap("normal");
        this.setOverflow("hidden");
        this.setOverflowWrap("normal");
        this.setTextOverflow("ellipsis");
        this.setWordBreak("keep-all");
        this.setSpellCheck(false);
        this.setMinWidth(10);
        this.setPaddingLeft("0.5em");
        this.setPaddingRight("0.5em");
        this.setPaddingTop("0.3em");
        this.setPaddingBottom("0.3em");
        this.setLineHeight("1.15em");;
        //this.setMinHeight("2.07em");
        this.setMinHeight("1em");
        this.setCssProperty("outline", "none");
		
        this.setIsRegisteredForFocus(true); // need this to call unpauseGestures when editing ends

        //this.setUnfocusOnEnterKey(true);
        //this.setIsRegisteredForKeyboard(true); // gets set by setContentEditable()
        //this.formatValue();

        //this.setDidTextInputNote(this.newNoteNamed("didTextInput"));
        //this.setDidTextEditNote(this.newNoteNamed("didTextEdit"));

        this.setIsDebugging(false);
        //this.lockedStyleAttributeSet().add("backgroundColor");
        this.selectListener().setIsListening(true);
        return this;
    }

    /**
     * @description Sets up the element.
     * @returns {TextField} The text field.
     */
    setupElement () {
        super.setupElement();
        //this.scheduleRegisterForFocus(); // TODO: make this lazy
        return this;
    }

    // --- sub-element mutation observer ---

    /**
     * @description Starts the mutation observer.
     * @returns {TextField} The text field.
     */
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
            this.setMutationObserver(obs);
        }
        return this;
    }

    /**
     * @description Stops the mutation observer.
     * @returns {TextField} The text field.
     */
    stopMutationObserver () {
        const obs = this.mutationObserver();
        if (obs) {
            obs.disconnect();
            this.setMutationObserver(null);
        }
        return this;
    }

    /**
     * @description Handles the DOM mutation.
     * @param {MutationRecord[]} mutationList - The mutation list.
     * @param {MutationObserver} observer - The observer.
     * @returns {void}
     */
    onDomMutation (mutationList, observer) {
     //   console.log("onDomMutation --------------> ", mutationList);

        for(const mutation of mutationList) {
            if (mutation.type === 'characterData') {
                this.onCharacterDataMutation(mutation);
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

    /**
     * @description Handles the character data mutation.
     * @param {MutationRecord} mutation - The mutation.
     * @returns {void}
     */
    onCharacterDataMutation (mutation) {
        console.log("onCharacterDataMutation --------------> ", mutation);
    }

    /**
     * @description Sets the content editable.
     * @param {Boolean} aBool - The boolean.
     * @returns {TextField} The text field.
     */
    setContentEditable (aBool) {
        super.setContentEditable(aBool);

        /*
        if (aBool) {
            this.startMutationObserver();
        } else {
            this.stopMutationObserver();
        }
        */

        //this.debugLog(".setContentEditable(" + aBool + ") = ", this.contentEditable());
        //this.setIsRegisteredForClicks(this.contentEditable());  // is this needed after move to tap?

        return this;
    }

    // ---

    // editing control

    /*
    setIsEditable (aBool) {
        if (this._isEditable !== aBool) {
            this._isEditable = aBool;
            this.syncEditingControl();
        }
        return this;
    }

    
    isEditable () {
        return this._isEditable;
    }
    */
    
    /**
     * @description Did update slot does input.
     * @returns {void}
     */
    didUpdateSlotDoesInput () {
        this.syncEditingControl();
    }

    /**
     * @description Did update slot can hit enter.
     * @returns {void}
     */
    didUpdateSlotCanHitEnter () {
        this.syncEditingControl();
    }
    
    /**
     * @description Did update slot is editable.
     * @returns {void}
     */
    didUpdateSlotIsEditable () {
        this.syncEditingControl();
    }

    /**
     * @description Sets the uses double tap to edit.
     * @param {Boolean} aBool - The boolean.
     * @returns {TextField} The text field.
     */
    setUsesDoubleTapToEdit (aBool) {
        if (this._usesDoubleTapToEdit !== aBool) {
            this._usesDoubleTapToEdit = aBool;
            this.syncEditingControl();
        }
        return this;
    }

    /**
     * @description Syncs the border.
     * @returns {TextField} The text field.
     */
    syncBorder () {
        let b = this.uneditableBorder();

        if (this.isEditable()) {
            if (this.showsBorderWhenEditable()) {
                b = this.editableBorder();
            }
        }
        this.setBorder(b);
        return this;
    }

    /**
     * @description Syncs the placeholder text.
     * @returns {TextField} The text field.
     */
    syncPlaceholderText () {
        const pt = this.placeholderText();
        if (pt && pt.length > 0) {
            //debugger;
            this.element().setAttribute('data-placeholder', pt);
            assert(this.element().getAttribute('data-placeholder') === pt);
        } else {
            this.element().removeAttribute('data-placeholder');
        }
        return this;
    }

    /**
     * @description Syncs the editing control.
     * @returns {TextField} The text field.
     */
    syncEditingControl () {
        this.syncBorder();
        this.syncPlaceholderText();

        if (this.isEditable()) {
            if (this.usesDoubleTapToEdit()) {
                //debugger;
                this.addDefaultDoubleTapGesture();
                this.setContentEditable(false);
            } else {
                this.setContentEditable(true);
            }
        } else {
            if (this.usesDoubleTapToEdit()) {
                this.removeDefaultDoubleTapGesture();
            }
            this.setContentEditable(false);
        }

        if (this.doesInput() && !this.canHitEnter()) {
            this.setOpacity(0.5);
            this.setFontStyle("italic");
        } else {
            this.setOpacity(1);
            this.setFontStyle("normal");
            //this.rgba().setAlpha(1);
            //this.setColor("rgba(0, 0, 0, 0.5)");
        }

        return this;
    }


    /**
     * @description On double tap cancelled.
     * @param {GestureRecognizer} aGesture - The gesture.
     * @returns {void}
     */
    onDoubleTapCancelled (aGesture) {
        //console.log(this.value() + " onDoubleTapCancelled");
    }

    /**
     * @description On double tap complete.
     * @param {GestureRecognizer} aGesture - The gesture.
     * @returns {TextField} The text field.
     */
    onDoubleTapComplete (aGesture) {
        //debugger;
        //console.log(this.value() + " onDoubleTapComplete");
        // make content editable and select text
        //this.debugLog(".onDoubleTapComplete()");
        if (this.contentEditable()) {
            return this;
        }

        
        this.setContentEditable(true);
        this.focus();
        this.selectAll();
        this.pauseGestures();

        //this.setBorder("1px dashed white");
        return this;
    }

    /**
     * @description Pauses the gestures.
     * @returns {void}
     */
    pauseGestures () {
        GestureManager.shared().pause(); // so things like text selection don't trigger gestures
    }

    /**
     * @description Unpauses the gestures.
     * @returns {void}
     */
    unpauseGestures () {
        GestureManager.shared().unpause(); // so things like text selection don't trigger gestures
    }

    // --- onFocusIn / onFocusOut ---

    /**
     * @description On focus in.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onFocusIn (event) {
        // sent before focus and bubbles up the parent chain

        super.onFocusIn();
        //console.log(this.typeId() + " '" + this.string() + "' onFocusIn")
        if (this.contentEditable()) {
            this.pauseGestures();
        }
    }

    /**
     * @description On focus out.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onFocusOut (event) {
        // sent before blur
        //console.log("'" + this.textContent().substring(0, 10) + "...'.onFocusOut()")
        //const isFocused = this.isActiveElementAndEditable();
        this.storeSelectionRange();

        super.onFocusOut();
        //console.log(this.typeId() + " '" + this.string() + "' onFocusOut")
        this.unpauseGestures(); // do we need to check for (!this.contentEditable())?
    }

    // --- onFocus / onBlur ---

    /**
     * @description On focus.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onFocus (event) {
       // console.log("'" + this.textContent().substring(0, 20) + "...'.onFocus()");
        if (this.onBlurSelection()) {
            this.restoreSelectionRange();
        } else {
            //console.log("--- NO blur selection ---");
        }
    }

    /**
     * @description Blurs the text field.
     * @returns {TextField} The text field.
     */
    blur () {
        //debugger;
        //console.log(this.value() + " blur");
        return super.blur();
    }

    /**
     * @description On blur.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onBlur (event) {
        super.onBlur();
        if (this.usesDoubleTapToEdit()) {
            this.setContentEditable(false);
            this.setBorder("none");
            this.turnOffUserSelect();
        }
        this.unpauseGestures();
    }

    // --------------------------------

    /**
     * @description Sets the pixel font size.
     * @param {Number} aNumber - The number.
     * @returns {TextField} The text field.
     */
    setPxFontSize (aNumber) {
        super.setPxFontSize(aNumber);
        this.setMinAndMaxHeight(aNumber + 2); // make sure TextfField can fit font size
        this.didEdit();
        return this;
    }
	
    /**
     * @description Returns the strings that can detect returns.
     * @returns {Array} The strings.
     */
    returnStrings () {
        return ["<div><br></div>", "<br><br>"];
    }
	
    /**
     * @description Checks if the text field contains returns.
     * @returns {Boolean} True if it contains returns, false otherwise.
     */
    containsReturns () {
        const value = this.value(); // correct?
        return returnStrings.canDetect(returnString => value.contains(returnString));	
    }
	
    // ------------------

    /**
     * @description Sets the inner HTML.
     * @param {String} s - The string.
     * @returns {TextField} The text field.
     */
    setInnerHtml (s) {
        return super.setInnerHtml(s);
    }

    /**
     * @description Sets the inner text.
     * @param {String} s - The string.
     * @returns {TextField} The text field.
     */
    setInnerText (s) {
        return super.setInnerText(s);
    }

    /**
     * @description Sets the value.
     * @param {String} newValue - The new value.
     * @returns {TextField} The text field.
     */
    setValue (newValue) {
        newValue = this.cleanseNewValue(newValue);

        if (this.isMergeable()) {
            this.setValueWithMerge(newValue);
        } else {
            this.setString(newValue);
        }

        /*
        if (this.innerHtml() !== newValue) {
            debugger;
        }
        */
        return this;
    }

    /*
    setValue (newValue) {
        const oldValue = this.string();
        if (newValue !== oldValue) {
            return this.setString(newValue);
        }
    }
    */

    /**
     * @description Sets the value with merge.
     * @param {String} newValue - The new value.
     * @returns {TextField} The text field.
     */
    setValueWithMerge (newValue) {
        //const oldValue = this.element().innerHTML;
        let oldValue = this.lastMergeValue();
        const needsMerge = (oldValue === null) || (newValue !== oldValue); // to cover case of lastMergeValue never being set, but element has content
        if (oldValue === null) {
            oldValue = "";
        }
        if (needsMerge) {
            //const mergeableChange = (oldValue.length !== 0) && (newValue.length > oldValue.length);
            const mergeableChange = (newValue.length > oldValue.length);
            //const shouldMerge = mergeableChange && newValue.beginsWith(oldValue);
            const shouldMerge = newValue.beginsWith(oldValue);
            if (shouldMerge) {
                /*
                console.log("---- begin HTML merge ----");
                console.log("oldValue: [" + oldValue + "]");
                console.log("newValue: [" + newValue + "]");
                */

                const reader = HtmlStreamReader.clone(); // TODO: cache this for efficiency, release whenever shouldMerge is false
                reader.beginHtmlStream();
                reader.onStreamHtml(newValue);
                reader.endHtmlStream();
                this.element().mergeFrom(reader.rootElement());
                //console.log("merged: [" + this.element().innerHTML + "]");
                //console.log("---- end HTML merge ----");
            } else {
                 this.setString(newValue);
            }
            this.setLastMergeValue(newValue);
        }
        return this;
    }

    /**
     * @description Returns the value.
     * @returns {String} The value.
     */
    value () {
        // this.element().text ?
        return this.string();
    }

    // allowsHtml

    /**
     * @description Sets the new value.
     * @param {String} v - The value.
     * @returns {TextField} The text field.
     */
    setNewValue (v) { // private method
        //console.log("setNewValue(" + v.substring(0, 10) + "...)");
        if (this.allowsHtml()) {
            this.setInnerHtml(v);
        } else {
            super.setString(v);
        }
        this.setLastMergeValue(v);;
        return this;
    }

    /**
     * @description Cleanses the new value.
     * @param {String} newValue - The new value.
     * @returns {String} The cleansed value.
     */
    cleanseNewValue (newValue) {
        if (Type.isNullOrUndefined(newValue)) {
            newValue = "";
        }

        if (!Type.isString(newValue)) {
            newValue = newValue.toString();
        }

        return newValue;
    }
    
    /**
     * @description Sets the string.
     * @param {String} newValue - The new value.
     * @returns {TextField} The text field.
     */
    setString (newValue) {
        newValue = this.cleanseNewValue(newValue);

        const oldValue = this.string();
        //let oldValue = this.visibleValue();
        if (oldValue !== newValue) {

            if (this.isFocused()) {
                //if (this.allowsSetStringWhileFocused()) {
                    //this.blur();
                    this.setNewValue(newValue);
                    //this.focus();
                //} 
                //throw new Error("attempt to call TextField.setString while it's focused");
            } else {
                //this.isFocused();
                this.setNewValue(newValue);
            }
            
            /*
            console.log(" setString(");
            console.log("    old: '" + oldValue + "'");
            console.log("    new: '" + newValue + "'");
            console.log("---");
            */            
        }
        return this;
    }

    // ------------------

    /**
     * @description Adjusts the font size with keyboard.
     * @returns {TextField} The text field.
     */
    adjustFontSizeWithKeyboard () {
        const kb = SvKeyboard.shared();
        const controlDown   = kb.controlKey().isDown();
        const equalSignDown = kb.equalsSignKey().isDown();
        const minusDown     = kb.minusKey().isDown();

        // adjust font size (testing this out);
        if (controlDown) {
            const fontSize = this.computedFontSize();

            if (equalSignDown) {
                this.setPxFontSize(fontSize + 1);
            } else if (minusDown) {
                if (fontSize > 1) { 
                    this.setPxFontSize(fontSize - 1);
                }
            }
        }
        return this;
    }

    /**
     * @description On alternate enter key up.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onAlternateEnterKeyUp (event) {
        console.log(this.typeId() + " onAlternateEnterKeyDown");
        //this.insertEnterAtCursor();
        //this.afterEnter();
    }

    /**
     * @description Inserts an enter at cursor.
     * @param {Event} event - The event.
     * @returns {void}
     */
    insertEnterAtCursor (event) {
        if (this.isFocused()) {
            //this.insertTextAtCursor("\n");
            this.insertTextAtCursorSimple("\n");
            this.placeCaretAtEnd();
        }   
    }

    /**
     * @description Checks if the text field is single line.
     * @returns {Boolean} True if it is single line, false otherwise.
     */
    isSingleLine () {
        return !this.isMultiline();
    }

    /**
     * @description Should mute event.
     * @param {Event} event - The event.
     * @returns {Boolean} True if it should mute, false otherwise.
     */
    shouldMuteEvent (event) {
        const returnKeyCode = 13; // return key

        if (event.keyCode === returnKeyCode) {
            // block return key down if it's a single line text field (or if in input mode aka send onInput note on enter key up)
            // this still allows return up key event
            if (this.isSingleLine() || this.doesInput()) {
                return true;
            }
        }
        return false;
    }


    /**
     * @description On key down.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onKeyDown (event) {
        // sent before the content is changed
        let result = super.onKeyDown(event);
        //const keyName = SvKeyboard.shared().keyForEvent(event);
        //console.log(this.debugTypeId() + " onKeyDown event.keyCode = ", event.keyCode);

        if (this.shouldMuteEvent(event)) {
            event.preventDefault();
        }

        return true;
    }

    /**
     * @description On input.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onInput (event) {
        // sent after the content is changed
        const returnKeyCode = 13; 

        if (!this.shouldMuteEvent(event)) {
            this.didEdit(); // we muted the return key down event so content is not changed
            // this is to avoid sending didEdit after didInput
        }

        //event.preventDefault();
        //return result;

        //console.log(this.debugTypeId() + " onKeyUp event.keyCode = ", event.keyCode)
        //this.debugLog(" onKeyUp value: [" + this.value() + "]")

        if (this.doesInput()) {
            event.preventDefault();
            //this.insertEnterAtCursor();
            return true; // prevent default
        }
        return false;
    }
    
    /**
     * @description On key up.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onKeyUp (event) {
        super.onKeyUp(event);
        return false;
    }
    
    
    /**
     * @description On enter key down.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onEnterKeyDown (event) {    
        // insert 2 returns as cursor won't go to the second line with 1
        // document.execCommand('insertHTML', false, "\n\n");
        // prevent the default behaviour of return key pressed
        return false;
    }

    /**
     * @description On enter key up.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onEnterKeyUp (event) {
        if (!this.isContentEditable()) {
            return;
        }
        
	    //this.debugLog(".onEnterKeyUp()");
	    //this.didEdit();

        this.formatValue();
        this.afterEnter();

        if (this.doesInput()) {
            //this.insertEnterAtCursor();
            return false;
        }
    }

    // Alt Enter

    /**
     * @description On alternate enter key down.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onAlternateEnterKeyDown (event) {
        if (this.doesInput() && this.isMultiline()) {
            this.insertTextAtCursorAndConsolidate("\n");
            //this.formatValue();
        }
    }

    /**
     * @description On escape key down.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onEscapeKeyDown (event) {
        this.releaseFirstResponder();
        event.stopPropagation();
        return false;
    }

    /**
     * @description After enter.
     * @param {Event} event - The event.
     * @returns {void}
     */
    afterEnter (event) {

        if (this.doesInput()) {
            if (this.canHitEnter()) {
                this.tellParentViews("didInput", this);
            } else {
                SimpleSynth.clone().playButtonCancelled();
                return;
            }
        }

        //this.tellParentViews("didInput", this);
            
        if (!this.doesHoldFocusOnReturn()) {
            this.releaseFirstResponder();
        }
        
        if (this.doesClearOnReturn()) {
            this.setTextContent("");
            //this.setInnerHtml("");
            //this.focusAfterDelay(.125); // hack to get focus back after chat view scrolling - TODO: fix this
        }

        /*
        if (this.didTextInputNote()) {
            this.didTextInputNote().post();
        }
        */
        
        if (event) {
            event.stopPropagation();
        }

        return false;
    }
	
    /**
     * @description Format value.
     * @returns {TextField} The text field.
     */
    formatValue () {
        this.setTextContent(this.textContent()); // removes formatting?
        /*
	    const oldValue = this.innerHtml();
	    let newValue = this.innerText(); // removes returns
        
        if (this.doesTrim()) {
            newValue = newValue.trim();
        } 

        if (true) {
            //newValue.replaceAll("\n", "<br>");
        }
        
        if (newValue !== oldValue) {
            this.debugLog("formatValue newValue !== oldValue");
            this.debugLog(" newValue: [" + newValue + "]");
            this.setInnerHtml(newValue);
            this.didEdit();
        }
        */
	    //console.trace(this.type() + " formatValue '" + oldValue + "' -> '" + this.innerHtml() + "'")
        //this.debugLog(" after formatValue: '" + this.innerHtml() + "'");
        return this;
    }
    
    /*
    setInput (s) {
        const n = this.node();
        if (n) {
            const m = n.nodeInputFieldMethod();
            if (m) {
                n[m].apply(n, [s]);
            }
        }
        return this;
    }
    */

    /**
     * @description Set theme class name.
     * @param {String} aName - The name.
     * @returns {TextField} The text field.
     */
    setThemeClassName (aName) {
        if (this.themeClassName() === "FieldKey") {
            debugger;
        }

        super.setThemeClassName(aName);
        if (aName === "FieldKey") {
            assert(this.themeClassName() === "FieldKey");
        }
         return this;
    }

    /**
     * @description Apply styles.
     * @returns {TextField} The text field.
     */
    applyStyles () {
        /*
        if (this.themeClassName() === "FieldKey") {
            debugger;
        }
        */
        super.applyStyles();
        return this;
    }

    /**
     * @description Activate.
     * @returns {TextField} The text field.
     */
    activate () {
        if (this.usesDoubleTapToEdit()) {
            this.onDoubleTapComplete();
        } else {
            this.focus();
        }
        return this;
    }
    
    /**
     * @description On click.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onClick (event) {
        // needed to prevent click-to-edit event from selecting the background row
        //this.debugLog(".onClick()")

        if (this.contentEditable()) {
            this.sendActionToTarget();
            event.stopPropagation();
            return false;
        }

        return super.onClick(event);
    }
    
    /**
     * @description Set border.
     * @param {Boolean} v - The value.
     * @returns {TextField} The text field.
     */
    setBorder (v) {
        /*
        if (this.value() === "a") {
            console.log("break");
        }
        */
        return super.setBorder(v);
    }

    /**
     * @description Set background color.
     * @param {String} aColor - The color.
     * @returns {TextField} The text field.
     */
    setBackgroundColor (aColor) {
        super.setBackgroundColor(aColor);
        return this;
    }

    // --- speech to text input -----------------------------------------------------------------------

    /**
     * @description On alternate l key down.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onAlternate_l_KeyDown (event) {
        if (this.hasFocus()) {
            if (!event.repeat) {
                this.startSpeechToText();
            }
            event.stopPropagation();
            event.preventDefault();
            //return true;
        }
    }

    /**
     * @description On alternate l key up.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onAlternate_l_KeyUp(event) {
        if (this.hasFocus()) {
            this.stopSpeechToText();
            event.stopPropagation();
        } else {
            debugger;
        }
    }

    /**
     * @description Start speech to text.
     * @returns {void}
     */
    startSpeechToText () {
        console.log("=== start speech to text ===");
        if (this._speechSession) {
            this._speechSession.stop();
            this._speechSession = null;
        }

        // TODO: add visual indicator?
        if (!this._speechSession) {
            if (getGlobalThis()["SpeechToTextSession"]) {
                this._speechSession = SpeechToTextSession.clone().setDelegate(this);
                //debugger;
                this._speechSession.start();
            } else {
                console.warn("no SpeechToTextSession class available");
            }
        }
    }

    /**
     * @description On speech interim result.
     * @param {SpeechToTextSession} speechSession - The speech session.
     * @returns {void}
     */
    onSpeechInterimResult (speechSession) {
        //const s = speechSession.intermFullTranscript();
        const s = speechSession.fullTranscript();
        //console.log("onSpeechInterimResult intermFullTranscript: '" + s + "'");
        //this.insertTextAtCursorSimple(s);
    }

    /**
     * @description On speech end.
     * @param {SpeechToTextSession} speechSession - The speech session.
     * @returns {void}
     */
    onSpeechEnd (speechSession) {
        const s = speechSession.fullTranscript();
        console.log("onSpeechEnd full: '" + s + "'");
        this.insertTextAtCursorSimple(s);
        this._speechSession = null;
    }

    /**
     * @description Stop speech to text.
     * @returns {void}
     */
    stopSpeechToText () {
        console.log("==== stop speech to text ====");
        // TODO: add visual indicator?
        const speech = this._speechSession;
        if (speech) {
            speech.stop();
        }
    }

    // --- arrow key defaults disabled while editing ---

    /**
     * @description On up arrow key down.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onUpArrowKeyDown (event) { // why down and not up?
        if (this.isFocused()) { 
            return false;
        }
        
        return super.onUpArrowKeyDown(event);
    }
	
    /**
     * @description On down arrow key down.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onDownArrowKeyDown (event) { // why down and not up?
        if (this.isFocused()) { 
            return false;
        }

        return super.onDownArrowKeyDown(event);
    }
	
    /**
     * @description On left arrow key up.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onLeftArrowKeyUp (event) {
        if (this.isFocused()) { 
            return false;  
        }
        
        return super.onLeftArrowKeyUp(event);
    }
	
    /**
     * @description On right arrow key up.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onRightArrowKeyUp (event) {
        if (this.isFocused()) { 
            return false;
        }
        
        return super.onRightArrowKeyUp(event);
    }

    // --- select ---

    /**
     * @description On select start.
     * @param {Event} event - The event.
     * @returns {void}
     */
    onSelectStart (event) {
        console.log("'" + this.element().textContent.substring(0, 10) + "'.onSelectStart()");
    }

}.initThisClass());


