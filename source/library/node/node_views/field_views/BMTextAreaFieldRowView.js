"use strict"

/*

    BMTextAreaFieldRowView

    
*/

window.BMTextAreaFieldRowView = class BMTextAreaFieldRowView extends BMFieldRowView {
    
    initPrototype () {
    }

    init () {
        super.init()
        this.keyView().hideDisplay()
        this.setValueUneditableBorder("none")
        this.setValueEditableBorder("none")
        return this
    }

    createValueView () {
        const v = TextField.clone().setDivClassName("BMTextAreaFieldValueView")
        v.setDisplay("block")
        v.setPosition("relative")
        v.setWordWrap("normal")
        v.setHeight("auto")
        v.setWidth("-webkit-fill-available")
        v.setTextAlign("left")
        v.setMargin("0px")
        v.setOverflowX("hidden")
        v.setOverflowY("scroll")
        //v.setDoesHoldFocusOnReturn(true)
        v.setDoesInput(false)
        return v
    }
    
    /*
    updateSubviews () {   
        super.updateSubviews()

        return this
    }
    */

    /*
	
    fillBottomOfColumnIfAvailable () {
        if (this.column().rows().last() === this) {
            //this.debugLog(" update height")
            this.setMinAndMaxHeightPercentage(100)
            this.setFlexGrow(100)
            this.setBorderBottom("0px")

            this.valueView().setHeight("100%")
        } else {
            this.setFlexGrow(1)
            this.setBorderBottom("1px solid rgba(125, 125, 125, 0.5)")
        }
        return this
    }
    */
    
}.initThisClass()
