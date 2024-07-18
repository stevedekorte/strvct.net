"use strict";

/*

    BMImageWellField

*/
        
(class BMImageWellField extends BMField {

    static availableAsNodePrimitive () {
        return true
    }
    
    static supportedMimeTypes () {
        return new Set(["image/jpeg", "image/gif", "image/png"])
    }

    static canOpenMimeType (mimeType) {
        return this.supportedMimeTypes().has(mimeType)
    }

    static openMimeChunk (dataChunk) {
        const newNode = this.clone()
        newNode.setValue(dataChunk.dataUrl())
        //newNode.setValue(dataChunk.decodedData())
        newNode.setKeyIsEditable(true)
        newNode.setValueIsEditable(true)
        newNode.setCanDelete(true)
        return newNode
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("onlyShowsKeyWhenEmpty", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("isEditable", true);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.overrideSlot("nodeMinTileHeight");
            slot.setShouldStoreSlot(true);
        }
    }

    initPrototype () {
        this.setKey("Image title");
        this.setKeyIsEditable(false);
        this.setValueIsEditable(false);
        this.setNodeCanEditTileHeight(true);
    }

    summaryValue () {
        return ""
    }
   
}.initThisClass());
