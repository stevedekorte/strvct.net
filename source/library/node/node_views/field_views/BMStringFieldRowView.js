"use strict"

/*

    BMStringFieldRowView

*/

window.BMStringFieldRowView = class BMStringFieldRowView extends BMFieldRowView {
    
    initPrototype () {

    }

    init () {
        super.init()
        
        return this
    }

    createValueView () {
        const v = TextField.clone()
        v.setDisplay("block")
        v.setPosition("relative")
        v.setWordWrap("normal")
        v.setHeight("auto")
        v.setWidth("-webkit-fill-available")
        v.setTextAlign("left")
        v.setMargin("0px")
        v.setOverflowX("hidden")
        v.setBorderRadius("0.2em")
        return v
    }

    syncValueFromNode () {
        super.syncValueFromNode()
        
        const node = this.node()
        const valueView = this.valueView()

        if (node.valueIsEditable()) {
            valueView.setColor(this.currentColor())
            valueView.setBorder(this.valueEditableBorder())
            valueView.setPaddingLeft("0.5em").setPaddingRight("0.5em")
        } else {
            valueView.setColor(this.styles().disabled().color())
            valueView.setBorder(this.valueUneditableBorder())
            valueView.setPaddingLeft("0em").setPaddingRight("0em")
        }
    }
    
}.initThisClass()
