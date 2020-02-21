"use strict"

/*

    BMThemeClassState

*/

window.BMThemeClassState = class BMThemeClassState extends BMStorableNode {
    
    static standardStateNames () {
        return ["active", "selected", "unselected", "disabled"]
    }

    initPrototype () {

    }

    init () {
        super.init()
        this.setShouldStore(true)
        //this.setSubtitle("state")
        this.setNodeMinWidth(200)
        this.setupSubnodes()
    }

    attributeNames () {
        // TODO: request this from the view class, use view class theme state methods instead of direct css keys
        //return ["background", "color", "border"] 
        return BMViewStyle.styleNames()
    }

    syncFromViewStyle () {
  
        return this
    }

    setupSubnodes () {
        this.attributeNames().forEach((attributeName) => {
            const field = BMField.clone().setKey(attributeName).setValueIsEditable(""); // TODO: no .setValueMethod()??
            this.addStoredField(field)
        })
        return this
    }
    
}.initThisClass()


