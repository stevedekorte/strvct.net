"use strict";

/*

    BMThemeLevel

*/

(class BMThemeLevel extends BMStorableNode {
    
    initPrototype () {

    }

    init () {
        super.init()

        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true) 
        
        this.setNodeCanEditTitle(true)
        this.setTitle("Untitled " + this.thisClass().visibleClassName())
        this.setNodeCanEditTitle(false)
        this.setNodeMinWidth(200)
        this.setCanDelete(true)
        this.addAction("add")
        this.setSubnodeClasses([BMThemeFolder, BMThemeClass])
        this.setNodeCanReorderSubnodes(true)
    }

    updateTitle () {
        const pn = this.parentNode()
        if (pn) {
            const index = pn.indexOfSubnode(this)
            if (index !== -1) {
                this.setTitle("Level " + index)
            }
        }
    }

    
    didUpdateSlotParentNode (oldValue, newValue) {
        super.didUpdateSlotParentNode(oldValue, newValue)
        this.updateTitle()
        return this
    }
    

    didReorderParentSubnodes () {
        super.didReorderParentSubnodes()
        this.updateTitle()
        return this
    }


}.initThisClass())
