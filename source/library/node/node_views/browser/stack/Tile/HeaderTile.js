"use strict";

/*
    
    HeaderTile
    
*/

(class HeaderTile extends TitledTile {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        this.setIsSelectable(true)
        this.setThemeClassName("HeaderTile")
        return this
    }

    makeOrientationDown () {
        super.makeOrientationDown()
        this.setMinAndMaxWidth(null)
        this.setWidth("100%")
        return this
    }

    applyStyles () {
        //debugger
        super.applyStyles()

        return this
    }


}.initThisClass());
