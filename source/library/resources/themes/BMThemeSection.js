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

}.initThisClass()
