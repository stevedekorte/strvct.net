"use strict"

/*

    BMJsonNullField
    

*/
        
window.BMJsonNullField = class BMJsonNullField extends BMField {
    
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
        //this.setNoteIconName("right arrow")

        this.setTitle("Null")
    }
    
    copyArchiveDict () {
        return this.jsonArchive()
    }

    jsonArchive() {
        return null
    }

    setJson (json) {
        return this
    }
    
}.initThisClass()
