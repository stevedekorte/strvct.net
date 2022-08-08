"use strict";

/*

    BMTextAreaFieldTile

    
*/

(class BMTextAreaFieldTile extends BMFieldTile {
    
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
        /* old css:
        .BMTextAreaFieldValueView {
            display: flex;
            position: relative;
            padding: 0;
            margin: 0;
            width: auto;
            min-height: auto;

            word-break: break-all;
            unicode-bidi: embed;
            white-space: pre-wrap;

            font-weight: normal;
            text-align: left;
        }
        */

        const v = TextField.clone().setElementClassName("BMTextAreaFieldValueView")
        v.setDisplay("block")
        v.setPosition("relative")
        v.setWordWrap("normal")
        v.setHeight("auto")
        v.setWidth("-webkit-fill-available")
        v.setTextAlign("left")
        v.setMargin("0em")
        v.setOverflowX("hidden")
        v.setOverflowY("scroll")
        //v.setFontFamily("Mono")
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
        if (this.column().tiles().last() === this) {
            //this.debugLog(" update height")
            this.setMinAndMaxHeightPercentage(100)
            this.setFlexGrow(100)
            this.setBorderBottom("0em")

            this.valueView().setHeight("100%")
        } else {
            this.setFlexGrow(1)
            this.setBorderBottom("1px solid rgba(125, 125, 125, 0.5)")
        }
        return this
    }
    */
    
}.initThisClass());
