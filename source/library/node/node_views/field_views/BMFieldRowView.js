"use strict"

/*

    BMFieldRowView

*/


window.BMFieldRowView = class BMFieldRowView extends BrowserFieldRow {
    
    initPrototype () {
        this.newSlot("keyView", null)
        //this.newSlot("valueSectionView", null)
        this.newSlot("valueView", null)
        this.newSlot("errorView", null)
        this.newSlot("noteView", null)
        this.newSlot("editableColor", "#aaa")
        this.newSlot("uneditableColor", "#888")
        this.newSlot("errorColor", "red")
    }

    init () {
        super.init()
        
        this.setMaxHeight("none")
        this.setHeight("auto")

        this.setKeyView(TextField.clone().setDivClassName("BMFieldKeyView"))
        this.addContentSubview(this.keyView())     
   		this.keyView().turnOffUserSelect().setSpellCheck(false)   
        //this.keyView().setMarginLeft(18)

        //this.setValueSectionView(DomView.clone().setDivClassName("BMFieldValueSectionView"))
        //this.addContentSubview(this.valueSectionView())  


        //this.contentView().setPaddingLeftPx(20)
        this.setValueView(this.createValueView())
        this.addContentSubview(this.valueView())  
        //this.valueSectionView().addSubview(this.valueView())  
      
        this.valueView().setUserSelect("text")   // should the value view handle this?
        this.valueView().setSpellCheck(false)   // should the value view handle this?
        //this.valueView().setWidthPercentage(100) 

        this.setNoteView(DomView.clone().setDivClassName("BMFieldRowViewNoteView"))
        this.addContentSubview(this.noteView())
        this.noteView().setUserSelect("text")

        this.setErrorView(DomView.clone().setDivClassName("BMFieldRowViewErrorView"))
        this.addContentSubview(this.errorView())
        this.errorView().setUserSelect("text").setSpellCheck(false)
        //this.errorView().setInnerHTML("error")
        this.errorView().setColor("red")

        return this
    }

    createValueView () {
        const tf = TextField.clone().setDivClassName("BMFieldValueView")
        //tf.setSelectAllOnDoubleClick(true)
        return tf
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
    
    /*
    syncValueViewToNode () {
        //this.debugLog(".syncValueViewToNode " + this.node().type())
	    if (this.node().type() === "BMBooleanField" && this.valueView().type() !== "BooleanView") {
	        //console.log("syncValueViewToNode setup bool view")
	        const booleanView = BooleanView.clone()
            this.removeContentSubview(this.valueView())  
            this.setValueView(booleanView)
            this.addContentSubview(this.valueView())  
            //this.valueView().setUserSelect("text")   // should the value view handle this?
		    //this.valueView().setSpellCheck(false)   // should the value view handle this?	        
            //return TextField.clone().setDivClassName("BMFieldValueView")
        }
    }
    */
    
    didChangeIsSelected () {
        super.didChangeIsSelected()
        this.syncFromNodeNow() // need this to update selection color on fields?
        return this
    }

    /*
    syncKeyFromNode () {

    }

    syncValueFromNode () {

    }
    */


   contentHeight () {
        const displayedViews = this.contentView().subviews().filter((sv) => sv.getComputedCssAttribute("display") !== "none")
        const stackedViews = displayedViews.filter(sv => sv.getComputedCssAttribute("position") !== "absolute")

        //const h = stackedViews.sum(v => v.computedHeight())
        let h = 0
        let lastWasInline = false

        stackedViews.forEach((v) => {
            if (!lastWasInline) {
                const m1 = v.getComputedPxCssAttribute("margin-top")
                const m2 = v.getComputedPxCssAttribute("margin-bottom")
                h += v.computedHeight() + m1 + m2
            }

            lastWasInline = v.display().contains("inline")
        })

        return h
    }

    verticallyCenterContent () {
        const h = this.contentHeight()
        let minH = this.getComputedPxCssAttribute("min-height")
        if (minH && minH > h) {
            const p = Math.round((minH - h)/2)
            this.contentView().setPaddingTopPx(p)
        }
        return this
    }

    /*
    veritcallyCenteredValueTopMargin () {
        const valueView = this.valueView()
        const h = valueView.computedHeight()
        //16 + 10 padding (5 top, 5 bottom) + 2 border (1 top, 1 bottom)
        //console.log(" h = ", h)
        const p1 = valueView.getComputedPxCssAttribute("padding-top")
        const p2 = valueView.getComputedPxCssAttribute("padding-bottom")
        const b  = valueView.getComputedPxCssAttribute("border-width")

       const lineHeight = h - ((p1+p2) + 2*b)
        let minH = this.getComputedPxCssAttribute("min-height")
        if (minH) {
            const vp1 = this.contentView().getComputedPxCssAttribute("padding-top")
            const vp2 = this.contentView().getComputedPxCssAttribute("padding-bottom")
            minH -= vp1 + vp2
            const m = Math.round((minH - h)/2)
            return m
        }
        return "auto"
    }

    veritcallyCenterValue () {
        const m = this.veritcallyCenteredValueTopMargin()
        this.valueView().setMarginTop(m)
    }

    unveritcallyCenterValue () {
        //this.valueView().setMarginTop("auto")
        return this
    }
    */

    syncFromNode () {
        super.syncFromNode()
        //this.debugLog(" syncFromNode")
		
        this.node().prepareToSyncToView()
        //this.syncValueViewToNode() // (lazy) set up the value view to match the field's type

        const node = this.node()
        const keyView = this.keyView()
        const valueView = this.valueView()
        const noteView = this.noteView()
        const errorView = this.errorView()

        if (node.isVisible()) {
            this.setDisplay("block")
        } else {
            this.setDisplay("none")
        }

        keyView.setInnerHTML(this.visibleKey())

        let newValue = this.visibleValue()
		
        /*
        console.log("")
        console.log("FieldRow.syncFromNode:")
        console.log("  valueView.type() === ", valueView.type())
        console.log("  valueView.innerHTML() === '" + valueView.innerHTML() + "'")
        console.log("  valueView.value === ", valueView.value)
        console.log("  newValue =  '" + newValue + "'")
        */
        
        if (newValue === null) { 
            // commenting out - this causes a "false" to be displayed in new fields
            //newValue = false; // TODO: find better way to deal with adding/removing new field
        } 

        valueView.setValue(newValue)
        
        // visible
        keyView.setIsVisible(node.keyIsVisible())

        if (node.keyIsVisible()) {
            keyView.setDisplay("inline-block")
        } else {
            keyView.setDisplay("none")
        }
		

        this.verticallyCenterContent()

        // editable
        keyView.setIsEditable(node.keyIsEditable())
        valueView.setIsEditable(node.valueIsEditable())

        keyView.setColor(this.keyViewColor())

        if (!node.valueIsEditable()) {
            //console.log("fieldview key '", node.key(), "' node.valueIsEditable() = ", node.valueIsEditable(), " setColor ", this.uneditableColor())
            //valueView.setColor(this.uneditableColor())
            valueView.setColor(this.styles().disabled().color())
            valueView.setBorder("1px solid rgba(255, 255, 255, 0.05)")
        } else {
            //valueView.setColor(this.editableColor())
            valueView.setColor(this.currentStyle().color())
            //valueView.setBorder("1px solid #444")
        }
		
        // change color if value is invalid
		
        const color = valueView.color()
        
        if (node.valueError()) {
            //valueView.setColor(this.errorColor())
            //valueView.setToolTip(node.valueError())
            errorView.setColor(this.errorColor())
            errorView.setInnerHTML(node.valueError())
            errorView.fadeInHeightToDisplayBlock(15)

        } else {
            //valueView.setBackgroundColor("transparent")
            //valueView.setBorder("1px solid white")
            //valueView.setBorderRadius(5)
            //valueView.setBackgroundColor(this.valueBackgroundColor())
            valueView.setBackgroundColor("transparent")
            valueView.setColor(color)
            //valueView.setToolTip("")
            //errorView.setDisplay("none")
            //errorView.setInnerHTML("")
            errorView.fadeOutHeightToDisplayNone()
        }
				
        if (this.visibleNote()) {
            noteView.setDisplay("block")
            noteView.setInnerHTML(this.visibleNote())
        } else {
            noteView.setDisplay("none")
            noteView.setInnerHTML("")
        }

        return this
    }

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
		
        const node = this.node()

        if (node && node.nodeMinRowHeight()) {
            if (node.nodeMinRowHeight() === -1) {
                this.setHeight("auto")
                this.setPaddingBottom("calc(100% - 20px)")

            } else {
                this.setHeight(this.pxNumberToString(node.nodeMinRowHeight()))
            }
        }
        
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
