/**
 * @module library.view.dom.SvDomView
 */

/**
 * @class SvFlexDomView
 * @extends SvDomView
 * @classdesc SvFlexDomView is a specialized SvDomView that utilizes flexbox for layout.
 */
(class SvFlexDomView extends SvDomView {

    /**
     * @description Initializes the prototype slots for the SvFlexDomView.
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the SvFlexDomView instance.
     * @returns {SvFlexDomView} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setDisplay("flex");
        return this;
    }

    /**
     * @description Sets up the view to use flex and center its content.
     * @returns {SvFlexDomView} The current instance.
     * @category Layout
     */
    makeFlexAndCenterContent () {
        this.setDisplay("flex");
        this.setAlignItems("center");
        this.setJustifyContent("center");
        return this;
    }

    /**
     * @description Checks if the view can be split.
     * @returns {boolean} True if the view has no subviews, false otherwise.
     * @category Layout
     */
    canSplit () {
        return this.subviews().length === 0;
    }

    /**
     * @description Adds a specified number of subviews to the current view.
     * @param {number} count - The number of subviews to add.
     * @returns {SvFlexDomView} The current instance.
     * @category Subview Management
     */
    addSubviewCount (count) {
        for (let i = 0; i < count; i++) {
            this.newFlexSubview();
        }
        return this;
    }

    /**
     * @description Creates and adds a new flex subview to the current view.
     * @returns {SvFlexDomView} The newly created subview.
     * @category Subview Management
     */
    newFlexSubview () {
        const v = SvFlexDomView.clone();
        v.setDisplay("flex");
        v.setMinHeight("0em");
        v.setMinWidth("0em");
        const order = this.subviews().length;
        v.setOrder(order);
        this.addSubview(v);
        return v;
    }

    /**
     * @description Sets the order of subviews to match their index in the subviews array.
     * @category Subview Management
     */
    makeSubviewsOrdered () {
        this.subviews().forEachKV((i, sv) => {
            sv.setOrder(i);
        });
    }

    /**
     * @description Sets the order of subviews to be the reverse of their index in the subviews array.
     * @category Subview Management
     */
    makeSubviewsReverseOrdered () {
        const count = this.subviews().length;
        this.subviews().forEachKV((i, sv) => {
            sv.setOrder(count - 1 - i);
        });
    }

    /**
     * @description Splits the view into a specified number of tiles arranged vertically.
     * @param {number} count - The number of tiles to create.
     * @returns {SvFlexDomView} The current instance.
     * @category Layout
     */
    flexSplitIntoTiles (count) {
        assert(this.canSplit()); // temporary
        this.setDisplay("flex");
        this.setFlexDirection("column");
        this.addSubviewCount(count);
        this.debugBorders();
        return this;
    }

    /**
     * @description Splits the view into a specified number of columns arranged horizontally.
     * @param {number} count - The number of columns to create.
     * @returns {SvFlexDomView} The current instance.
     * @category Layout
     */
    flexSplitIntoColumns (count) {
        assert(this.canSplit()); // temporary
        this.setDisplay("flex");
        this.setFlexDirection("row");
        this.addSubviewCount(count);
        this.debugBorders();
        return this;
    }

    /**
     * @description Centers the content of the flex container both horizontally and vertically.
     * @returns {SvFlexDomView} The current instance.
     * @category Layout
     */
    flexCenterContent () {
        this.setJustifyContent("center");
        this.setAlignItems("center");
        return this;
    }

    /**
     * @description Sets up the view with standard flex properties.
     * @returns {SvFlexDomView} The current instance.
     * @category Layout
     */
    makeStandardFlexView () {
        this.setDisplay("flex");
        this.setPosition("relative");
        this.flexCenterContent();
        this.setOverflow("hidden");
        return this;
    }

    /**
     * @description Adds debug borders to subviews (currently commented out).
     * @private
     * @category Debugging
     */
    debugBorders () {
        //this.subviews().forEach(sv => sv.setBorder("1px solid rgba(255, 255, 255, 0.2)"))
    }

}.initThisClass());
