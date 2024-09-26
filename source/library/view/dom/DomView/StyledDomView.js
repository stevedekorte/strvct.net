"use strict";

/**
 * @module library.view.dom.DomView
 */

/**
 * @class StyledDomView
 * @extends FlexDomView
 * @classdesc StyledDomView
 * 
 * (a step towards eliminating the remaining css files)
 *
 * A base view to handle styles in a uniform way. 
 * Holds an instance of BMViewStyles which holds a set of BMViewStyle instances, one for each style.
 *
 * Overview:
 *
 *     StyledDomView
 *       styles -> BMViewStyles
 *                     selected -> BMViewStyle
 *                     unselected -> BMViewStyle
 *                                     color
 *                                     backgroundColor
 *                                     opacity
 *                                     borderLeft
 *                                     borderRight
 *
 * Supported styles:
 *
 * - unselected
 * - selected
 * - active 
 * - disabled
 */
(class StyledDomView extends FlexDomView {
    
    /**
     * @description Initializes the prototype slots for the StyledDomView.
     */
    initPrototypeSlots () {
        {
            /**
             * @member {String} themeClassName
             */
            const slot = this.newSlot("themeClassName", null);
            slot.setSlotType("String");
        }
        {
            /**
             * @member {Boolean} isSelected
             */
            const slot = this.newSlot("isSelected", false);
            slot.setOwnsSetter(true);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Boolean");
        }
        {
            /**
             * @member {Boolean} isActive
             */
            const slot = this.newSlot("isActive", false);
            slot.setOwnsSetter(true);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Boolean");
        }
        {
            /**
             * @member {Boolean} isDisabled
             */
            const slot = this.newSlot("isDisabled", false);
            slot.setOwnsSetter(true);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Boolean");
        }
        {
            /**
             * @member {Set} lockedStyleAttributeSet
             */
            const slot = this.newSlot("lockedStyleAttributeSet", null);
            slot.setSlotType("Set");
        }
    }

    /**
     * @description Initializes the StyledDomView.
     * @returns {StyledDomView}
     */
    init () {
        super.init()
        this.setLockedStyleAttributeSet(new Set());
        Broadcaster.shared().addListenerForName(this, "onActivateView"); // NOTE: do we want *every* view to do this 
        return this;
    }

    /**
     * @description Synchronizes the state from another view.
     * @param {StyledDomView} aView - The view to sync from.
     * @returns {StyledDomView}
     */
    syncStateFrom (aView) {
        this.setIsSelected(aView.isSelected())
        this.setIsActive(aView.isActive())
        return this
    }

    /**
     * @description Returns the theme class name path.
     * @returns {Array|null}
     */
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

    /**
     * @description Applies styles to the view.
     * @returns {StyledDomView}
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

    /**
     * @description Handles the update of the isActive slot.
     * @param {*} oldValue - The old value of the slot.
     * @param {*} newValue - The new value of the slot.
     * @returns {StyledDomView}
     */
    didUpdateSlotIsActive (oldValue, newValue) {
        // sent by hooked setter
        this.updateSubviews()
        return this
    }

    /**
     * @description Activates the view.
     */
    activate () {
        this.select()
        this.setIsActive(true)
        Broadcaster.shared().broadcastNameAndArgument("onActivateView", this)
    }

    /**
     * @description Handles the activation of a view.
     * @param {StyledDomView} aView - The view that was activated.
     */
    onActivateView (aView) {
        if (aView !== this & this.isActive()) {
            this.setIsActive(false)
        }
    }

    /**
     * @description Handles the update of the isSelected slot.
     * @param {*} oldValue - The old value of the slot.
     * @param {*} newValue - The new value of the slot.
     * @returns {StyledDomView}
     */
    didUpdateSlotIsSelected (oldValue, newValue) {
        // sent by hooked setter
        this.updateSubviews()
        return this
    }

    /**
     * @description Toggles the selection state of the view.
     * @returns {StyledDomView}
     */
    toggleSelection () {
        if (this.isSelected()) {
            this.unselect()
        } else {
            this.select()
        }
        return this
    }

    /**
     * @description Selects the view.
     * @returns {StyledDomView}
     */
    select () {
        this.setIsSelected(true)
        return this
    }

    /**
     * @description Unselects the view.
     * @returns {StyledDomView}
     */
    unselect () {
        if (this.isSelected()) { // for debugging 
            this.setIsSelected(false)
        }
        return this
    }

    /**
     * @description Returns the theme path array.
     * @returns {Array}
     */
    themePathArray () {
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

    /**
     * @description Returns the theme path string.
     * @returns {string}
     */
    themePathString () {
        return this.themePathArray().join(" / ")
    }

    /**
     * @description Returns the current theme class.
     * @returns {*|null}
     */
    currentThemeClass () {
        const theme = BMThemeResources.shared().activeTheme()
        if (!theme) {
            return null
        }
        const className = this.themeClassName() ? this.themeClassName() : "DefaultThemeClass"
        const themeClass = theme.themeClassNamed(className)
        return themeClass
    }

    /**
     * @description Returns the current theme state name.
     * @returns {string}
     */
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

    /**
     * @description Returns the current theme state.
     * @returns {*|null}
     */
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

    /**
     * @description Returns the theme value for a given attribute.
     * @param {string} attributeName - The name of the attribute.
     * @returns {*|null}
     */
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
                return value
            }
        }

        return null
    }

    /**
     * @description Returns the current color.
     * @returns {string}
     */
    currentColor () {
        const v = this.themeValueForAttribute("color")
        if (v) {
            return v
        }
        return "inherit"
    }

    /**
     * @description Returns the current background color.
     * @returns {string}
     */
    currentBgColor () {
        const v = this.themeValueForAttribute("backgroundColor")
        if (v) {
            return v
        }
        return "inherit"
    }

    /**
     * @description Resyncs all views.
     * @returns {StyledDomView}
     */
    resyncAllViews () {
        this.syncStylesToSubviews()
        this.applyStyles()
        super.resyncAllViews()
        return this
    }

    /**
     * @description Syncs styles to subviews.
     * @returns {StyledDomView}
     */
    syncStylesToSubviews () {
        return this
    }
	
}.initThisClass());