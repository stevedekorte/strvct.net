"use strict"

/*

    BMThemeClass

*/

window.BMThemeClass = class BMThemeClass extends BMStorableNode {
    
    initPrototype () {

    }

    init () {
        super.init()

        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true) 
        
        this.setNodeCanEditTitle(true)
        this.setTitle("Untitled " + this.thisClass().visibleClassName())
        //this.setSubtitle("ThemeClass")
        this.setNodeMinWidth(200)
        this.setCanDelete(true)
        this.addAction("add")
        this.setSubnodeClasses([BMThemeState])
        this.setNodeCanReorderSubnodes(true)

    }

    didInit () {
        //console.log(this.typeId() + " subnodes: ", this.subnodes())
        this.setupSubnodes()
    }

    /*
    didLoadFromStore () {
        super.didLoadFromStore()
        this.setupSubnodes()
    }
    */

    subnodeNames () {
        return BMThemeState.standardStateNames()
    }

    setupSubnodes () {
        const subnodeClass = this.subnodeClasses().first()
        this.subnodeNames().forEach(name => {
            const subnode = this.subnodeWithTitleIfAbsentInsertProto(name, subnodeClass)
            
        })

    }

    /*
    setSubnodes (v) {
        return super.setSubnodes(v)
    }
    */

}.initThisClass()
