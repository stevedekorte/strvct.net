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
        //this.valueView().setDivClassName("BMTextAreaFieldValueView")
        return this
    }

    createValueView () {
        return NodeView.clone().setDivClassName("BMTextAreaFieldValueView NodeView DomView")
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
