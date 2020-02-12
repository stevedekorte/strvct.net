"use strict"

/*

    BMTextAreaFieldRowView

*/

window.BMTextAreaFieldRowView = class BMTextAreaFieldRowView extends BMFieldRowView {
    
    initPrototype () {

    }

    init () {
        super.init()
        const cv = this.contentView()
        cv.setHeight("auto")
        cv.alignItems("flex-start")
        cv.setJustifyContent("flex-start")

        this.keyView().hideDisplay()

        //this.valueView().setDivClassName("BMTextAreaFieldValueView")
        return this
    }

    createValueView () {
        const vv = NodeView.clone().setDivClassName("BMTextAreaFieldValueView NodeView DomView")
        vv.setWordWrap("normal")
        vv.setHeight("auto")
        vv.setWidth("-webkit-fill-available")
        vv.setTextAlign("left")
        vv.setPosition("relative")
        vv.setMargin("0px")
        vv.setOverflowX("hidden")
        vv.setOverflowY("scroll")

        /*
            display: flex;
            position: relative;
            margin: 20px;
            width: auto;
            min-height: auto;

            word-break: break-all;
            unicode-bidi: embed;
            white-space: pre-wrap;

            font-weight: normal;
            text-align: left;
        */
        return vv
    }
	
    updateSubviews () {   
        super.updateSubviews()
        
        //this.fillBottomOfColumnIfAvailable()
        this.setFlexGrow(100)
        //this.setMaxHeight(this.columnGroup().clientHeight() + "px")

        this.setMaxHeight("400px")

        if (this.node().isMono()) {
            this.valueView().setDivClassName("BMMonoTextAreaFieldValueView NodeView DomView")
        } else {
            this.valueView().setDivClassName("BMTextAreaFieldValueView NodeView DomView")
        }
		
        return this
    }

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
