"use strict";

/*

    BMTextAreaField
    
*/

(class BMTextAreaField extends BMField {
    
    static availableAsNodePrimitive () {
        return true;
    }

    static canOpenMimeType (mimeType) {
        return mimeType.startsWith("text/plain");
    }

    static openMimeChunk (dataChunk) {
        const newNode = this.clone();
        newNode.setValue(dataChunk.decodedData());
        newNode.setKeyIsEditable(true);
        newNode.setValueIsEditable(true);
        newNode.setCanDelete(true);
        return newNode;
    }

    initPrototypeSlots () {
        this.newSlot("isMono", false);
    }

    init () {
        super.init()
        this.setKeyIsVisible(false);
    }

    appendToValue (text) {
        this.setValue(this.value() + text);
        return this
    }

    syncFromTarget () {
        super.syncFromTarget();
        
        return this
    }
    
}.initThisClass());
