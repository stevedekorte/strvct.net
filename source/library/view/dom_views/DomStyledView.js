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
        this.newSlot("lockedStyleAttributeSet", null)
    }

    init () {
        super.init()
        this.setLockedStyleAttributeSet(new Set())
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

    /*
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
    */
	
    applyStyles () {
        //const style = this.currentStyle()
        //style.applyToView(this)	
        const state = this.currentThemeState()
        if (state) {
            state.applyToView(this)
        }
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
        return null
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

        const themeClassName = this.themeClassName()
        if (themeClassName) {
            path.push(themeClassName)
        } else {
            path.push("DefaultThemeClass")
        }

        const stateName = this.themeStateName() 
        path.push(stateName)

        return path
    }

    currentThemeClass () {
        const theme = BMThemeResources.shared().activeTheme()
        if (!theme) {
            return null
        }
        const className = this.themeClassName() ? this.themeClassName() : "DefaultThemeClass"
        const themeClass = theme.firstSubnodeWithTitle(className)
        return themeClass
    }

    currentThemeState () {
        const tc = this.currentThemeClass() 
        let state = null
        if (tc) {
            let stateName = this.isSelected() ? "selected" : "unselected"
            const state = tc.firstSubnodeWithTitle(stateName)
            return state
        }
        return null
    }

    themeValueForAttribute (attributeName) {
        const fullPath = this.themePathArray()
        fullPath.push(attributeName)
        //console.log("fullPath = ", fullPath)

        const theme = BMThemeResources.shared().activeTheme()
        const attribtueNode = theme ? theme.nodeAtSubpath(fullPath) : null
        if (attribtueNode) {
            const value = attribtueNode.value()
            if (!value) {
                console.log("no color found for ", fullPath)
                return null
            }
            return value
        }
        console.log("no color found for ", fullPath)

        return null
    }

    // -------------------------------------

    currentColor () {
        const v = this.themeValueForAttribute("color")
        if (v) {
            return v
        }
        return "yellow"

        //console.log("this.themeValueForAttribute('color') = ", this.themeValueForAttribute('color') )
        //return this.currentStyle().color()
    }

    currentBgColor () {
        const v = this.themeValueForAttribute("backgroundColor")
        if (v) {
            return v
        }
        return "orange"

        //return this.currentStyle().backgroundColor()
    }
	
}.initThisClass()
