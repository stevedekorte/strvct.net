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
        fontSizeSlot.setCanInspect(true).setSlotType("Number").setLabel("Font size")

        const colorSlot = this.newSlot("color", null).setShouldStoreSlot(true)
        fontSizeSlot.setCanInspect(true).setSlotType("String").setLabel("Color")

        const bgColorSlot = this.newSlot("backgroundColor", null).setShouldStoreSlot(true)
        bgColorSlot.setCanInspect(true).setSlotType("String").setLabel("Background color")

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
        this.setSubnodeProto(BMCreatorNode)
        this.setNodeColumnStyles(BMViewStyles.clone())
        //this.setNodeRowStyles(BMViewStyles.clone())
        this.customizeNodeRowStyles().setToBlackOnWhite().selected().setBackgroundColor("red")
    }

    /*
    didLoadFromStore () {
        super.didLoadFromStore()
        this.subnodes().forEach( (subnode) => { subnode.setCanDelete(true) });
        this.subnodes().forEach( (subnode) => { subnode.setNodeCanInspect(true) });
        return this
    }
    */

    acceptedSubnodeTypes () {
        return BMCreatorNode.fieldTypes()
    }

    onDidEdit (aView) {
        this.setFontSize(this.titleView().computedFontSize())
        this.setColor(this.titleView().computedColor())
        this.setBackgroundColor(this.titleView().computedBackgroundColor())
        return true
    }

}.initThisClass()

