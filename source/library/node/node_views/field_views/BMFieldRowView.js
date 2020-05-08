"use strict"

/*

    BMFieldRowView

*/


window.BMFieldRowView = class BMFieldRowView extends BrowserRow {
    
    initPrototype () {
        this.newSlot("allowsCursorNavigation", false)
        this.newSlot("vPadding",  "0.1em")

        this.newSlot("titlesSection", null)
        this.newSlot("keyViewContainer", null)
        this.newSlot("valueViewContainer", null)

        this.newSlot("errorViewContainer", null)
        this.newSlot("noteViewContainer", null)

        this.newSlot("keyView", null)
        this.newSlot("valueView", null)
        this.newSlot("errorView", null)
        this.newSlot("noteView", null)

        this.newSlot("editableColor", "#aaa")
        this.newSlot("uneditableColor", "#888")
        this.newSlot("errorColor", "red")

        this.newSlot("valueEditableBorder", "1px solid rgba(255, 255, 255, 0.2)")
        //this.newSlot("valueEditableBorder", "none")
        this.newSlot("valueUneditableBorder", "none")
    }

    setupRowContentView () {
        super.setupRowContentView()

        const cv = this.contentView()
        cv.setMinHeight("5em")
        cv.setPaddingTop("0.5em")
        cv.setPaddingBottom("0.5em")
        cv.setJustifyContent("center") // alignment perpendicular to flex
        cv.setFlexDirection("column")
        return this
    }

    init () {
        super.init()
        this.makeCursorDefault()
        this.setSpellCheck(false)

        this.setOpacity(1)
        this.setPosition("relative")
        this.setHeight("auto")
        this.setMinHeight("5em")
        this.setMaxHeight("none")
        this.setHeight("auto")
        this.setOverflow("visible")
        this.setWidth("auto")
        this.setTransition("background-color .3s ease-out")
        this.setTextAlign("left")

        {
            this.setTitlesSection(this.contentView().newFlexSubview().setDivClassName("TitlesSection"))
            this.titlesSection().setFlexDirection("column")

            this.setKeyViewContainer(this.titlesSection().newFlexSubview().setDivClassName("KeyViewContainer"))
            this.keyViewContainer().setAlignItems("flex-start")
            this.setupKeyView()

            this.setValueViewContainer(this.titlesSection().newFlexSubview().setDivClassName("ValueViewContainer"))
            this.valueViewContainer().setAlignItems("flex-start")
            this.setupValueView()

            this.setNoteViewContainer(this.contentView().newFlexSubview().setDivClassName("NoteViewContainer"))
            this.setupNoteView()

            this.setErrorViewContainer(this.contentView().newFlexSubview().setDivClassName("ErrorViewContainer"))
            this.setupErrorView()

            this.contentView().subviews().forEach(subview => {
                subview.setPaddingLeft("1.5em")
                subview.setPaddingRight("1em")
            })
        }

        
        return this
    }

    setupKeyView() {
        const v = TextField.clone().setDivClassName("BMFieldKeyView")
        v.setDisplay("inline-block")
        v.setOverflow("hidden")
        v.setTextAlign("left")
        v.setWhiteSpace("nowrap")

        this.setKeyView(v)
        v.turnOffUserSelect()
        v.setSpellCheck(false)
        //v.setPaddingTop(this.vPadding())
        //v.setPaddingBottom(this.vPadding())
        v.setMarginTop(this.vPadding())
        v.setMarginBottom(this.vPadding())
        v.setPaddingLeft("0em")
        v.setPaddingRight("0em")

        this.keyViewContainer().addSubview(v)     
        return v
    }

    setupValueView () {
        const v = this.createValueView()
        v.setUserSelect("text")   // should the value view handle this?
        v.setSpellCheck(false)   // should the value view handle this?
        //v.setPaddingTop(this.vPadding())
        //v.setPaddingBottom(this.vPadding())
        v.setMarginTop(this.vPadding())
        v.setMarginBottom(this.vPadding())

        this.setValueView(v)
        this.valueViewContainer().addSubview(v)  
        //this.valueSectionView().addSubview(v)  
        return v
    }

    setupNoteView () {
        const v = DomView.clone().setDivClassName("BMFieldRowViewNoteView")
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
        v.setUserSelect("text")
        this.setNoteView(v)
        this.noteViewContainer().addSubview(v)
        return v
    }

    setupErrorView () {
        const v = DomView.clone().setDivClassName("BMFieldRowViewErrorView")
        v.setUserSelect("text")
        v.setSpellCheck(false)
        //v.setInnerHTML("error")
        v.setColor("red")
        v.setPaddingBottom("0em")
        this.setErrorView(v)
        this.errorViewContainer().addSubview(v)
        return v 
    }

    createValueView () {
        const v = TextField.clone().setDivClassName("BMFieldValueView")
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
        v.setPaddingLeft("7px")
        v.setPaddingRight("4px")
        v.setPaddingBottom("5px")
        v.setColor("white")
        v.setBackgroundColor("transparent")
        //tf.setSelectAllOnDoubleClick(true)
        return v
    }

    // colors

    currentBackgroundCssColor () {
        const bg = this.columnGroup().computedBackgroundColor()
        return CSSColor.clone().setCssColorString(bg)
    }

    valueBackgroundCssColor () {
        return this.currentBackgroundCssColor().contrastComplement(0.2)
    }

    valueBackgroundColor () {
        return this.valueBackgroundCssColor().cssColorString()
    }

    editableColor () {
        return this.valueBackgroundCssColor().contrastComplement(0.2).cssColorString()
    }

    keyViewColor () {
        //console.log(this.node().title() + " " + this.typeId() + ".isSelected() = ", this.isSelected())
        return this.currentColor()
        //return this.valueBackgroundCssColor().contrastComplement(0.2).cssColorString()
    }

	
    // visible key and value
    
    visibleValue () {
        return this.node().visibleValue()
    }
	
    visibleKey () {
        return this.node().key()
    }

    // sync 
    
    didUpdateSlotIsSelected (oldValue, newValue) {
        super.didUpdateSlotIsSelected(oldValue, newValue)
        this.syncFromNodeNow() // need this to update selection color on fields?
        return this
    }

    syncFromNode () {
        super.syncFromNode()
        //this.debugLog(" syncFromNode")
		
        const node = this.node()
        node.prepareToSyncToView()
        this.setDisplayIsHidden(!node.isVisible())

        this.syncKeyFromNode()
        this.syncValueFromNode()
        this.syncErrorFromNode()
        this.syncNoteFromNode()
        
        return this
    }

    syncKeyFromNode () {
        const node = this.node()
        const keyView = this.keyView()

        keyView.setInnerHTML(this.visibleKey())
        keyView.setIsVisible(node.keyIsVisible())
        keyView.setDisplayIsHidden(!node.keyIsVisible())
        keyView.setIsEditable(node.keyIsEditable())
        keyView.setColor(this.keyViewColor())
    }

    syncValueFromNode () {
        const node = this.node()
        const valueView = this.valueView()

        const newValue = this.visibleValue()
        valueView.setValue(newValue)
        valueView.setIsEditable(node.valueIsEditable())
        valueView.setDisplayIsHidden(!node.valueIsVisible())

        if (node.valueIsEditable()) {
            //valueView.setColor(this.editableColor())
            valueView.setColor(this.currentColor())
            //valueView.setBorder("1px solid #444")
            //valueView.setBorder("1px solid rgba(255, 255, 255, 0.2)")
            valueView.setBorder(this.valueEditableBorder())
            valueView.setPaddingLeft("0.5em").setPaddingRight("0.5em")

        } else {
            //console.log("fieldview key '", node.key(), "' node.valueIsEditable() = ", node.valueIsEditable(), " setColor ", this.uneditableColor())
            //valueView.setColor(this.uneditableColor())
            valueView.setColor(this.styles().disabled().color())
            //valueView.setBorder("1px solid rgba(255, 255, 255, 0.05)")
            valueView.setBorder(this.valueUneditableBorder())
            valueView.setPaddingLeft("0em").setPaddingRight("0em")
        }
    }

    syncErrorFromNode () {
        const node = this.node()
        const valueView = this.valueView()
        const errorView = this.errorView()

        const color = valueView.color()
        
        if (node.valueError()) {
            valueView.setColor(this.errorColor())
            errorView.setColor(this.errorColor())
            errorView.setInnerHTML(node.valueError())
            errorView.fadeInHeightToDisplayBlock(15)
            //valueView.setToolTip(node.valueError())
        } else {
            valueView.setBackgroundColor("transparent")
            valueView.setColor(color)
            errorView.fadeOutHeightToDisplayNone()
            //valueView.setToolTip("")
        }
    }

    syncNoteFromNode () {
        const node = this.node()
        const noteView = this.noteView()
        
        if (this.visibleNote()) {
            noteView.unhideDisplay()
            noteView.setInnerHTML(this.visibleNote())
        } else {
            noteView.hideDisplay()
            noteView.setInnerHTML("")
        }
    }


    // ----------------------

    visibleNote () {
        return this.node().note()
    }
    
    syncToNode () {
        const node = this.node()

        if (node.keyIsEditable()) {
        	node.setKey(this.keyView().value())
        }
	
        if (node.valueIsEditable()) {
        	node.setValue(this.valueView().value())
        }
		
        super.syncToNode()
        return this
    }
    
    onDidEdit (changedView) {
        this.scheduleSyncToNode() 
        return true
    }

    updateSubviews () {
        super.updateSubviews()
        
        /*
        const node = this.node()

        if (node && node.nodeMinRowHeight()) {
            if (node.nodeMinRowHeight() === -1) {
                this.setHeight("auto")
                this.setPaddingBottom("calc(100% - 20px)")

            } else {
                this.setHeight(this.pxNumberToString(node.nodeMinRowHeight()))
            }
        }
        */
        
        return this
    }

    /*
    applyStyles () {
        super.applyStyles()
        return this
    }
    */
    
    onEnterKeyUp (event) {
        //this.debugLog(".onEnterKeyUp()")
        if(this.valueView().activate) {
            this.valueView().activate()
        }
        return this
    }

    setBackgroundColor (c) {
        /*
        this.debugLog(".setBackgroundColor ", c)
        if (c !== "white") {
            console.log("not white")
        }
        */
        super.setBackgroundColor(c)
        return this
    }

    becomeKeyView () {
        this.valueView().becomeKeyView()
        return this
    }

    unselect () {
        super.unselect()
        this.valueView().blur()
        this.keyView().blur()
        return this
    }
    
}.initThisClass()
