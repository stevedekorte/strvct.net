/**
 * @module library.view.dom.DomView
 */

/**
 * @class FlexDomView
 * @extends DomView
 * @classdesc FlexDomView is a specialized DomView that utilizes flexbox for layout.
 */
(class FlexDomView extends DomView {
    
    /**
     * @description Initializes the prototype slots for the FlexDomView.
     * @private
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the FlexDomView instance.
     * @returns {FlexDomView} The initialized instance.
     */
    init () {
        super.init()
        this.setDisplay("flex")
        return this
    }

    /**
     * @description Sets up the view to use flex and center its content.
     * @returns {FlexDomView} The current instance.
     */
    makeFlexAndCenterContent () {
        this.setDisplay("flex")
        this.setAlignItems("center")
        this.setJustifyContent("center")
        return this
    }

    /**
     * @description Checks if the view can be split.
     * @returns {boolean} True if the view has no subviews, false otherwise.
     */
    canSplit () {
        return this.subviews().length === 0
    }

    /**
     * @description Adds a specified number of subviews to the current view.
     * @param {number} count - The number of subviews to add.
     * @returns {FlexDomView} The current instance.
     */
    addSubviewCount (count) {
        for (let i = 0; i < count; i++) {
            this.newFlexSubview()     
        }
        return this
    }

    /**
     * @description Creates and adds a new flex subview to the current view.
     * @returns {FlexDomView} The newly created subview.
     */
    newFlexSubview () {
        const v = FlexDomView.clone()
        v.setDisplay("flex")
        v.setMinHeight("0em")
        v.setMinWidth("0em")
        const order = this.subviews().length
        v.setOrder(order)
        this.addSubview(v) 
        return v
    }

    /**
     * @description Sets the order of subviews to match their index in the subviews array.
     */
    makeSubviewsOrdered () {
        this.subviews().forEachKV((i, sv) => {
            sv.setOrder(i)
        })
    }

    /**
     * @description Sets the order of subviews to be the reverse of their index in the subviews array.
     */
    makeSubviewsReverseOrdered () {
        const count = this.subviews().length
        this.subviews().forEachKV((i, sv) => {
            sv.setOrder(count - 1 - i)
        })
    }

    /**
     * @description Splits the view into a specified number of tiles arranged vertically.
     * @param {number} count - The number of tiles to create.
     * @returns {FlexDomView} The current instance.
     */
    flexSplitIntoTiles (count) {
        assert(this.canSplit()) // temporary
        this.setDisplay("flex")
        this.setFlexDirection("column")
        this.addSubviewCount(count)
        this.debugBorders()
        return this
    }

    /**
     * @description Splits the view into a specified number of columns arranged horizontally.
     * @param {number} count - The number of columns to create.
     * @returns {FlexDomView} The current instance.
     */
    flexSplitIntoColumns (count) {
        assert(this.canSplit()) // temporary
        this.setDisplay("flex")
        this.setFlexDirection("row")
        this.addSubviewCount(count)
        this.debugBorders()
        return this
    }

    /**
     * @description Centers the content of the flex container both horizontally and vertically.
     * @returns {FlexDomView} The current instance.
     */
    flexCenterContent () {
        this.setJustifyContent("center")
        this.setAlignItems("center")
        return this
    }

    /**
     * @description Sets up the view with standard flex properties.
     * @returns {FlexDomView} The current instance.
     */
    makeStandardFlexView () {
        this.setDisplay("flex")
        this.setPosition("relative")
        this.flexCenterContent()
        this.setOverflow("hidden")
        return this
    }

    /**
     * @description Adds debug borders to subviews (currently commented out).
     * @private
     */
    debugBorders () {
        //this.subviews().forEach(sv => sv.setBorder("1px solid rgba(255, 255, 255, 0.2)"))
    }

}.initThisClass());