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
        {
            const slot = this.newSlot("themeClassName", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("isSelected", false);
            slot.setOwnsSetter(true);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("isActive", false);
            slot.setOwnsSetter(true);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("isDisabled", false);
            slot.setOwnsSetter(true);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("lockedStyleAttributeSet", null);
            slot.setSlotType("Set");
        }
    }

    init () {
        super.init()
        this.setLockedStyleAttributeSet(new Set());
        Broadcaster.shared().addListenerForName(this, "onActivateView"); // NOTE: do we want *every* view to do this 
        return this;
    }

    syncStateFrom (aView) {
        this.setIsSelected(aView.isSelected())
        this.setIsActive(aView.isActive())
        return this
    }

    // theme path

    themeClassNamePath () {
        // search up the view ancestors and compose a path
        if (this.themeClassName()) {
            const path = [this.themeClassName()]
            this.forEachAncestorView(view => {
                if (view.themeClassName) {
                    const k = view.themeClassName()
                    if (k) {
                        path.push(k)
                    }
                }
            })
            path.reverse()
            return path
        }
        return null
    }

    // styles

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

    // --- activate ---

    didUpdateSlotIsActive (oldValue, newValue) {
        // sent by hooked setter
        this.updateSubviews()
        return this
    }

    activate () {
        this.select()
        this.setIsActive(true)
        Broadcaster.shared().broadcastNameAndArgument("onActivateView", this)
    }

    onActivateView (aView) {
        if (aView !== this & this.isActive()) {
            this.setIsActive(false)
        }
    }

    // --- select ---

    didUpdateSlotIsSelected (oldValue, newValue) {
        // sent by hooked setter
        this.updateSubviews()
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

    // --- path array for debugging --------------------------------------
    
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

    themePathString () {
        return this.themePathArray().join(" / ")
    }
    
    // --- getting current theme/state/attribute ---

    // --- theme class ---

    currentThemeClass () {
        const theme = BMThemeResources.shared().activeTheme()
        if (!theme) {
            return null
        }
        const className = this.themeClassName() ? this.themeClassName() : "DefaultThemeClass"
        const themeClass = theme.themeClassNamed(className)
        return themeClass
    }

    // --- theme state ---

    currentThemeStateName () {
        let stateName = "unselected"

        if (this.isDisabled()) {
            stateName = "disabled" // should this mix with selected?
        }

        if (this.isSelected()) {
            stateName = "selected"
        }

        if (this.isActive()) {
            stateName = "active"
        }

        return stateName
    }

    currentThemeState () {
        const tc = this.currentThemeClass() 
        if (tc) {
            const stateName = this.currentThemeStateName()
            const state = tc.stateWithName(stateName)
            assert(state)
            return state
        }
        return null
    }

    // --- theme attribute ---

    themeValueForAttribute (attributeName) {
        const stateNode = this.currentThemeState()
        if (stateNode) {
            const attribtueNode = stateNode.attributeNamed(attributeName)
            if (attribtueNode) {
                const value = attribtueNode.value()
                if (!value) {
                    console.log("no attribute found for ", this.themePathString() + " / " + attributeName)
                    return null
                }
                //console.log("theme: " + fullPathString + " = " + value)
                return value
            }
        }

        //console.log("no attribute node found for ", this.themePathString() + " / " + attributeName)
        return null
    }

    // --- theme attribute helpers ----------------------------------

    currentColor () {
        const v = this.themeValueForAttribute("color")
        if (v) {
            return v
        }
        return "inherit"
    }

    currentBgColor () {
        const v = this.themeValueForAttribute("backgroundColor")
        if (v) {
            return v
        }
        return "inherit"
    }

    resyncAllViews () {
        this.syncStylesToSubviews()
        this.applyStyles()
        super.resyncAllViews()
        return this
    }

    syncStylesToSubviews () {
        return this
    }
	
}.initThisClass());
