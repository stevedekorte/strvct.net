"use strict";

/*

    BMBooleanFieldTile

*/

(class BMBooleanFieldTile extends BMFieldTile {
    
    /*
    initPrototypeSlots () {
    }
    */

    init () {
        super.init()
        
        this.turnOffUserSelect()
        this.keyView().setTransition("color 0.3s")
        this.keyView().setPaddingLeft("0.5em")

        this.valueView().parentView().flexCenterContent()
        this.valueView().setPaddingBottom("0em")

        this.keyView().setPaddingTop("0em")
        this.keyView().setPaddingBottom("0.35em")

        //this.contentView().debugBorders()
        this.kvSection().subviews().at(1).flexCenterContent()
        //this.contentView().setFlexDirection("column")
        this.kvSection().setFlexDirection("row").makeSubviewsReverseOrdered()
        //this.kvSection().subviews().forEach(sv => sv.setAlignItems("center"))
        this.kvSection().subviews().forEach(sv => sv.flexCenterContent())
        //this.keyView().parentView().swapSubviews(this.keyView(), this.valueView())

        this.setValueEditableBorder("none")
        this.setValueUneditableBorder("none")

        return this
    }

    createValueView () {
        const bv = BooleanView.clone()
        return bv
    }
	
    booleanView () {
        return this.valueView()
    }

    syncFromNode () {
        super.syncFromNode()
        this.booleanView().updateAppearance()
        return this
    }
    
}.initThisClass());
