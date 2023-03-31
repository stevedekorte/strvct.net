"use strict";

/*
    
    BMTextNodeTile
    
*/

(class BMTextNodeTile extends Tile {
    
    initPrototypeSlots () {
        this.newSlot("textView", null)
    }

    init () {
        super.init()

        const cv = this.contentView()
        cv.setMinHeight("1em")

        const tv = TextField.clone()
        this.setTextView(tv)
        this.contentView().addSubview(tv)

        tv.setDisplay("flex")
        //tv.setFlex("10")
        tv.setAlignItems("flex-start") // alignment in direction of flex
        tv.setJustifyContent("center") // alignment perpendicutal to flex
        tv.setFlexDirection("column")
        tv.setWidth("100%")
        tv.setMinHeight("1em")
        tv.setIsEditable(true)

        tv.setUsesDoubleTapToEdit(true)
        tv.setOverflow("visible")

        this.updateSubviews()
        this.setIsSelectable(true)
        return this
    }
    
    // ---

    desiredWidth () {
        return this.calcWidth()
    }

    // --- edit ---

    didInput () {
        this.scheduleSyncToNode()
    }

    onDidEdit (aView) {
        super.onDidEdit() 
        return true // stop propogation
    }

    // --- sync ---

    syncToNode () {   
        //console.log("syncToNode")
        const node = this.node()
        node.setValue(this.textView().innerText())
        return this
    }
    
    syncFromNode () {
        const node = this.node()
        if (!node) {
            return 
        }
        
        this.textView().setString(node.value())

        this.applyStyles()
        return this
    }

    applyStyles () {
        console.log(this.type() + " themeClassName ", this.node().themeClassName())
        super.applyStyles()
        return this
    }

}.initThisClass());
