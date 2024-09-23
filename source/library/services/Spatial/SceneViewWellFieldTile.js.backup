"use strict";

/*

    SceneViewWellFieldTile

*/

(class SceneViewWellFieldTile extends BMFieldTile {
    
    canOpenMimeType (mimeType) {
        // TODO: add checks for browser supported image types?
        return mimeType.startsWith("model/")
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("dataViewClass", SceneView);
            slot.setSlotType("Class");
        }
    }

    init () {
        super.init();
        this.valueViewContainer().flexCenterContent();
        this.valueViewContainer().setPaddingTop("0px").setPaddingBottom("0px");
        this.valueView().setPaddingTop("0px").setPaddingBottom("0px");

        //this.keyView().setElementClassName("BMImageWellKeyField");
        //this.valueView().setIsEditable(false);
        this.turnOffUserSelect();
        this.keyView().setTransition("color 0.3s");
        //this.valueViewContainer().setPadding("0px");
        return this;
    }

    createValueView () {
        const instance = this.dataViewClass().clone();
        //instance.setWidth("100%").setHeight("fit-content");
        return instance;
    }

    syncFromNode () {
        super.syncFromNode()

        const field = this.node()
        this.setMaxWidth("100em") // get this from node instead?
        
        this.applyStyles() // normally this would happen in updateSubviews
        this.valueView().setDataUrl(field.value())
        this.valueView().setIsEditable(field.valueIsEditable())

        return this
    }

    syncToNode () {
        const field = this.node()
				
        //this.updateKeyView()
        
        field.setKey(this.keyView().value())

        if (field.valueIsEditable()) {
            const data = this.valueView().dataUrl()
            //console.log("data = " + (data ? data.slice(0, 40) + "..." : "null"))
        	field.setValue(data)
        }
        
        //super.suncToNode()
        return this
    }

    dataUrl () {
        return this.valueView().dataUrl()
    }

    isEmpty () {
        return Type.isNull(this.dataUrl())
    }
    
    /*
    didUpdateImageWellView (anImageWell) {
        //this.debugLog(".didUpdateImageWellView()")
        this.scheduleSyncToNode() 
        return this
    }
    */
    
}.initThisClass());
