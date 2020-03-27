"use strict"

/*
    DomStyledView

   (one step towards eliminating the remaining css files)

    A base view to handle styles in a uniform way. 
    Holds an instance of BMViewStyles which holds a set of BMViewStyle instances, one for each style.

    Overview:

        DomStyledView
          styles -> BMViewStyles
                        selected -> BMViewStyle
                        unselected -> BMViewStyle
                                        color
                                        backgroundColor
                                        opacity
                                        borderLeft
                                        borderRight

                       
    

    Supported styles:

    - unselected
    - selected

*/


window.DomStyledView = class DomStyledView extends DomFlexView {
    
    initPrototype () {
        this.newSlot("styles", null)
        this.newSlot("isSelected", false).setOwnsSetter(true).setDoesHookSetter(true)
        //this.newSlot("themeClassName", null)
        this.newSlot("themeComponentName", null)
    }

    init () {
        super.init()
        return this
    }

    // styles

    lookedUpStyles () {
        return null
    }
	
    styles () { 
        // since not all views use them, do lazy style setup 
        if (!this._styles) {
            this.setStyles(BMViewStyles.clone()) 
        }
        return this._styles
    }

    currentStyle () {
        let style = null
        if (this.isSelected()) {
            style = this.styles().selected()
            //this.debugLog(".applyStyles() selected ", style.description())
        } else {
            style = this.styles().unselected()
            //this.debugLog(".applyStyles() unselected ", style.description())
        }
        return style
    }
	
    applyStyles () {
        const style = this.currentStyle()
        style.applyToView(this)	
        this.applyNewStyles()	
        return this
    }

    // select

    didUpdateSlotIsSelected (oldValue, newValue) {
        // sent by hooked setter
        this.applyStyles()
        return this
    }

    toggleSelection () {
        if (this.isSelected()) {
            this.unselect()
        } else {
            this.select()
        }
        return this
    }

    select () {
        this.setIsSelected(true)		
        return this
    }

    unselect () {
        if (this.isSelected()) { // for debugging 
            this.setIsSelected(false)
        }
        return this
    }

    // -----------------------------------------

    themeClassName () {
        return this.divClassName().split(" ")
    }

    themeStateName () {
        //const states = []
        /*
        if (this.isActive()) {
            return "active"
        }
        */

        if (this.isSelected()) {
            return "selected"
        }

        return "unselected"

        /*
        if (this.isEditable()) {
            return "editable" //["selected", "active", "editable", "disabled"]
        }

        return "disabled"
        */
    }

    themePathArray () {
        const path = []

        const className = this.themeClassName()
        if (className) {
            path.push(className)
        }

        const compName = this.themeComponentName()
        if (compName) {
            path.push(compName)
        } else {
            //path.push("Default")
        }

        const stateName = this.themeStateName() 
        path.push(stateName)

        return path
    }

    themeValueForAttribute (attributeName) {
        const fullPath = this.themePathArray()
        fullPath.push(attributeName)
        //console.log("fullPath = ", fullPath)

        const theme = BMThemeResources.shared().activeTheme()
        const attribtueNode = theme ? theme.nodeAtSubpath(fullPath) : null
        if (attribtueNode) {
            return attribtueNode.value()
        }
        return null
    }

    applyNewStyles () {
        /*
        const color = this.themeValueForAttribute("color")
        if (color) {
            this.setColor(color)
        }
        */
    }

    /*
        in TextField
        const style = BMThemeResources.shared().styleAtSubpath(this.themePath(), this.themeStateName())
        if (style) {
            this.applyThemeStyle(style)
        }

        //keyView.setThemePath([this.themeClassName(), "key"])
        const theme = BMThemeResources.shared().activeTheme()
        //                                                  themeClassName themeViewName themeStateName attributeName
        const colorAttribute = theme ? theme.nodeAtSubpath(["Field", "key", "editable", "color"]) : null
        if (colorAttribute) {
            keyView.setColor(colorAttribute.value())
        }
    */

    // -------------------------------------

    currentColor () {
        const v = this.themeValueForAttribute("color")
        if (v) {
            return v
        }

        //console.log("this.themeValueForAttribute('color') = ", this.themeValueForAttribute('color') )
        return this.currentStyle().color()
    }

    currentBgColor () {
        const v = this.themeValueForAttribute("backgroundColor")
        if (v) {
            return v
        }

        return this.currentStyle().backgroundColor()
    }
	
}.initThisClass()
