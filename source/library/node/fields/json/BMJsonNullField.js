"use strict";

/*

    BMJsonNullField
    

*/
        
(class BMJsonNullField extends BMField {
    
    initPrototype () {
    }

    init () {
        super.init()
        this.setNodeCanEditTitle(true)
        this.setNodeCanEditSubtitle(false)
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(false)
        this.setNodeCanReorderSubnodes(false)
        this.setCanDelete(true)
        //this.setNoteIconName("right-arrow")

        this.setKeyIsVisible(false)
        this.setValue("NULL")
        //this.setValueIsEditable(false)
        //this.overrideSlot("valueIsEditable", false).setInitValue(false)
    }

    jsonArchive () {
        return null
    }

    setJson (json) {
        return this
    }


    setValueIsEditable (aBool) {
        /*
        if (aBool) {
            console.log(this.type() + " setValueIsEditable true")
        }
        */
        return super.setValueIsEditable(false)
    }
    
}.initThisClass());
