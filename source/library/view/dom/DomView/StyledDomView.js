"use strict";

/*
    StyledDomView

    (a step towards eliminating the remaining css files)

    A base view to handle styles in a uniform way. 
    Holds an instance of BMViewStyles which holds a set of BMViewStyle instances, one for each style.

    Overview:

        StyledDomView
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
    - active 
    - disabled

*/


(class StyledDomView extends FlexDomView {
    
    initPrototypeSlots () {
        this.newSlot("styles", null)
        this.newSlot("isSelected", false).setOwnsSetter(true).setDoesHookSetter(true)
        this.newSlot("isActive", false).setOwnsSetter(true).setDoesHookSetter(true)
        this.newSlot("isDisabled", false).setOwnsSetter(true).setDoesHookSetter(true)
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
    recursivelyApplyStyles () {
        this.applyStyles()
        this.allSubviewsRecursively().forEach(view => {
            if (view.applyStyles) {
                view.applyStyles()
            }
        })
        return this
    }
    */
	
    applyStyles () {
        // we default to using the current theme, but 
        // we need to give view a chance to override style
        // also, NodeView should override this method to give node a chance to override style

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

    themePathArray () {
        // using this is problematic as we may want to make the path 
        // dependent of complex things e.g. if the themeClassName isn't
        // found, we will default to DefaultThemeClass - or we may want
        // to continue the search for a themeClass by walking up the View's
        // class hierarchy names

        const path = []

        const themeClassName = this.themeClassName()
        if (themeClassName) {
            path.push(themeClassName)
        } else {
            path.push("DefaultThemeClass")
        }

        const stateName = this.currentThemeStateName() 
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

    currentThemeStateName () {
        let stateName = this.isSelected() ? "selected" : "unselected"
        if (this.hasFocus()) { // this.isActive()
            stateName = "active"
        }

        /*
        if (this.isEditable()) {
            return "editable" //["selected", "active", "editable", "disabled"]
        }

        return "disabled"
        */
        return stateName
    }

    currentThemeState () {
        const tc = this.currentThemeClass() 
        let state = null
        if (tc) {
            let stateName = this.currentThemeStateName()
            const state = tc.firstSubnodeWithTitle(stateName)
            assert(state)
            return state
        }
        return null
    }

    themePathString () {
        return this.themePathArray().join(" / ")
    }

    themeValueForAttribute (attributeName) {
        const stateNode = this.currentThemeState()
        if (stateNode) {
            const attribtueNode = stateNode.firstSubnodeWithTitle(attributeName)
            if (attribtueNode) {
                const value = attribtueNode.value()
                if (!value) {
                    console.log("no color found for ", this.themePathString() + " / " + attributeName)
                    return null
                }
                //console.log("theme: " + fullPathString + " = " + value)
                return value
            }
        }

        //console.log("no attribute node found for ", this.themePathString() + " / " + attributeName)
        return null
    }

    // -------------------------------------

    currentColor () {
        const v = this.themeValueForAttribute("color")
        if (v) {
            return v
        }
        //console.log(this.typeId() + ".themeValueForAttribute('color') = ", v)
        //debugger;
        return "yellow"
    }

    currentBgColor () {
        const v = this.themeValueForAttribute("backgroundColor")
        if (v) {
            return v
        }
        return "orange"
    }
	
}.initThisClass());
