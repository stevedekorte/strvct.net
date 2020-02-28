"use strict"

/*

    BMFieldRowView

*/


window.BMFieldRowView = class BMFieldRowView extends BrowserFieldRow {
    
    initPrototype () {
        this.newSlot("titlesSection", null)
        this.newSlot("keyView", null)
        this.newSlot("valueView", null)
        this.newSlot("errorView", null)
        this.newSlot("noteView", null)

        this.newSlot("editableColor", "#aaa")
        this.newSlot("uneditableColor", "#888")
        this.newSlot("errorColor", "red")
    
        this.newSlot("keyViewContainer", null)
        this.newSlot("valueViewContainer", null)

        this.newSlot("valueEditableBorder", "1px solid rgba(255, 255, 255, 0.2)")
        //this.newSlot("valueEditableBorder", "none")
        this.newSlot("valueUneditableBorder", "none")
    }

    init () {
        super.init()
        
        this.setMaxHeight("none")
        this.setHeight("auto")

        const cv = this.contentView()

        cv.setMinHeight("5em")
        cv.setPaddingTop("0.5em").setPaddingBottom("0.5em")
        cv.flexSplitIntoRows(4)
        cv.setJustifyContent("center") // alignment perpendicular to flex

        const titlesSection = cv.subviews().at(0).setDivClassName("TitlesSection")
        this.setTitlesSection(titlesSection)
        titlesSection.flexSplitIntoRows(2)

        const tv = titlesSection.subviews().at(0).setDivClassName("KeyViewContainer")
        this.setKeyViewContainer(tv)

        const sv = titlesSection.subviews().at(1).setDivClassName("ValueViewContainer")
        this.setValueViewContainer(sv)

        const nv = cv.subviews().at(1)
        const ev = cv.subviews().at(2)

        cv.subviews().forEach(sv => {
            sv.setPaddingLeft("1.5em")
            sv.setPaddingRight("1em")
        })
        
        /*
        cv.setMinHeight("5em")

        cv.setPaddingTop("0.7em")
        cv.setPaddingBottom("1em")

        cv.setPaddingLeft("1.5em")
        cv.setPaddingRight("1em")
        */

        const vPadding = "0.6em"

        this.setKeyView(TextField.clone().setDivClassName("BMFieldKeyView"))
        tv.addSubview(this.keyView())     
        this.keyView().turnOffUserSelect().setSpellCheck(false)
        this.keyView().setPaddingTop(vPadding).setPaddingBottom(vPadding)
        //this.keyView().setMarginLeft(18)

        //this.setValueSectionView(DomView.clone().setDivClassName("BMFieldValueSectionView"))
        //this.addContentSubview(this.valueSectionView())  


        //this.contentView().setPaddingLeftPx(20)
        this.setValueView(this.createValueView())
        this.valueView().setPaddingTop(vPadding).setPaddingBottom(vPadding)
        sv.addSubview(this.valueView())  
        //this.valueSectionView().addSubview(this.valueView())  
      
        this.valueView().setUserSelect("text")   // should the value view handle this?
        this.valueView().setSpellCheck(false)   // should the value view handle this?
        //this.valueView().setWidthPercentage(100) 

        this.setNoteView(DomView.clone().setDivClassName("BMFieldRowViewNoteView"))
        nv.addSubview(this.noteView())
        this.noteView().setUserSelect("text")

        this.setErrorView(DomView.clone().setDivClassName("BMFieldRowViewErrorView"))
        ev.addSubview(this.errorView())
        this.errorView().setUserSelect("text").setSpellCheck(false)
        //this.errorView().setInnerHTML("error")
        this.errorView().setColor("red")

        return this
    }

    createValueView () {
        const v = TextField.clone().setDivClassName("BMFieldValueView")
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
        return this.currentStyle().color()
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
    
    didChangeIsSelected () {
        super.didChangeIsSelected()
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
            valueView.setColor(this.currentStyle().color())
            //valueView.setBorder("1px solid #444")
            //valueView.setBorder("1px solid rgba(255, 255, 255, 0.2)")
            //valueView.setBorder(this.valueEditableBorder())
        } else {
            //console.log("fieldview key '", node.key(), "' node.valueIsEditable() = ", node.valueIsEditable(), " setColor ", this.uneditableColor())
            //valueView.setColor(this.uneditableColor())
            valueView.setColor(this.styles().disabled().color())
            //valueView.setBorder("1px solid rgba(255, 255, 255, 0.05)")
            //valueView.setBorder(this.valueUneditableBorder())
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
        //this.syncToNode() 
        this.scheduleSyncToNode() 
        //this.log(this.type() + " onDidEdit")   
        //this.node().setKey(this.keyView().value())
        //this.node().setValue(this.valueView().value())
        //this.node().didUpdateView(this)
        //this.scheduleSyncFromNode() // needed for validation? // causes bug with TextEditing if a 2nd edit is ahead of node state
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
