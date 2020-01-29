"use strict"

/*
    
    BMTextNode
    
    A node that contains Text, stores it's:
        content, color, font, padding, margin
    and has an inspector for these attributes
    
    support for links?

*/

window.BMTextNode = class BMTextNode extends BMStorableNode {
    
    initPrototype () {
        this.protoAddStoredSlot("title")
        /*
        this.protoAddStoredSlot("fontSize")
        this.protoAddStoredSlot("color")
        this.protoAddStoredSlot("backgroundColor")
        */
       
        const fontSizeSlot = this.newSlot("fontSize", null).setShouldStoreSlot(true)
        fontSizeSlot.setCanInspect(true).setSlotType("Number").setLabel("Font size").setSyncsToView(true)

        const colorSlot = this.newSlot("color", null).setShouldStoreSlot(true)
        colorSlot.setCanInspect(true).setSlotType("String").setLabel("Color").setSyncsToView(true)

        const bgColorSlot = this.newSlot("backgroundColor", null).setShouldStoreSlot(true)
        bgColorSlot.setCanInspect(true).setSlotType("String").setLabel("Background color").setSyncsToView(true)

        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setCanDelete(true)
        this.setNodeCanInspect(true)
        this.setNodeMinWidth(300)

        this.setTitle("title")
        this.setNodeCanEditTitle(true)
        
        this.setNodeCanReorderSubnodes(true)
  
        this.setNodeCanEditRowHeight(true)
        this.setNodeCanEditColumnWidth(true)
    }

    init () {
        super.init()
        this.addAction("add")
        //this.setSubnodeProto(BMCreatorNode)
        //this.setNodeColumnStyles(BMViewStyles.clone())
        //this.setNodeRowStyles(BMViewStyles.clone())
        //this.customizeNodeRowStyles().setToWhiteOnBlack() //.selected().setBackgroundColor("red")
        //this.customizeNodeRowStyles().setToBlackOnWhite() //.selected().setBackgroundColor("red")
    }

    acceptedSubnodeTypes () {
        return BMCreatorNode.fieldTypes()
    }

    didUpdateSlotColor (oldValue, newValue) {
        //this.scheduleSyncToView()
        this.nodeRowStyles().selected().setColor(newValue)
        this.nodeRowStyles().unselected().setColor(newValue)
    }

    didUpdateSlotBackgroundColor (oldValue, newValue) {
        //this.scheduleSyncToView()
        this.nodeRowStyles().selected().setBackgroundColor(newValue)
        this.nodeRowStyles().unselected().setBackgroundColor(newValue)
    }
    
    /*
    didUpdateSlot (aSlot, oldValue, newValue) {
        super.didUpdateSlot(aSlot, oldValue, newValue)

        console.log(this.type() + "didUpdateSlot " + aSlot.name() )
    }
    */

}.initThisClass()

