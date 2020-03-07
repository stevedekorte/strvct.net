"use strict"

/*
    
    BMTextNodeRowView
    
*/

window.BMTextNodeRowView = class BMTextNodeRowView extends BrowserRow {
    
    initPrototype () {
        this.newSlot("textView", null)
    }

    init () {
        super.init()

        const cv = this.contentView()
        cv.setMinHeight("1em")
        cv.setPadding("0em")

        const tv = TextField.clone()
        this.setTextView(tv)
        this.contentView().addSubview(tv)

        tv.setDisplay("flex")
        //tv.setFlex("10")
        tv.setAlignItems("flex-start") // alignment in direction of flex
        tv.setJustifyContent("center") // alignment perpendicutal to flex
        tv.setFlexDirection("column")
        tv.setWidth("100%")

        tv.setUsesDoubleTapToEdit(true)
        tv.setOverflow("visible")
        tv.setPaddingLeft("0em")

        this.updateSubviews()
        this.setIsSelectable(true)
        return this
    }

    updateSubviews () {
        super.updateSubviews()
        return this
    }
    
    // ---

    desiredWidth () {
        return this.calcWidth()
    }

    // --- edit ---

    didInput () {
        this.browser().fitColumns()
        this.scheduleSyncToNode()
    }

    onDidEdit (aView) {
        super.onDidEdit() 
        this.browser().fitColumns()
        return true // stop propogation
    }

    // --- sync ---

    syncToNode () {   
        //console.log("syncToNode")
        const node = this.node()
        node.setValue(this.textView().innerText())
        return this
    }

    themeClassName () {
        const node = this.node()
        if (node && node.themeClassName) {
            return node.themeClassName()
        }
        return super.themeClassName()
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
        //console.log("themePathArray = ", this.themePathArray())

        this.textView().setColor(this.themeValueForAttribute("color"))
        this.textView().setBackgroundColor(this.themeValueForAttribute("backgroundColor"))

        this.textView().setFontSize(this.themeValueForAttribute("fontSize"))
        this.textView().setFontFamily(this.themeValueForAttribute("fontFamily"))
        this.textView().setFontWeight(this.themeValueForAttribute("fontWeight"))

        this.textView().setLetterSpacing(this.themeValueForAttribute("letterSpacing"))
        this.textView().setLineHeight(this.themeValueForAttribute("lineHeight"))
        this.textView().setTextTransform(this.themeValueForAttribute("textTransform"))

        this.textView().setPaddingLeft(this.themeValueForAttribute("paddingLeft"))
        this.textView().setPaddingRight(this.themeValueForAttribute("paddingRight"))
        this.textView().setPaddingTop(this.themeValueForAttribute("paddingTop"))
        this.textView().setPaddingBottom(this.themeValueForAttribute("paddingBottom"))
    }
    
}.initThisClass()
