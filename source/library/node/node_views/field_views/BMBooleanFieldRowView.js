"use strict"

/*

    BMBooleanFieldRowView

*/

window.BMBooleanFieldRowView = class BMBooleanFieldRowView extends BMFieldRowView {
    
    initPrototype () {

    }

    init () {
        super.init()
        
        this.turnOffUserSelect()
        this.keyView().setTransition("color 0.3s")
        this.keyView().setPaddingLeft("0.5em")

        this.valueView().parentView().flexCenterContent()
        this.valueView().setPaddingBottom("0em")

        //this.contentView().debugBorders()
        this.titlesSection().subviews().at(1).flexCenterContent()
        //this.contentView().setFlexDirection("column")
        this.titlesSection().setFlexDirection("row").makeSubviewsReverseOrdered()
        //this.titlesSection().subviews().forEach(sv => sv.setAlignItems("center"))
        this.titlesSection().subviews().forEach(sv => sv.flexCenterContent())
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
    
}.initThisClass()
