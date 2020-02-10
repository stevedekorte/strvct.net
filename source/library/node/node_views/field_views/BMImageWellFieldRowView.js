"use strict"

/*

    BMImageWellFieldRowView

*/

window.BMImageWellFieldRowView = class BMImageWellFieldRowView extends BMFieldRowView {
    
    initPrototype () {

    }

    init () {
        super.init()
        this.valueViewContainer().flexCenterContent()
        this.valueViewContainer().setPadding("0px")

        //this.keyView().setDivClassName("BMImageWellKeyField")
        //this.valueView().setIsEditable(false)
        this.turnOffUserSelect()
        this.keyView().setTransition("all 0.3s")
        //this.valueViewContainer().setPadding("0px")
        return this
    }

    createValueView () {
        const imageWellView = ImageWellView.clone()
        imageWellView.setWidth("100%").setHeight("fit-content")
        return imageWellView
    }
	
    imageWellView () {
        return this.valueView()
    }

    syncFromNode () {
        super.syncFromNode()

        const field = this.node()
        this.setMaxWidth("100em") // get this from node instead?
        
        this.applyStyles() // normally this would happen in updateSubviews
        this.imageWellView().setImageDataUrl(field.value())

        return this
    }

    syncToNode () {
        const field = this.node()
				
        //this.updateKeyView()
        
        field.setKey(this.keyView().value())

        if (field.valueIsEditable()) {
            const data = this.imageWellView().imageDataUrl()
            //console.log("data = " + (data ? data.slice(0, 40) + "..." : "null"))
        	field.setValue(data)
        }
        
        //super.suncToNode()
        return this
    }

    dataUrl () {
        return this.imageWellView().imageDataUrl()
    }

    isEmpty () {
        return Type.isNull(this.dataUrl())
    }
    /*
    updateKeyView () {
        let opacity = 1
        
        if(this.node().onlyShowsKeyWhenEmpty && this.node().onlyShowsKeyWhenEmpty()) {
		    opacity = this.isEmpty() ? 0 : 1
        }
        
	    this.keyView().setOpacity(opacity)
	    
        return this
    }
    */
    
    didUpdateImageWellView (anImageWell) {
        //this.debugLog(".didUpdateImageWellView()")
        this.scheduleSyncToNode() 
        return this
    }
    
}.initThisClass()
