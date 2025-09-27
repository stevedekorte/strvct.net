"use strict";

/**
 * @module library.node.node_views.browser.stack.Tile.field_tiles
 * @class SvFieldTile
 * @extends Tile
 * @classdesc

    Field views are tiles that present nodes which have key/value pairs, 
    such as those representing slots, or other named properties.

    The idea is to use the field as the container, and then get
    a custom value view to present in the value area. 

*/


(class SvFieldTile extends Tile { 
    
    initPrototypeSlots () {
        {
            /** @member {boolean} allowsCursorNavigation
             * @description Indicates if cursor navigation is allowed.
             */
            const slot = this.newSlot("allowsCursorNavigation", false);
            slot.setSlotType("Boolean");
        }
        {
            /** @member {string} vPadding
             * @description The vertical padding for the tile.
             */
            const slot = this.newSlot("vPadding",  "0.1em");
            slot.setSlotType("String");
        }
        {
            /** @member {DomView} kvSection
             * @description The key-value section view.
             */
            const slot = this.newSlot("kvSection", null);
            slot.setSlotType("DomView");
        }
        {
            /** @member {DomView} keyViewContainer
             * @description The container for the key view.
             */
            const slot = this.newSlot("keyViewContainer", null);
            slot.setSlotType("DomView");
        }
        {
            /** @member {DomView} valueViewContainer
             * @description The container for the value view.
             */
            const slot = this.newSlot("valueViewContainer", null);
            slot.setSlotType("DomView");
        }
        {
            /** @member {DomView} errorViewContainer
             * @description The container for the error view.
             */
            const slot = this.newSlot("errorViewContainer", null);
            slot.setSlotType("DomView");
        }
        {
            /** @member {DomView} noteViewContainer
             * @description The container for the note view.
             */
            const slot = this.newSlot("noteViewContainer", null);
            slot.setSlotType("DomView");
        }
        {
            /** @member {DomView} keyView
             * @description The key view.
             */
            const slot = this.newSlot("keyView", null);
            slot.setSlotType("DomView");
        }
        {
            /** @member {DomView} valueView
             * @description The value view.
             */
            const slot = this.newSlot("valueView", null);
            slot.setSlotType("DomView");
        }
        {
            /** @member {DomView} errorView
             * @description The error view.
             */
            const slot = this.newSlot("errorView", null);
            slot.setSlotType("DomView");
        }
        {
            /** @member {DomView} noteView
             * @description The note view.
             */
            const slot = this.newSlot("noteView", null);
            slot.setSlotType("DomView");
        }
        {
            /** @member {string} editableColor
             * @description The color for editable text.
             */
            const slot = this.newSlot("editableColor", "#aaa");
            slot.setSlotType("String");
        }
        {
            /** @member {string} uneditableColor
             * @description The color for uneditable text.
             */
            const slot = this.newSlot("uneditableColor", "#888");
            slot.setSlotType("String");
        }
        {
            /** @member {string} errorColor
             * @description The color for error text.
             */
            const slot = this.newSlot("errorColor", "red");
            slot.setSlotType("String");
        }
        {
            /** @member {string} valueEditableBorder
             * @description The border for editable value.
             */
            const slot = this.newSlot("valueEditableBorder", "1px solid rgba(255, 255, 255, 0.2)");
            slot.setSlotType("String");
        }
        /*
        {
            const slot = this.newSlot("valueEditableBorder", "none");
            slot.setSlotType("String");
        }
        */
        {
            /** @member {string} valueUneditableBorder
             * @description The border for uneditable value.
             */
            const slot = this.newSlot("valueUneditableBorder", "none");
            slot.setSlotType("String");
        }
    }

    /**
     * @description Sets up the content view for the tile.
     * @returns {SvFieldTile} The current instance.
     */
    setupTileContentView () {
        super.setupTileContentView();

        const cv = this.contentView();
        cv.setMinHeight("5em");
        //cv.setPaddingTop("0.5em");
        //cv.setPaddingBottom("0.5em");
        cv.setJustifyContent("center"); // alignment perpendicular to flex
        cv.setFlexDirection("column");
        return this;
    }

    /**
     * @description Initializes the tile.
     * @returns {SvFieldTile} The current instance.
     */
    init () {
        super.init();
        this.makeCursorDefault();
        this.setSpellCheck(false);

        this.setOpacity(1);
        this.setPosition("relative");
        this.setHeight("auto");
        this.setMinHeight("5em");
        this.setMaxHeight("none");
        this.setHeight("auto");
        this.setOverflow("visible");
        this.setWidth("auto");
        this.setTransition("background-color .3s ease-out");
        this.setTextAlign("left");

        {
            this.setKvSection(this.contentView().newFlexSubview().setElementClassName("KvSection"));
            this.kvSection().setFlexDirection("column");

            this.setKeyViewContainer(this.kvSection().newFlexSubview().setElementClassName("KeyViewContainer"));
            this.keyViewContainer().setAlignItems("flex-start");
            this.setupKeyView();

            this.setValueViewContainer(this.kvSection().newFlexSubview().setElementClassName("ValueViewContainer"));
            this.valueViewContainer().setAlignItems("flex-start");
            this.setupValueView();

            this.setNoteViewContainer(this.contentView().newFlexSubview().setElementClassName("NoteViewContainer"));
            this.setupNoteView();

            this.setErrorViewContainer(this.contentView().newFlexSubview().setElementClassName("ErrorViewContainer"));
            this.setupErrorView();

            /*
            this.contentView().subviews().forEach(subview => {
                subview.setPaddingLeft("1.5em")
                subview.setPaddingRight("1em")
            })
            */
        }

        return this
    }

    /**
     * @description Sets up the key view.
     * @returns {DomView} The key view.
     */
    setupKeyView () {
        const v = SvTextView.clone().setElementClassName("SvFieldKeyView")
        if (!v.themeClassName()) {
            v.setThemeClassName("FieldKey")
        }
        v.setDisplay("inline-block")
        v.setOverflow("hidden")
        v.setTextAlign("left")
        v.setWhiteSpace("nowrap")

        this.setKeyView(v);
        v.turnOffUserSelect();
        v.setSpellCheck(false);
        //v.setPaddingTop(this.vPadding())
        //v.setPaddingBottom(this.vPadding())
        v.setMarginTop(this.vPadding());
        v.setMarginBottom(this.vPadding());
        v.setPaddingLeft("0em");
        v.setPaddingRight("0em");

        this.keyViewContainer().addSubview(v);     
        return v;
    }

    /**
     * @description Sets up the value view.
     * @returns {DomView} The value view.
     */
    setupValueView () {
        const v = this.createValueView()
        if (!v.themeClassName()) {
            v.setThemeClassName("FieldValue")
        }
        v.setUserSelect("text")   // should the value view handle this?
        v.setSpellCheck(false)   // should the value view handle this?
        //v.setPaddingTop(this.vPadding())
        //v.setPaddingBottom(this.vPadding())
        v.setMarginTop(this.vPadding())
        v.setMarginBottom(this.vPadding())

        this.setValueView(v);
        this.valueViewContainer().addSubview(v);  
        //this.valueSectionView().addSubview(v)  
        return v;
    }

    /**
     * @description Sets up the note view.
     * @returns {DomView} The note view.
     */
    setupNoteView () {
        const v = DomView.clone().setElementClassName("SvFieldTileNoteViewView")
        v.setDisplay("block")
        v.setPosition("relative")
        v.setOverflow("hidden")
        v.setWidth("100%")
        v.setFontWeight("normal")
        v.setColor("#aaa")
        v.setMarginLeft("0em")
        v.setMarginRightPx(0)
        v.setMarginTop("0em")
        v.setMarginBottom("0.2em")
        v.setUserSelect("text");
        this.setNoteView(v);
        this.noteViewContainer().addSubview(v);
        return v;
    }

    /**
     * @description Sets up the error view.
     * @returns {DomView} The error view.
     */
    setupErrorView () {
        const v = DomView.clone().setElementClassName("SvFieldTileErrorView")
        v.setUserSelect("text")
        v.setSpellCheck(false)
        //v.setInnerHtml("error")
        v.setColor("red")
        v.setPaddingBottom("0em")
        v.setWhiteSpace("normal");
        this.setErrorView(v);
        this.errorViewContainer().addSubview(v);
        return v; 
    }

    /**
     * @description Creates the value view.
     * @returns {DomView} The value view.
     */
    createValueView () {
        const v = SvTextView.clone().setElementClassName("SvFieldValueView")
        v.setDisplay("flex")
        v.setPosition("relative")
        v.setWidth("100%")
        v.setMarginTop("0.1em")
        v.setMarginLeft("0em")
        v.setMarginRight("0em")
        v.setMarginBottom("0.1em")
        v.setTextAlign("left")
        v.setOverflow("hidden")
        v.setWhiteSpace("nowrap")
        /*
        v.setPaddingLeft("7px")
        v.setPaddingRight("4px")
        v.setPaddingBottom("5px")
        */
        v.setColor("white")
        v.setBackgroundColor("transparent")
        //tf.setSelectAllOnDoubleClick(true)
        return v;
    }

    // colors

    /**
     * @description Gets the current background CSS color.
     * @returns {CssColor} The current background color.
     */
    currentBackgroundCssColor () {
        const bg = this.navView().computedBackgroundColor();
        return CssColor.clone().setCssColorString(bg);
    }

    /**
     * @description Gets the value background CSS color.
     * @returns {CssColor} The value background color.
     */
    valueBackgroundCssColor () {
        return this.currentBackgroundCssColor().contrastComplement(0.2);
    }

    /**
     * @description Gets the value background color.
     * @returns {string} The value background color.
     */

    valueBackgroundColor () {
        return this.valueBackgroundCssColor().cssColorString();
    }

    /**
     * @description Gets the editable color.
     * @returns {string} The editable color.
     */
    editableColor () {
        return this.valueBackgroundCssColor().contrastComplement(0.2).cssColorString()
    }

    /**
     * @description Gets the key view color.
     * @returns {string} The key view color.
     */
    keyViewColor () {
        //console.log(this.logPrefix(), this.node().title() + " " + this.svTypeId() + ".isSelected() = ", this.isSelected())
        return this.currentColor()
        //return this.valueBackgroundCssColor().contrastComplement(0.2).cssColorString()
    }

	
    // visible key and value
    /**
     * @description Gets the visible value.
     * @returns {string} The visible value.
     */
    visibleValue () {
        return this.node().visibleValue()
    }

    /**
     * @description Checks if the key is complete (no dots animation).
     * @returns {boolean} True if complete, false if should show dots.
     */
    keyIsComplete () {
        const node = this.node();
        if (node && node.keyIsComplete) {
            return node.keyIsComplete();
        }
        return true; // default to complete (no dots)
    }

    /**
     * @description Checks if the value is complete (no dots animation).
     * @returns {boolean} True if complete, false if should show dots.
     */
    valueIsComplete () {
        const node = this.node();
        if (node && node.valueIsComplete) {
            return node.valueIsComplete();
        }
        return true; // default to complete (no dots)
    }

    /**
     * @description Synchronizes the dots display based on the node's state.
     * @returns {SvFieldTile} The current instance.
     * @category Synchronization
     */
    syncDotsFromNode () {
        const node = this.node();
        if (node) {
            // Check key completion
            if (node.keyIsComplete) {
                if (node.keyIsComplete()) {
                    this.hideKeyDots();
                } else {
                    this.showKeyDots();
                }
            } else {
                this.hideKeyDots();
            }
            
            // Check value completion
            if (node.valueIsComplete) {
                if (node.valueIsComplete()) {
                    this.hideValueDots();
                } else {
                    this.showValueDots();
                }
            } else {
                this.hideValueDots();
            }
        }
        return this;
    }

    /**
     * @description Shows the animated dots on the key view.
     * @returns {SvFieldTile} The current instance.
     * @category UI
     */
    showKeyDots () {
        const view = this.keyView();
        if (view && view.setCssProperty) {
            view.setCssProperty("--key-after-display", "inline-block");
            view.setCssProperty("--key-after-animation", "dotty steps(1,end) 1s infinite");
        }
        return this;
    }

    /**
     * @description Hides the animated dots on the key view.
     * @returns {SvFieldTile} The current instance.
     * @category UI
     */
    hideKeyDots () {
        const view = this.keyView();
        if (view && view.setCssProperty) {
            view.setCssProperty("--key-after-display", "none");
            view.setCssProperty("--key-after-animation", "none");
        }
        return this;
    }

    /**
     * @description Shows the animated dots on the value view.
     * @returns {SvFieldTile} The current instance.
     * @category UI
     */
    showValueDots () {
        const view = this.valueView();
        if (view && view.setCssProperty) {
            view.setCssProperty("--div-after-display", "inline-block");
            view.setCssProperty("--div-after-animation", "dotty steps(1,end) 1s infinite");
        }
        return this;
    }

    /**
     * @description Hides the animated dots on the value view.
     * @returns {SvFieldTile} The current instance.
     * @category UI
     */
    hideValueDots () {
        const view = this.valueView();
        if (view && view.setCssProperty) {
            view.setCssProperty("--div-after-display", "none");
            view.setCssProperty("--div-after-animation", "none");
        }
        return this;
    }
	
    /**
     * @description Gets the visible key.
     * @returns {string} The visible key.
     */
    visibleKey () {
        return this.node().key();
    }

    // sync 
    
    /**
     * @description Updates the slot isSelected.
     * @param {boolean} oldValue - The old value.
     * @param {boolean} newValue - The new value.
     * @returns {SvFieldTile} The current instance.
     */
    didUpdateSlotIsSelected (oldValue, newValue) {
        super.didUpdateSlotIsSelected(oldValue, newValue);
        this.syncFromNodeNow(); // need this to update selection color on fields?
        return this;
    }

    /**
     * @description Syncs from the node.
     * @returns {SvFieldTile} The current instance.
     */

    syncFromNode () {
        super.syncFromNode();
        //this.logDebug(" syncFromNode");
		
        const node = this.node();
        node.prepareToSyncToView();
        //this.setIsDisplayHidden(!node.isVisible());

        this.syncKeyFromNode();
        this.syncValueFromNode();
        this.syncErrorFromNode();
        this.syncNoteFromNode();
        this.syncDotsFromNode();
        return this;
    }

    /**
     * @description Syncs the key from the node.
     * @returns {SvFieldTile} The current instance.
     */
    syncKeyFromNode () {
        const node = this.node();
        const keyView = this.keyView();

        keyView.setString(this.visibleKey()); // setString only applies if value changed
        keyView.setIsVisible(node.keyIsVisible());
        keyView.setIsDisplayHidden(!node.keyIsVisible());
        keyView.setIsEditable(node.keyIsEditable());
        keyView.setColor(this.keyViewColor());
    }

    /**
     * @description Syncs the value from the node.
     * @returns {SvFieldTile} The current instance.
     */
    syncValueFromNode () {
        const node = this.node();
        const valueView = this.valueView();

        const newValue = this.visibleValue();

        valueView.setValue(newValue);
        valueView.setIsEditable(node.valueIsEditable());
        valueView.setIsDisplayHidden(!node.valueIsVisible());

        /*
        if (this.keyView().innerText() === "Additional Notes") {
            assert(node.valuePlaceholderText() !== null, "missing node.valuePlaceholderText()");
        }
        */

        if (valueView.setPlaceholderText) {
            if (node.valuePlaceholderText) {
                valueView.setPlaceholderText(node.valuePlaceholderText());
            } else {
                valueView.setPlaceholderText(null);
            }
        }


        /*
        if (this.node().svType() === "ChatInputNode" && newValue === "") {
            console.log(this.logPrefix(), "SvChatInputTile syncValueFromNode(SvChatInputNode) newValue = [" + newValue + "]");
            valueView.setValue(newValue);
        }
        */

        if (node.valueIsEditable()) {
            //valueView.setColor(this.editableColor())
            valueView.setColor(this.currentColor())
            //valueView.setBorder("1px solid #444")
            //valueView.setBorder("1px solid rgba(255, 255, 255, 0.2)")
            valueView.setBorder(this.valueEditableBorder())
            valueView.setPaddingLeft("0.5em").setPaddingRight("0.5em")
        } else {
            //console.log(this.logPrefix(), "fieldview key '", node.key(), "' node.valueIsEditable() = ", node.valueIsEditable(), " setColor ", this.uneditableColor())
            valueView.setColor(this.uneditableColor())
            //valueView.setBorder("1px solid rgba(255, 255, 255, 0.05)")
            valueView.setBorder(this.valueUneditableBorder())
            //valueView.setPaddingLeft("0em").setPaddingRight("0em")
        }

        if (valueView.setCanHitEnter) {
            if (node.acceptsValueInput) {
                //console.log(this.logPrefix(), "node.acceptsValueInput() = ", node.acceptsValueInput());
                
                valueView.setCanHitEnter(node.acceptsValueInput());
                //valueView.setCanHitEnter(true);
            } else {
                valueView.setCanHitEnter(true);
            }
        }
    }

    /**
     * @description Syncs the error from the node.
     * @returns {SvFieldTile} The current instance.
     */
    syncErrorFromNode () {
        const node = this.node()
        const valueView = this.valueView()
        const errorView = this.errorView()

        const color = valueView.color()
        
        if (node.valueError()) {
            valueView.setColor(this.errorColor())
            errorView.setColor(this.errorColor())
            errorView.setInnerHtml(node.valueError())
            errorView.fadeInHeightToDisplayBlock()
            //valueView.setToolTip(node.valueError())
        } else {
            valueView.setBackgroundColor("transparent")
            valueView.setColor(color)

            if (errorView.display() !== "none") {
                errorView.setDisplay("none")
            }
            //errorView.fadeOutHeightToDisplayNone()
            
            //valueView.setToolTip("")
        }
    }

    /**
     * @description Syncs the note from the node.
     * @returns {SvFieldTile} The current instance.
     */
    syncNoteFromNode () {
        //const node = this.node()
        const noteView = this.noteView()
        
        if (this.visibleNote()) {
            noteView.unhideDisplay()
            noteView.setInnerHtml(this.visibleNote())
        } else {
            noteView.hideDisplay()
            noteView.setInnerHtml("")
        }
    }


    // ----------------------

    /**
     * @description Gets the visible note.
     * @returns {string} The visible note.
     */
    visibleNote () {
        return this.node().note()
    }
    
    /**
     * @description Syncs to the node.
     * @returns {SvFieldTile} The current instance.
     */
    syncToNode () {
        const node = this.node()

        if (node.keyIsEditable()) {
            const keyValue = this.keyView().value();
            node.setKey(keyValue)
        }
	
        if (node.valueIsEditable()) {
            const valueViewValue = this.valueView().value();
            node.setValue(valueViewValue)
        }
		
        super.syncToNode()
        return this
    }
    
    /**
     * @description Called when an edit occurs.
     * @param {DomView} changedView - The changed view.
     * @returns {SvFieldTile} The current instance.
     */
    onDidEdit (changedView) { // sent up subview chain when an edit occurs
        this.scheduleSyncToNode();
        if (changedView === this.valueView()) {
            const node = this.node()
            if (node.onDidEditValue) {
                node.onDidEditValue(changedView)
            }
        }
        return true
    }

    /**
     * @description Called when an input occurs.
     * @param {DomView} changedView - The changed view.
     * @returns {SvFieldTile} The current instance.
     */
    onDidInput (changedView) { // sent up subview chain when an input occurs
        if (changedView === this.valueView()) {
            const node = this.node()
            this.syncToNode(); //  is this done elsewhere
            if (node.onValueInput) {
                node.onValueInput(changedView)
            }
        }
    }

    /**
     * @description Syncs styles to subviews.
     * @returns {SvFieldTile} The current instance.
     */
    syncStylesToSubviews () {
        super.syncStylesToSubviews()
        this.keyView().syncStateFrom(this)
        this.valueView().syncStateFrom(this)
        return this
    }

    /**
     * @description Updates the subviews.
     * @returns {SvFieldTile} The current instance.
     */
    updateSubviews () {
        super.updateSubviews()
        this.syncStylesToSubviews()

        /*
        const node = this.node()

        if (node && node.nodeMinTileHeight()) {
            if (node.nodeMinTileHeight() === -1) {
                this.setHeight("auto")
                this.setPaddingBottom("calc(100% - 20px)")

            } else {
                this.setHeight(this.pxNumberToString(node.nodeMinTileHeight()))
            }
        }
        */
        
        return this
    }

    /**
     * @description Applies styles to the tile.
     * @returns {SvFieldTile} The current instance.
     */
    applyStyles () {
        super.applyStyles()
        //this.keyView().applyStyles()
        //this.valueView().applyStyles()
        return this
    }

    /**
     * @description Called when the enter key is pressed.
     * @param {Event} event - The event.
     * @returns {SvFieldTile} The current instance.
     */
    onEnterKeyUp (/*event*/) {
        //this.logDebug(".onEnterKeyUp()")
        if (this.valueView().activate) {
            this.valueView().activate()
        }
        return this
    }

    /**
     * @description Sets the background color.
     * @param {string} c - The color.
     * @returns {SvFieldTile} The current instance.
     */
    setBackgroundColor (c) {
        /*
        this.logDebug(".setBackgroundColor ", c)
        if (c !== "white") {
            console.log(this.logPrefix(), "not white")
        }
        */
        super.setBackgroundColor(c)
        return this
    }

    /**
     * @description Becomes the key view.
     * @returns {SvFieldTile} The current instance.
     */
    becomeKeyView () {
        this.valueView().becomeKeyView()
        return this
    }

    /**
     * @description Unselects the tile.
     * @returns {SvFieldTile} The current instance.
     */
    unselect () {
        super.unselect()
        this.valueView().blur()
        this.keyView().blur()
        return this
    }
    
}.initThisClass());
