"use strict"

/*

    BMThemeSection

*/

window.BMThemeSection = class BMThemeSection extends BMStorableNode {
    
    initPrototype () {

    }

    init () {
        super.init()
        this.setShouldStore(true)
        this.setNodeCanEditTitle(true)
        this.setTitle("Untitled theme section")
        this.setNodeMinWidth(270)
        this.setupSubnodes()
        this.setCanDelete(true)

        this.setSubnodeProto(ThemeSection)
    }

    /*
    didLoadFromStore () {
        super.didLoadFromStore()
        // called after all objects loaded within this event cycle
        this.setupSubnodes()
    }

    setupSubnodes () {
        // setup with all view classes
        
        const viewClasses = DomView.descendantClasses()

        viewClasses = viewClasses.select((viewClass) => {
            return viewClass.hasOwnProperty("styles")
        }).select((viewClass) => { return !viewClass.styles().isEmpty() })

        //console.log("viewClasses:", viewClasses)
        const themeClasses = viewClasses.map((childProto) => {
            return BMThemeClass.clone().setTitle(childProto.type());
        })

        this.copySubnodes(themeClasses);
        return this
    }
    */

}.initThisClass()
