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
        cv.setPadding("1em")

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
        tv.setPadding("1em")
        tv.setIsEditable(true)

        tv.setUsesDoubleTapToEdit(true)
        tv.setOverflow("visible")
        tv.setPaddingLeft("0em")

        this.updateSubviews()
        this.setIsSelectable(true)
        return this
    }

    /*
    updateSubviews () {
        super.updateSubviews()
        return this
    }
    */
    
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

    // --- theme ---

    themeClassName () {
        const node = this.node()
        if (node && node.themeClassName) {
            return node.themeClassName()
        }
        return super.themeClassName()
    }

    applyStyles () {
        // TODO: add method on View to grab these values 
        // - maybe with optional prefix for item class/name?

        /*
        const state = this.currentThemeState()
        if (state) {
            state.applyToView(this.textView())
        }
        */

        
        const theme = (key) => this.themeValueForAttribute(key);
        const tv = this.textView();

        tv.setColor(theme("color"))
        tv.setBackgroundColor(theme("backgroundColor"))

        tv.setFontSize(theme("fontSize"))
        tv.setFontFamily(theme("fontFamily"))
        tv.setFontWeight(theme("fontWeight"))

        tv.setLetterSpacing(theme("letterSpacing"))
        tv.setLineHeight(theme("lineHeight"))
        tv.setTextTransform(theme("textTransform"))

        tv.setPaddingLeft(theme("paddingLeft"))
        tv.setPaddingRight(theme("paddingRight"))
        tv.setPaddingTop(theme("paddingTop"))
        tv.setPaddingBottom(theme("paddingBottom"))
    }
    
}.initThisClass());
