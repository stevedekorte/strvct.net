"use strict";

/*
    
    HeaderTile
    
*/

(class HeaderTile extends TitledTile {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        //this.contentView().setPaddingLeft("1.5em") // TitledTile.titleLeftPadding()
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

}.initThisClass());
