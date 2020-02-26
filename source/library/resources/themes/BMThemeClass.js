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
        this.setTitle("Untitled ThemeClass")
        this.setNodeMinWidth(270)
        this.setCanDelete(true)
        this.setSubnodeProto(BMThemeState)
        this.setNodeCanReorderSubnodes(true)
    }

    /*
    setupSubnodes () {
        const classProto = window[this.title()]
        const stateNames = ["active", "inactive", "disabled"]
        const stateNodes = stateNames.map(function (stateName) {
            return BMThemeClassState.clone().setDivClassName(stateName)
        })
        this.copySubnodes(stateNodes);
        return this
    }
    */

}.initThisClass()
