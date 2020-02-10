"use strict"

/*

    BMTextAreaFieldRowView

*/

window.BMTextAreaFieldRowView = class BMTextAreaFieldRowView extends BMFieldRowView {
    
    canOpenMimeType (mimeType) {
        return mimeType.beginsWith("text/")
    }

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
        
        this.fillBottomOfColumnIfAvailable()
		
        if (this.node().isMono()) {
            this.valueView().setDivClassName("BMMonoTextAreaFieldValueView NodeView DomView")
        } else {
            this.valueView().setDivClassName("BMTextAreaFieldValueView NodeView DomView")
        }
		
        return this
    }
	
    fillBottomOfColumnIfAvailable () {
        if (this.column().rows().last() === this) {
            //this.debugLog(" update height")
            this.setMinAndMaxHeightPercentage(100)
            this.setFlexGrow(100)
            this.setBorderBottom("0px")
        } else {
            this.setFlexGrow(1)
            this.setBorderBottom("1px solid rgba(125, 125, 125, 0.5)")
        }
        return this
    }
    
}.initThisClass()
