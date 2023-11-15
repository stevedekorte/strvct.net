"use strict";

/*

    BMImageWellFieldTile

*/

(class BMImageWellFieldTile extends BMFieldTile {
    
    canOpenMimeType (mimeType) {
        // TODO: add checks for browser supported image types?
        return mimeType.startsWith("image/")
    }

    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.valueViewContainer().flexCenterContent()
        this.valueViewContainer().setPaddingTop("0px").setPaddingBottom("0px")
        this.valueView().setPaddingTop("0px").setPaddingBottom("0px")

        //this.keyView().setElementClassName("BMImageWellKeyField")
        //this.valueView().setIsEditable(false)
        this.turnOffUserSelect()
        this.keyView().setTransition("color 0.3s")
        //this.valueViewContainer().setPadding("0px")
        return this
    }

    createValueView () {
        const imageWellView = ImageWellView.clone()
        //imageWellView.setWidth("100%").setHeight("fit-content")
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
        this.imageWellView().setIsEditable(field.valueIsEditable())

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
    
    didUpdateImageWellView (anImageWell) {
        //this.debugLog(".didUpdateImageWellView()")
        this.scheduleSyncToNode() 
        return this
    }
    
}.initThisClass());
