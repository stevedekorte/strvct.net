"use strict";

/**
 * @class BreadCrumbButton
 * @extends NodeView
 * @category UI Components
 * 
 * A button view that can get (and keep up to date) its title from
 * a node. This is helpful for breadcrumbs as node names can change.
 */
(class BreadCrumbButton extends NodeView {
    
    // --- copied from ButtonView ---

    /**
     * Initializes prototype slots for the BreadCrumbButton.
     */
    initPrototypeSlots () {
        this.newSlot("titleView", null)
        this.newSlot("isEnabled", true)
        this.newSlot("iconView", null)
        this.newSlot("info", null)
    }

    /**
     * Initializes the BreadCrumbButton instance.
     * @returns {BreadCrumbButton} The initialized instance.
     */
    init () {
        super.init()
        this.setDisplay("flex")
        this.flexCenterContent()
        this.setHeight("fit-content")
        this.setWidth("100%")
        this.setMinHeight("1em")

        this.setPaddingTop("0.75em")
        this.setPaddingBottom("0.85em")

        this.setPaddingLeft("1em")
        this.setPaddingRight("1em")

        this.turnOffUserSelect()
        this.setBorderRadiusPx(1)
        
        {
            const tv = TextField.clone()
            this.setTitleView(tv)
            this.addSubview(tv)
            tv.fillParentView()
            tv.setPaddingTop("0.1em").setPaddingBottom("0.1em")
            tv.setPaddingLeft("1em").setPaddingRight("1em")
            tv.flexCenterContent()
            tv.setTextAlign("center")
            tv.setMinHeight("1em")
            tv.setWhiteSpace("nowrap")
            tv.setTextOverflow("ellipsis")
        }

        this.setTitle("")

        const icon = SvgIconView.clone()
        icon.setMinAndMaxWidth(12)
        icon.setMinAndMaxHeight(15)
        icon.setFillColor("white")
        icon.setStrokeColor("white")
        icon.setOpacity(1)
        icon.hideDisplay()
        this.setIconView(this.addSubview(icon))

        this.addDefaultTapGesture()

        return this
    }

    /**
     * Sets the icon name for the button.
     * @param {string} aName - The name of the icon.
     * @returns {BreadCrumbButton} The instance for chaining.
     */
    setIconName (aName) {
        this.iconView().setIconName(aName)
        return this
    }

    /**
     * Sets the title of the button.
     * @param {string} s - The title to set.
     * @returns {BreadCrumbButton} The instance for chaining.
     */
    setTitle (s) {
        if (s === "" || Type.isNullOrUndefined(s)) { 
            s = " ";
        }

        this.titleView().setValue(s)
        return this
    }

    /**
     * Gets the title of the button.
     * @returns {string} The current title.
     */
    title () {
        return this.titleView().value()
    }

    /**
     * Sets whether the button has an outline.
     * @param {boolean} aBool - True to set an outline, false otherwise.
     * @returns {BreadCrumbButton} The instance for chaining.
     */
    setHasOutline (aBool) {
        if (aBool) {
            this.setBoxShadow("0px 0px 1px 1px rgba(255, 255, 255, 0.2)")
        } else {
            this.setBoxShadow("none")
        }
        return this
    }

    /**
     * Sets the visibility of the title.
     * @param {boolean} aBool - True to make the title visible, false to hide it.
     * @returns {BreadCrumbButton} The instance for chaining.
     */
    setTitleIsVisible (aBool) {
        this.titleView().setDisplayIsHidden(!aBool)
        return this
    }

    /**
     * Sets whether the title is editable.
     * @param {boolean} aBool - True to make the title editable, false otherwise.
     * @returns {BreadCrumbButton} The instance for chaining.
     */
    setIsEditable (aBool) {
        this.titleView().setIsEditable(aBool)
        return this
    }

    /**
     * Checks if the title is editable.
     * @returns {boolean} True if the title is editable, false otherwise.
     */
    isEditable () {
        return this.titleView().isEditable()
    }

    /**
     * Sends an action to the target if the button is not editable.
     * @returns {BreadCrumbButton} The instance for chaining.
     */
    sendActionToTarget () {
        if (!this.isEditable()) {
            super.sendActionToTarget()
        }
        return this
    }

    /**
     * Handles the tap complete gesture.
     * @param {Gesture} aGesture - The gesture object.
     * @returns {boolean} False to indicate the gesture is handled.
     */
    onTapComplete (aGesture) {
        this.sendActionToTarget()
        return false
    }

    // --- not in ButtonView ---

    /*
    syncFromNode () {
        super.syncFromNode()
        if (this.node()) {
            this.setTitle(this.node().title())
        } else {
            this.setTitle("")
        }
        return this
    }
    */
    
}.initThisClass());
