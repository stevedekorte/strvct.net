"use strict";

/*
    
    HeaderTile
    
*/

(class HeaderTile extends TitledTile {
    
    initPrototype () {
    }

    init () {
        super.init()
        //this.contentView().setPaddingLeft("1.5em") // TitledTile.titleLeftPadding()
        this.setIsSelectable(true)
        //this.setBorder("1px dashed rgba(255, 255, 0, .1)")
        return this
    }

    makeOrientationDown () {
        super.makeOrientationDown()
        this.setMinAndMaxWidth(null)
        this.setWidth("100%")
        return this
    }

}.initThisClass());
