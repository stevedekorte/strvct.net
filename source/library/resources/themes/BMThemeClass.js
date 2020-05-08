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
        this.setSubnodeClasses([BMThemeState, BMThemeFolder])
        this.setNodeCanReorderSubnodes(true)

    }

    didInit () {
        super.didInit()
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

    unselectedThemeState () {
        return this.firstSubnodeWithTitle("unselected")
    }

    selectedThemeState () {
        return this.firstSubnodeWithTitle("selected")
    }

    setupAsDefault() {
        this.setTitle("DefaultThemeClass")
        this.setupSubnodes()
        this.subnodes().forEach(sn => sn.didInit())

        {
            const unselected = this.unselectedThemeState()
            unselected.firstSubnodeWithTitle("color").setValue("#bbb")
            unselected.firstSubnodeWithTitle("backgroundColor").setValue("transparent")
        }

        {
            const selected = this.selectedThemeState()
            selected.firstSubnodeWithTitle("color").setValue("white")
            selected.firstSubnodeWithTitle("backgroundColor").setValue("#333")
        }

        {
            const columns = BMThemeFolder.clone().setTitle("columns")
            this.addSubnode(columns)

            const colors = [
                [60, 60, 60],
                [48, 48, 48],
                [32, 32, 32],
                [26, 26, 26],
                [16, 16, 16],
            ]

            colors.forEach(c => {
                const cssColorString = "rgb(" + c.join(",") + ")"
                const field = BMStringField.clone().setKey("backgroundColor").setValue(cssColorString)
                columns.addSubnode(field)
            })
        }

        return this
   }

}.initThisClass()
